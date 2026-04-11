/**
 * API Response Caching
 * In-memory cache with TTL for frequently accessed data.
 * Supports dashboard stats, leaderboard, achievements, etc.
 */

interface CacheEntry<T = unknown> {
  data: T
  expiresAt: number
  createdAt: number
  hits: number
}

class ResponseCache {
  private store = new Map<string, CacheEntry>()
  private defaultTTL = 30_000 // 30 seconds default

  set<T>(key: string, data: T, ttlMs?: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs || this.defaultTTL),
      createdAt: Date.now(),
      hits: 0,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    // Expired
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return null
    }

    entry.hits++
    return entry.data as T
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  invalidatePattern(pattern: string): void {
    for (const [key] of this.store) {
      if (key.includes(pattern)) this.store.delete(key)
    }
  }

  clear(): void {
    this.store.clear()
  }

  getStats() {
    const now = Date.now()
    let totalEntries = 0
    let totalHits = 0
    let expiredEntries = 0

    for (const [key, entry] of this.store) {
      totalEntries++
      totalHits += entry.hits
      if (entry.expiresAt < now) expiredEntries++
    }

    return { totalEntries, totalHits, expiredEntries, hitRate: totalEntries > 0 ? totalHits / totalEntries : 0 }
  }
}

export const cache = new ResponseCache()

// Cache key generators
export const cacheKeys = {
  dashboard: (period: string) => `dashboard:${period}`,
  leaderboard: (period: string) => `leaderboard:${period}`,
  achievements: () => 'achievements',
  goals: () => 'goals',
  agents: () => 'agents',
  settings: () => 'settings',
  trending: (category: string) => `trending:${category}`,
  analytics: (period: string) => `analytics:${period}`,
}

// Cache TTL presets
export const cacheTTL = {
  short: 15_000,    // 15 seconds
  medium: 30_000,   // 30 seconds
  long: 60_000,     // 1 minute
  veryLong: 5 * 60_000, // 5 minutes
}
