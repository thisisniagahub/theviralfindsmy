/**
 * Redis-Backed Cache with In-Memory Fallback
 *
 * Wraps the existing in-memory cache with Redis for distributed caching.
 * Always writes to in-memory cache for fast local access.
 * Falls back to in-memory only when Redis is unavailable.
 */

import { getRedis, isRedisAvailable } from './redis'
import { cache as inMemoryCache, cacheTTL } from './cache'

export class RedisBackedCache {
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedis()

    // Try Redis first if available
    if (redis && isRedisAvailable()) {
      try {
        const data = await redis.get(key)
        if (data) {
          return JSON.parse(data as string) as T
        }
      } catch (error) {
        console.warn('Redis get failed, using in-memory fallback:', error)
      }
    }

    // Fallback to in-memory
    return inMemoryCache.get<T>(key)
  }

  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    const redis = getRedis()
    const ttl = ttlMs || cacheTTL.medium

    // Always write to in-memory cache for fast local access
    inMemoryCache.set(key, data, ttl)

    // Also write to Redis if available
    if (redis && isRedisAvailable()) {
      try {
        await redis.set(key, JSON.stringify(data), { ex: Math.floor(ttl / 1000) })
      } catch (error) {
        console.warn('Redis set failed:', error)
      }
    }
  }

  async invalidate(key: string): Promise<void> {
    inMemoryCache.invalidate(key)

    const redis = getRedis()
    if (redis && isRedisAvailable()) {
      try {
        await redis.del(key)
      } catch (error) {
        console.warn('Redis delete failed:', error)
      }
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    inMemoryCache.invalidatePattern(pattern)

    const redis = getRedis()
    if (redis && isRedisAvailable()) {
      try {
        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      } catch (error) {
        console.warn('Redis pattern delete failed:', error)
      }
    }
  }

  async clear(): Promise<void> {
    inMemoryCache.clear()

    const redis = getRedis()
    if (redis && isRedisAvailable()) {
      try {
        const keys = await redis.keys('*')
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      } catch (error) {
        console.warn('Redis clear failed:', error)
      }
    }
  }
}

// Export singleton
export const redisCache = new RedisBackedCache()
