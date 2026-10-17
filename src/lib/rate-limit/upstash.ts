import { RateLimiter, RateLimitPolicy, RateLimitResult } from './types';
import { DatabaseRateLimiter } from './database';

/**
 * UpstashRateLimiter implements atomic Fixed Window Counter using Upstash Redis REST API.
 * Preserves identical security semantics and falls back to DatabaseRateLimiter if unconfigured.
 */
export class UpstashRateLimiter implements RateLimiter {
  private url: string;
  private token: string;
  private fallback: DatabaseRateLimiter;

  constructor(url?: string, token?: string) {
    this.url = url || process.env.UPSTASH_REDIS_REST_URL || '';
    this.token = token || process.env.UPSTASH_REDIS_REST_TOKEN || '';
    this.fallback = new DatabaseRateLimiter();
  }

  async limit(identifier: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
    if (!this.url || !this.token) {
      return this.fallback.limit(identifier, policy);
    }

    const nowMs = Date.now();
    const windowMs = policy.windowSeconds * 1000;
    const windowStart = Math.floor(nowMs / windowMs) * windowMs;
    const expiresAt = new Date(windowStart + windowMs);
    const ttlSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - nowMs) / 1000));

    const bucketKey = `${policy.prefix}:${identifier}:${windowStart}`;

    try {
      // Execute atomic pipeline: INCR bucketKey, EXPIRE bucketKey ttlSeconds
      const response = await fetch(`${this.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', bucketKey],
          ['EXPIRE', bucketKey, ttlSeconds],
        ]),
      });

      if (!response.ok) {
        console.warn('[UpstashRateLimiter] Upstash HTTP error, falling back to database:', response.status);
        return this.fallback.limit(identifier, policy);
      }

      const results = await response.json();
      // results is an array of responses: [ { result: count }, { result: 1 } ]
      const tokens = Number(results[0]?.result) || 1;
      const success = tokens <= policy.maxRequests;
      const remaining = Math.max(0, policy.maxRequests - tokens);

      return {
        success,
        tokens,
        remaining,
        resetSeconds: ttlSeconds,
        expiresAt,
      };
    } catch (err) {
      console.warn('[UpstashRateLimiter] Redis connection failed, falling back to database:', err);
      return this.fallback.limit(identifier, policy);
    }
  }

  async cleanup(): Promise<number> {
    // Redis handles expiration automatically via TTL
    return 0;
  }
}
