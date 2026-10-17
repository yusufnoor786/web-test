export interface RateLimitPolicy {
  prefix: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  tokens: number;
  remaining: number;
  resetSeconds: number;
  expiresAt: Date;
}

export interface RateLimiter {
  limit(identifier: string, policy: RateLimitPolicy): Promise<RateLimitResult>;
  cleanup?(): Promise<number>;
}
