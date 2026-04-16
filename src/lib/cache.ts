/**
 * API Response Caching
 * Uses in-memory Map as primary store (fast local reads).
 * Optionally syncs to Upstash Redis when configured (cross-instance sharing).
 * Supports dashboard stats, leaderboard, achievements, etc.
 */

import * as redis from './redis'

interface CacheEntry<T = unknown> {
  data: T
  expiresAt: number
  createdAt: number
  hits: number
}

class ResponseCache {
  private store = new Map<string, CacheEntry>()
  private defaultTTL = 30_000 // 30 seconds default
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.startCleanup()
  }

  private startCleanup() {
    // Proactive cleanup of expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store) {
        if (entry.expiresAt < now) {
          this.store.delete(key)
        }
      }
    }, 60_000)
    if (this.cleanupInterval.unref) this.cleanupInterval.unref()
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs || this.defaultTTL),
      createdAt: Date.now(),
      hits: 0,
    })

    // Sync to Redis asynchronously when available
    if (redis.isRedisAvailable()) {
      const ttlSec = ttlMs ? Math.ceil(ttlMs / 1000) : Math.ceil(this.defaultTTL / 1000)
      void redis.set(key, JSON.stringify({ data, expiresAt: Date.now() + ttlSec * 1000 }), ttlSec)
    }
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
    if (redis.isRedisAvailable()) {
      void redis.del(key)
    }
  }

  invalidatePattern(pattern: string): void {
    for (const [key] of this.store) {
      if (key.includes(pattern)) {
        this.store.delete(key)
        if (redis.isRedisAvailable()) {
          void redis.del(key)
        }
      }
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

    for (const [, entry] of this.store) {
      totalEntries++
      totalHits += entry.hits
      if (entry.expiresAt < now) expiredEntries++
    }

    return {
      totalEntries,
      totalHits,
      expiredEntries,
      hitRate: totalEntries > 0 ? totalHits / totalEntries : 0,
      redisAvailable: redis.isRedisAvailable(),
    }
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
