interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private maxEntries: number;
  private defaultTTLMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxEntries = 1000, defaultTTLMs = 15 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTTLMs = defaultTTLMs;

    // Periodically prune expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.prune();
    }, 5 * 60 * 1000);

    // Unref interval so it doesn't hold process open
    if (this.cleanupInterval?.unref) {
      this.cleanupInterval.unref();
    }
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    // If over limit, delete oldest entries (FIFO eviction)
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    const expiresAt = Date.now() + (ttlMs ?? this.defaultTTLMs);
    this.store.set(key, { value, expiresAt });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

export const appCache = new MemoryCache(1500, 15 * 60 * 1000); // 15 mins default
