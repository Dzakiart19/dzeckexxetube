/**
 * Fixed-window per-key rate limiter (in-memory, per server instance).
 *
 * Keys are composed as "<bucket>:<ip>". The limiter protects upstream hosts
 * from abuse relayed through this application. For multi-instance production
 * deployments this should be replaced by a shared store (e.g. Redis).
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;
let lastSweepAt = Date.now();

function sweep(now: number): void {
  if (now - lastSweepAt < 30_000) return;
  lastSweepAt = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Hard cap to keep memory bounded under abusive traffic.
  if (buckets.size > MAX_TRACKED_KEYS) {
    const excess = buckets.size - MAX_TRACKED_KEYS;
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      removed += 1;
      if (removed >= excess) break;
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
}

export function checkRateLimit(key: string, limitPerMinute: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, remaining: limitPerMinute - 1, retryAfterSeconds: 0, limit: limitPerMinute };
  }

  if (bucket.count >= limitPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      limit: limitPerMinute,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limitPerMinute - bucket.count),
    retryAfterSeconds: 0,
    limit: limitPerMinute,
  };
}
