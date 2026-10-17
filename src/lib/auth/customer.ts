import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '../prisma';
import { hashToken } from './crypto';

export interface CustomerSessionData {
  sessionId: string;
  customerId: string;
  customerEmail: string;
  customerName: string | null;
  expiresAt: Date;
}

const CUSTOMER_SESSION_COOKIE = 'ga_customer_session';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Creates and persists a fresh customer session, setting the HttpOnly cookie on the response.
 */
export async function createCustomerSession(
  customerId: string,
  response: NextResponse,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const sessionHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.customerSession.create({
    data: {
      customerId,
      sessionHash,
      expiresAt,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    },
  });

  response.cookies.set(CUSTOMER_SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  return rawToken;
}

/**
 * Verifies the customer session from incoming request cookies.
 * Returns customer session data or null if unauthenticated.
 */
export async function verifyCustomerSession(req: NextRequest | Request): Promise<CustomerSessionData | null> {
  let rawToken: string | undefined;

  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    rawToken = (req as NextRequest).cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  } else {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CUSTOMER_SESSION_COOKIE}=([^;]*)`));
    rawToken = match ? decodeURIComponent(match[1]) : undefined;
  }

  if (!rawToken || rawToken.length < 32) {
    return null;
  }

  const sessionHash = hashToken(rawToken);

  const session = await prisma.customerSession.findUnique({
    where: { sessionHash },
    include: {
      customer: true,
    },
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

  return {
    sessionId: session.id,
    customerId: session.customerId,
    customerEmail: session.customer.email,
    customerName: session.customer.name,
    expiresAt: session.expiresAt,
  };
}

/**
 * Revokes the active customer session.
 */
export async function revokeCustomerSession(req: NextRequest | Request, response?: NextResponse): Promise<void> {
  let rawToken: string | undefined;

  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    rawToken = (req as NextRequest).cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  }

  if (rawToken) {
    const sessionHash = hashToken(rawToken);
    await prisma.customerSession.updateMany({
      where: { sessionHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  if (response) {
    response.cookies.set(CUSTOMER_SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
}
