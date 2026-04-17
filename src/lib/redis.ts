/**
 * Redis Adapter — thin wrapper around @upstash/redis
 * Falls back to in-memory Map when Upstash is not configured (local dev).
 */

import { Redis } from '@upstash/redis'

interface MemoryEntry {
  value: string
  expiresAt: number | null
}

class InMemoryFallback {
  private store = new Map<string, MemoryEntry>()

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : null,
    })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key)
    const next = (current ? parseInt(current, 10) : 0) + 1
    await this.set(key, String(next))
    return next
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key)
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000
    }
  }
}

let redisClient: Redis | null = null
let memoryFallback: InMemoryFallback | null = null

export function getRedis(): Redis | null {
  if (redisClient) return redisClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    // Fail fast in production - Redis is required
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Redis] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.')
    }
    return null
  }

  redisClient = new Redis({ url, token })
  return redisClient
}

function getMemory(): InMemoryFallback {
  if (!memoryFallback) {
    memoryFallback = new InMemoryFallback()
  }
  return memoryFallback
}

export async function get(key: string): Promise<string | null> {
  const client = getRedis()
  if (client) {
    return client.get(key) as Promise<string | null>
  }
  // Production: already handled in getRedis()
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Redis] get() called without Redis in production.')
  }
  return getMemory().get(key)
}

export async function set(key: string, value: string, ttl?: number): Promise<void> {
  const client = getRedis()
  if (client) {
    if (ttl) {
      await client.set(key, value, { ex: ttl })
    } else {
      await client.set(key, value)
    }
    return
  }
  // Production: already handled in getRedis()
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Redis] set() called without Redis in production.')
  }
  return getMemory().set(key, value, ttl)
}

export async function del(key: string): Promise<void> {
  const client = getRedis()
  if (client) {
    await client.del(key)
    return
  }
  // Production: already handled in getRedis()
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Redis] del() called without Redis in production.')
  }
  return getMemory().del(key)
}

export async function incr(key: string): Promise<number> {
  const client = getRedis()
  if (client) {
    return client.incr(key) as Promise<number>
  }
  // Production: already handled in getRedis()
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Redis] incr() called without Redis in production.')
  }
  return getMemory().incr(key)
}

export async function expire(key: string, seconds: number): Promise<void> {
  const client = getRedis()
  if (client) {
    await client.expire(key, seconds)
    return
  }
  // Production: already handled in getRedis()
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Redis] expire() called without Redis in production.')
  }
  return getMemory().expire(key, seconds)
}

export function isRedisAvailable(): boolean {
  return getRedis() !== null
}

export function resetRedis(): void {
  redisClient = null
  memoryFallback = null
}
