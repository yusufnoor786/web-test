import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '../prisma';
import { hashToken, verifyPassword } from './crypto';
import { generateCsrfToken, setCsrfCookie, validateCsrfToken } from './csrf';

export interface AdminSessionData {
  sessionId: string;
  adminUserId: string;
  email: string;
  name: string;
  role: string;
  expiresAt: Date;
}

export const ADMIN_SESSION_COOKIE = 'ga_admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours absolute TTL

const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD;

function signBootstrapToken(token: string, expiresMs: number): string {
  if (!ADMIN_SECRET) {
    throw new Error('ADMIN_SESSION_SECRET or ADMIN_PASSWORD must be configured in environment variables.');
  }
  const hmac = crypto.createHmac('sha256', ADMIN_SECRET).update(`${token}:${expiresMs}`).digest('hex');
  return `${token}.${expiresMs}.${hmac}`;
}

function verifyBootstrapToken(cookieValue: string): boolean {
  if (!ADMIN_SECRET) return false;
  try {
    const parts = cookieValue.split('.');
    if (parts.length !== 3) return false;
    const [token, expiresStr, hmac] = parts;
    const expiresMs = Number(expiresStr);
    if (!expiresMs || Date.now() > expiresMs) return false;
    const expectedHmac = crypto.createHmac('sha256', ADMIN_SECRET).update(`${token}:${expiresMs}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}

/**
 * Authenticates an admin user by email and scrypt password.
 * Checks database first. If database is unseeded, requires ADMIN_EMAIL & ADMIN_PASSWORD from private environment variables.
 */
export async function authenticateAdmin(
  email: string,
  passwordPlain: string
): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.isActive) {
      const isValid = verifyPassword(passwordPlain, user.passwordHash);
      if (isValid) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }
  } catch (err) {
    console.warn('[Admin Auth] Database lookup bypassed, checking environment variables:', err);
  }

  // Strict environment-variable authentication: NEVER use hardcoded fallback passwords
  const envEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;

  if (envEmail && envPassword && normalizedEmail === envEmail && passwordPlain === envPassword) {
    return {
      id: 'admin_bootstrap_env',
      email: envEmail,
      name: process.env.ADMIN_NAME || 'Archive Lead Administrator',
      role: 'OWNER',
    };
  }

  return null;
}

/**
 * Creates and persists a secure AdminSession, sets HttpOnly cookie and CSRF cookie on the response.
 */
export async function createAdminSession(
  adminUserId: string,
  response: NextResponse,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<{ rawToken: string; csrfToken: string }> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const sessionHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  let cookieValue = rawToken;

  if (adminUserId === 'admin_bootstrap_env') {
    cookieValue = signBootstrapToken(rawToken, expiresAt.getTime());
  } else {
    try {
      await prisma.adminSession.create({
        data: {
          adminUserId,
          sessionHash,
          expiresAt,
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      });
    } catch {
      cookieValue = signBootstrapToken(rawToken, expiresAt.getTime());
    }
  }

  // 1. Set HttpOnly Admin Session Cookie
  response.cookies.set(ADMIN_SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  // 2. Set Double-Submit CSRF Cookie
  const csrfToken = generateCsrfToken();
  setCsrfCookie(response, csrfToken);

  return { rawToken, csrfToken };
}

/**
 * Verifies an active AdminSession from cookies.
 * Enforces session expiration, revocation, and active account status.
 */
export async function verifyAdminSession(req: NextRequest | Request): Promise<AdminSessionData | null> {
  let cookieVal: string | undefined;

  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    cookieVal = (req as NextRequest).cookies.get(ADMIN_SESSION_COOKIE)?.value;
  } else {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_SESSION_COOKIE}=([^;]*)`));
    cookieVal = match ? decodeURIComponent(match[1]) : undefined;
  }

  if (!cookieVal || cookieVal.length < 32) {
    return null;
  }

  // If signed bootstrap token, verify HMAC signature
  if (cookieVal.includes('.')) {
    if (verifyBootstrapToken(cookieVal)) {
      const envEmail = (process.env.ADMIN_EMAIL || 'admin@thegrowtharchive.com').trim().toLowerCase();
      return {
        sessionId: 'sess_bootstrap_env',
        adminUserId: 'admin_bootstrap_env',
        email: envEmail,
        name: process.env.ADMIN_NAME || 'Archive Lead Administrator',
        role: 'OWNER',
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      };
    }
  }

  const sessionHash = hashToken(cookieVal);

  try {
    const session = await prisma.adminSession.findUnique({
      where: { sessionHash },
      include: { adminUser: true },
    });

    if (!session) {
      return null;
    }

    if (session.revokedAt) {
      return null;
    }

    if (session.expiresAt.getTime() < Date.now()) {
      return null;
    }

    if (!session.adminUser.isActive) {
      return null;
    }

    return {
      sessionId: session.id,
      adminUserId: session.adminUserId,
      email: session.adminUser.email,
      name: session.adminUser.name,
      role: session.adminUser.role,
      expiresAt: session.expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Rotates an existing admin session to prevent fixation and refresh TTL.
 */
export async function rotateAdminSession(
  req: NextRequest | Request,
  response: NextResponse,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<AdminSessionData | null> {
  const currentSession = await verifyAdminSession(req);
  if (!currentSession) {
    return null;
  }

  // Revoke previous session
  await prisma.adminSession.update({
    where: { id: currentSession.sessionId },
    data: { revokedAt: new Date() },
  });

  // Create fresh session
  await createAdminSession(currentSession.adminUserId, response, meta);
  return currentSession;
}

/**
 * Revokes the active admin session and clears cookies.
 */
export async function revokeAdminSession(req: NextRequest | Request, response?: NextResponse): Promise<void> {
  let rawToken: string | undefined;

  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    rawToken = (req as NextRequest).cookies.get(ADMIN_SESSION_COOKIE)?.value;
  }

  if (rawToken) {
    const sessionHash = hashToken(rawToken);
    await prisma.adminSession.updateMany({
      where: { sessionHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  if (response) {
    response.cookies.set(ADMIN_SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    response.cookies.set('ga_csrf_token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
}

/**
 * Creates an immutable AuditLog entry for privileged administrative actions.
 */
export async function logAuditEvent(params: {
  adminUserId?: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: params.details as any,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}

/**
 * API route guard that validates admin session and enforces double-submit CSRF for mutating requests.
 */
export async function requireAdminAuth(
  req: NextRequest
): Promise<{ session: AdminSessionData } | { errorResponse: NextResponse }> {
  // 1. Session verification
  const session = await verifyAdminSession(req);
  if (!session) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Admin authentication required' },
        { status: 401 }
      ),
    };
  }

  // 2. CSRF enforcement for state-changing HTTP methods
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutatingMethods.includes(req.method.toUpperCase())) {
    const isCsrfValid = validateCsrfToken(req);
    if (!isCsrfValid) {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden: Invalid or missing CSRF token' },
          { status: 403 }
        ),
      };
    }
  }

  return { session };
}
