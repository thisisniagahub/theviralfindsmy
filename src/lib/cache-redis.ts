/**
 * Redis-Backed Cache
 *
 * PRIMARY: Upstash Redis for production scalability
 * FALLBACK: In-memory Map for local dev only (with warning)
 *
 * In production, Redis is REQUIRED and will throw if not configured.
 */

import { getRedis, isRedisAvailable } from './redis'
import { cacheTTL } from './cache'

// Simple in-memory store for development fallback only
interface MemoryEntry {
  data: unknown
  expiresAt: number
}
const memoryStore = new Map<string, MemoryEntry>()

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function ensureRedisInProduction(): void {
  if (isProduction() && !isRedisAvailable()) {
    throw new Error('[RedisBackedCache] Redis is required in production. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.')
  }
}

function getMemoryEntry<T>(key: string): T | null {
  const entry = memoryStore.get(key)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(key)
    return null
  }
  return entry.data as T
}

function setMemoryEntry<T>(key: string, data: T, ttlMs: number): void {
  memoryStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  })
}

function deleteMemoryEntry(key: string): void {
  memoryStore.delete(key)
}

function clearMemory(): void {
  memoryStore.clear()
}

function deleteMemoryPattern(pattern: string): void {
  for (const [key] of memoryStore) {
    if (key.includes(pattern)) {
      memoryStore.delete(key)
    }
  }
}

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
        console.warn('[RedisBackedCache] Redis get failed:', error)
      }
    }

    // Production: fail fast if Redis not available
    ensureRedisInProduction()

    // Development: fallback to in-memory
    if (!isProduction()) {
      return getMemoryEntry<T>(key)
    }

    return null
  }

  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    const redis = getRedis()
    const ttl = ttlMs || cacheTTL.medium

    // Production: require Redis
    ensureRedisInProduction()

    // Development: always write to in-memory for fast local access
    if (!isProduction()) {
      setMemoryEntry(key, data, ttl)
    }

    // Write to Redis if available
    if (redis && isRedisAvailable()) {
      try {
        await redis.set(key, JSON.stringify(data), { ex: Math.floor(ttl / 1000) })
      } catch (error) {
        console.warn('[RedisBackedCache] Redis set failed:', error)
        // If Redis fails in production, re-throw
        if (isProduction()) {
          throw new Error(`[RedisBackedCache] Failed to set cache key "${key}" in Redis.`)
        }
      }
    }
  }

  async invalidate(key: string): Promise<void> {
    // Always clear in-memory in development
    if (!isProduction()) {
      deleteMemoryEntry(key)
    }

    const redis = getRedis()
    if (redis && isRedisAvailable()) {
      try {
        await redis.del(key)
      } catch (error) {
        console.warn('[RedisBackedCache] Redis delete failed:', error)
        if (isProduction()) {
          throw new Error(`[RedisBackedCache] Failed to invalidate cache key "${key}" in Redis.`)
        }
      }
    } else {
      ensureRedisInProduction()
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Always clear in-memory in development
    if (!isProduction()) {
      deleteMemoryPattern(pattern)
    }

    const redis = getRedis()
    if (redis && isRedisAvailable()) {
      try {
        const keys = await redis.keys(`*${pattern}*`)
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      } catch (error) {
        console.warn('[RedisBackedCache] Redis pattern delete failed:', error)
        if (isProduction()) {
          throw new Error(`[RedisBackedCache] Failed to invalidate pattern "${pattern}" in Redis.`)
        }
      }
    } else {
      ensureRedisInProduction()
    }
  }

  async clear(): Promise<void> {
    // Always clear in-memory in development
    if (!isProduction()) {
      clearMemory()
    }

    const redis = getRedis()
    if (redis && isRedisAvailable()) {
      try {
        const keys = await redis.keys('*')
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      } catch (error) {
        console.warn('[RedisBackedCache] Redis clear failed:', error)
        if (isProduction()) {
          throw new Error('[RedisBackedCache] Failed to clear cache in Redis.')
        }
      }
    } else {
      ensureRedisInProduction()
    }
  }
}

// Export singleton
export const redisCache = new RedisBackedCache()
