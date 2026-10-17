import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const CSRF_COOKIE_NAME = 'ga_csrf_token';
export const CSRF_HEADER_NAME = 'x-ga-csrf-token';

/**
 * Generates a cryptographically random CSRF token (32 bytes hex).
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Attaches the CSRF token cookie to the response.
 * Note: httpOnly is false because modern SPAs/fetch clients read the cookie
 * and attach it to the custom request header (Double-Submit Cookie Pattern).
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60, // 24 hours
  });
}

/**
 * Validates the CSRF token using the double-submit cookie & header strategy.
 * Returns true if valid, false otherwise.
 */
export function validateCsrfToken(req: NextRequest | Request): boolean {
  let cookieToken: string | undefined;

  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    cookieToken = (req as NextRequest).cookies.get(CSRF_COOKIE_NAME)?.value;
  } else {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`));
    cookieToken = match ? decodeURIComponent(match[1]) : undefined;
  }

  const headerToken = req.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use timingSafeEqual to avoid timing side-channels
  try {
    const cookieBuf = Buffer.from(cookieToken);
    const headerBuf = Buffer.from(headerToken);

    if (cookieBuf.length !== headerBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(cookieBuf, headerBuf);
  } catch {
    return false;
  }
}
