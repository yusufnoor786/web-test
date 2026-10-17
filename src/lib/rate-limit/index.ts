import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, RateLimitPolicy, RateLimitResult } from './types';
import { DatabaseRateLimiter } from './database';
import { UpstashRateLimiter } from './upstash';
import { getClientIp, normalizeIp } from './ip';

export * from './types';
export * from './ip';
export * from './database';
export * from './upstash';

// Standard Architectural Rate Limit Policies
export const RATE_LIMIT_POLICIES = {
  CHECKOUT: {
    prefix: 'checkout_ip',
    maxRequests: 10,
    windowSeconds: 15 * 60, // 10 per 15 minutes
  },
  MAGIC_LINK_EMAIL: {
    prefix: 'magic_email',
    maxRequests: 3,
    windowSeconds: 15 * 60, // 3 per 15 minutes per email
  },
  MAGIC_LINK_IP: {
    prefix: 'magic_ip',
    maxRequests: 10,
    windowSeconds: 15 * 60, // 10 per 15 minutes per IP
  },
  DOWNLOAD_GRANT: {
    prefix: 'dl_grant',
    maxRequests: 10,
    windowSeconds: 60 * 60, // 10 per 1 hour per entitlement
  },
  DOWNLOAD_STREAM: {
    prefix: 'dl_stream',
    maxRequests: 5,
    windowSeconds: 60, // 5 per 1 minute per IP
  },
  ADMIN_LOGIN: {
    prefix: 'admin_login',
    maxRequests: 5,
    windowSeconds: 15 * 60, // 5 per 15 minutes per IP
  },
} as const;

let singletonLimiter: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!singletonLimiter) {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      singletonLimiter = new UpstashRateLimiter();
    } else {
      singletonLimiter = new DatabaseRateLimiter();
    }
  }
  return singletonLimiter;
}

/**
 * Enforces rate limiting on an incoming NextRequest.
 * Returns null if allowed, or an HTTP 429 NextResponse with standard headers if rejected.
 */
export async function enforceRateLimit(
  req: NextRequest | Request,
  policy: RateLimitPolicy,
  customIdentifier?: string
): Promise<NextResponse | null> {
  const limiter = getRateLimiter();
  const identifier = customIdentifier ? customIdentifier.trim().toLowerCase() : getClientIp(req);

  const result = await limiter.limit(identifier, policy);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please slow down and try again later.',
        retryAfter: result.resetSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': result.resetSeconds.toString(),
          'X-RateLimit-Limit': policy.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(result.expiresAt.getTime() / 1000).toString(),
        },
      }
    );
  }

  return null;
}
