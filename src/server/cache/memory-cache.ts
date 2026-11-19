/**
 * Small TTL-based in-memory cache with entry cap. Used as a development /
 * single-instance cache in front of upstream fetches. It is intentionally
 * NOT a durable store: restarting the server clears everything, and entries
 * expire after their TTL.
 *
 * Note: only non-sensitive metadata is cached. Raw embed tokens are kept in
 * server memory only (never persisted to disk, database or client caches).
 */
export interface MemoryCacheStats {
  size: number;
  hits: number;
  misses: number;
}

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache<T> {
  private readonly store = new Map<string, Entry<T>>();
  private hits = 0;
  private misses = 0;

  constructor(private readonly maxEntries = 500) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    return entry.value;
  }

  set(key: string, value: T, ttlSeconds: number): void {
    if (this.store.size >= this.maxEntries) {
      // Evict the oldest entry (insertion order) when the cap is reached.
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  stats(): MemoryCacheStats {
    return { size: this.store.size, hits: this.hits, misses: this.misses };
  }
}

/**
 * Deduplicate concurrent async operations by key so multiple users asking
 * for the same resource at the same time trigger a single upstream fetch.
 */
export function withInflightDedup<T>(
  inflight: Map<string, Promise<T>>,
  key: string,
  factory: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = factory().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
