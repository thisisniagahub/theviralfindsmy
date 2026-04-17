/**
 * API Response Caching
 * PRIMARY: Upstash Redis for production scalability
 * FALLBACK: In-memory Map for local dev only
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
    // Only start in-memory cleanup in development
    if (process.env.NODE_ENV !== 'production') {
      this.startCleanup()
    }
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

  private isProductionRedisRequired(): boolean {
    if (process.env.NODE_ENV === 'production' && !redis.isRedisAvailable()) {
      throw new Error('[Cache] Redis is required in production. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.')
    }
    return redis.isRedisAvailable()
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL

    // In production, require Redis
    if (process.env.NODE_ENV === 'production') {
      this.isProductionRedisRequired()
      const ttlSec = Math.ceil(ttl / 1000)
      void redis.set(key, JSON.stringify({ data, expiresAt: Date.now() + ttl }), ttlSec)
      return
    }

    // Development: use in-memory with optional Redis sync
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
      hits: 0,
    })

    // Sync to Redis asynchronously when available
    if (redis.isRedisAvailable()) {
      const ttlSec = Math.ceil(ttl / 1000)
      void redis.set(key, JSON.stringify({ data, expiresAt: Date.now() + ttl }), ttlSec)
    }
  }

  get<T>(key: string): T | null {
    // In production, require Redis
    if (process.env.NODE_ENV === 'production') {
      this.isProductionRedisRequired()
      // Async Redis get would require API changes, so we return null for now
      // For sync Redis access in production, use cache-redis.ts (RedisBackedCache)
      return null
    }

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

  async getAsync<T>(key: string): Promise<T | null> {
    // Try Redis first if available
    if (redis.isRedisAvailable()) {
      try {
        const data = await redis.get(key)
        if (data) {
          const parsed = JSON.parse(data)
          // Check if expired
          if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
            await redis.del(key)
            return null
          }
          return parsed.data as T
        }
      } catch (error) {
        console.warn('[Cache] Redis get failed:', error)
      }
    }

    // Production: fail fast if Redis not available
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Cache] Redis is required in production for caching. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.')
    }

    // Fallback to in-memory
    return this.get<T>(key)
  }

  invalidate(key: string): void {
    // In production, require Redis
    if (process.env.NODE_ENV === 'production') {
      this.isProductionRedisRequired()
      void redis.del(key)
      return
    }

    this.store.delete(key)
    if (redis.isRedisAvailable()) {
      void redis.del(key)
    }
  }

  async invalidateAsync(key: string): Promise<void> {
    this.store.delete(key)

    if (redis.isRedisAvailable()) {
      try {
        await redis.del(key)
      } catch (error) {
        console.warn('[Cache] Redis delete failed:', error)
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('[Cache] Redis is required in production. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.')
    }
  }

  invalidatePattern(pattern: string): void {
    // In production, require Redis
    if (process.env.NODE_ENV === 'production') {
      this.isProductionRedisRequired()
      // Pattern invalidation with Redis requires KEYS command
      // For now, just throw to indicate this needs Redis
      throw new Error('[Cache] Pattern invalidation in production requires direct Redis access. Use invalidatePatternAsync.')
    }

    for (const [key] of this.store) {
      if (key.includes(pattern)) {
        this.store.delete(key)
        if (redis.isRedisAvailable()) {
          void redis.del(key)
        }
      }
    }
  }

  async invalidatePatternAsync(pattern: string): Promise<void> {
    // Clear in-memory matches
    for (const [key] of this.store) {
      if (key.includes(pattern)) {
        this.store.delete(key)
      }
    }

    // Clear Redis matches
    if (redis.isRedisAvailable()) {
      try {
        const redisClient = redis.getRedis()
        if (redisClient) {
          const keys = await redisClient.keys(`*${pattern}*`)
          if (keys.length > 0) {
            await redisClient.del(...keys)
          }
        }
      } catch (error) {
        console.warn('[Cache] Redis pattern delete failed:', error)
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('[Cache] Redis is required in production. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.')
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
