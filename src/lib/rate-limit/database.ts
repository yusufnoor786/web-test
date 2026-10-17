import { prisma } from '../prisma';
import { RateLimiter, RateLimitPolicy, RateLimitResult } from './types';

/**
 * DatabaseRateLimiter implements the Fixed Window Counter algorithm
 * backed by the RateLimitBucket table.
 *
 * Atomicity: Uses Prisma upsert which translates to:
 * INSERT INTO "RateLimitBucket" ... ON CONFLICT ("key") DO UPDATE SET "tokens" = "tokens" + 1
 * ensuring serialization under concurrent requests.
 */
export class DatabaseRateLimiter implements RateLimiter {
  async limit(identifier: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
    const nowMs = Date.now();
    const windowMs = policy.windowSeconds * 1000;
    const windowStart = Math.floor(nowMs / windowMs) * windowMs;
    const expiresAt = new Date(windowStart + windowMs);

    // Format: prefix:identifier:windowStartEpoch
    const bucketKey = `${policy.prefix}:${identifier}:${windowStart}`;

    const bucket = await prisma.rateLimitBucket.upsert({
      where: { key: bucketKey },
      update: {
        tokens: { increment: 1 },
      },
      create: {
        key: bucketKey,
        tokens: 1,
        expiresAt,
      },
      select: {
        tokens: true,
      },
    });

    const tokens = bucket.tokens;
    const success = tokens <= policy.maxRequests;
    const remaining = Math.max(0, policy.maxRequests - tokens);
    const resetSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - nowMs) / 1000));

    return {
      success,
      tokens,
      remaining,
      resetSeconds,
      expiresAt,
    };
  }

  /**
   * Cleans up expired rate limit buckets.
   */
  async cleanup(): Promise<number> {
    const res = await prisma.rateLimitBucket.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return res.count;
  }
}
