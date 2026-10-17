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

/**
 * Authenticates an admin user by email and scrypt password.
 * Checks isActive status.
 */
export async function authenticateAdmin(
  email: string,
  passwordPlain: string
): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = verifyPassword(passwordPlain, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
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

  await prisma.adminSession.create({
    data: {
      adminUserId,
      sessionHash,
      expiresAt,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    },
  });

  // 1. Set HttpOnly Admin Session Cookie
  response.cookies.set(ADMIN_SESSION_COOKIE, rawToken, {
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
  let rawToken: string | undefined;

  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    rawToken = (req as NextRequest).cookies.get(ADMIN_SESSION_COOKIE)?.value;
  } else {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_SESSION_COOKIE}=([^;]*)`));
    rawToken = match ? decodeURIComponent(match[1]) : undefined;
  }

  if (!rawToken || rawToken.length < 32) {
    return null;
  }

  const sessionHash = hashToken(rawToken);

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
