import { DatabaseRateLimiter } from '../src/lib/rate-limit/database';
import { RATE_LIMIT_POLICIES } from '../src/lib/rate-limit';

async function main() {
  console.log('[Test Rate Limit] Starting concurrent rate limiter verification...');

  const limiter = new DatabaseRateLimiter();
  const testPolicy = {
    prefix: 'test_concurrency',
    maxRequests: 10,
    windowSeconds: 60, // 1 minute
  };

  const testIp = `test-ip-${Date.now()}`;
  console.log(`[Test Rate Limit] Testing identifier: ${testIp} (Limit: 10 per 60s)`);

  // Launch 15 concurrent requests
  const promises = Array.from({ length: 15 }, (_, i) => limiter.limit(testIp, testPolicy));
  const results = await Promise.all(promises);

  const successes = results.filter((r) => r.success);
  const rejections = results.filter((r) => !r.success);

  console.log(`[Test Rate Limit] Results: ${successes.length} approved, ${rejections.length} rejected`);

  if (successes.length !== 10) {
    throw new Error(`Expected exactly 10 approvals, got ${successes.length}`);
  }

  if (rejections.length !== 5) {
    throw new Error(`Expected exactly 5 rejections, got ${rejections.length}`);
  }

  // Verify rejection metadata
  const sampleRejection = rejections[0];
  if (sampleRejection.remaining !== 0) {
    throw new Error(`Expected remaining 0 on rejection, got ${sampleRejection.remaining}`);
  }
  if (sampleRejection.resetSeconds <= 0) {
    throw new Error(`Expected positive resetSeconds, got ${sampleRejection.resetSeconds}`);
  }

  console.log(`[Test Rate Limit] Concurrency assertion passed: Exactly 10/10 tokens consumed.`);
  console.log(`[Test Rate Limit] Sample rejection resetSeconds: ${sampleRejection.resetSeconds}s`);

  // Test cleanup
  const cleaned = await limiter.cleanup();
  console.log(`[Test Rate Limit] Cleanup executed: ${cleaned} expired buckets removed.`);

  console.log('[Test Rate Limit] ALL RATE LIMITER TESTS PASSED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('[Test Rate Limit] FAILED:', err);
  process.exit(1);
});
