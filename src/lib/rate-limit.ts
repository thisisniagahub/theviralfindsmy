/**
 * API Rate Limiting Middleware
 * Per-IP and per-user rate limits with 429 responses and retry-after headers.
 * PRIMARY: Upstash Redis for production scalability
 * FALLBACK: In-memory Map for local dev only
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

interface RateLimitEntry {
  count: number
  resetAt: number
}

export interface RateLimitConfig {
  windowMs: number       // Window size in milliseconds
  maxRequests: number    // Max requests per window
}

// ─── In-memory fallback stores (DEV ONLY) ───
const ipLimits = new Map<string, RateLimitEntry>()
const userLimits = new Map<string, RateLimitEntry>()

// Default configs
const DEFAULT_IP_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 100 }    // 100 req/min per IP
const DEFAULT_USER_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 200 } // 200 req/min per user

// Cleanup interval (every 5 minutes)
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of ipLimits) {
      if (entry.resetAt < now) ipLimits.delete(key)
    }
    for (const [key, entry] of userLimits) {
      if (entry.resetAt < now) userLimits.delete(key)
    }
  }, 5 * 60_000)
  if (cleanupInterval.unref) cleanupInterval.unref()
}

// ─── Redis ratelimit instances (PRIMARY) ───
let ipRatelimit: Ratelimit | null = null
let userRatelimit: Ratelimit | null = null

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    return new Redis({ url, token })
  } catch (error) {
    console.error('[RateLimit] Failed to initialize Redis:', error)
    return null
  }
}

function getIpRatelimit(): Ratelimit | null {
  if (ipRatelimit) return ipRatelimit

  const redis = getRedisClient()
  if (!redis) {
    // Log warning only once in production
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ [RateLimit] Redis not configured - using in-memory fallback (will not scale across instances)')
    }
    return null
  }

  ipRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '60 s'),
    prefix: '@tvf:ip',
  })
  return ipRatelimit
}

function getUserRatelimit(): Ratelimit | null {
  if (userRatelimit) return userRatelimit

  const redis = getRedisClient()
  if (!redis) return null

  userRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, '60 s'),
    prefix: '@tvf:user',
  })
  return userRatelimit
}

function checkLimit(
  key: string,
  store: Map<string, RateLimitEntry>,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfter: number } {
  ensureCleanup()

  const now = Date.now()
  let entry = store.get(key)

  // Reset expired window
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + config.windowMs }
    store.set(key, entry)
  }

  entry.count++

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    retryAfter: 0,
  }
}

export async function rateLimitByIP(ip: string, config?: Partial<RateLimitConfig>): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  // Try Redis first
  const rl = getIpRatelimit()
  if (rl) {
    const { success, remaining, reset } = await rl.limit(ip)
    return {
      allowed: success,
      remaining,
      retryAfter: success ? 0 : Math.ceil((reset - Date.now()) / 1000),
    }
  }

  // Fall back to in-memory (DEV ONLY)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[RateLimit] Redis is required in production for rate limiting. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.')
  }

  const cfg = { ...DEFAULT_IP_LIMIT, ...config }
  return checkLimit(ip, ipLimits, cfg)
}

export async function rateLimitByUser(userId: string, config?: Partial<RateLimitConfig>): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  // Try Redis first
  const rl = getUserRatelimit()
  if (rl) {
    const { success, remaining, reset } = await rl.limit(userId)
    return {
      allowed: success,
      remaining,
      retryAfter: success ? 0 : Math.ceil((reset - Date.now()) / 1000),
    }
  }

  // Fall back to in-memory (DEV ONLY)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[RateLimit] Redis is required in production for rate limiting. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.')
  }

  const cfg = { ...DEFAULT_USER_LIMIT, ...config }
  return checkLimit(userId, userLimits, cfg)
}

// Reset limits (useful for testing)
export function resetRateLimits() {
  ipLimits.clear()
  userLimits.clear()
  ipRatelimit = null
  userRatelimit = null
}

// Get current usage stats
export function getRateLimitStats(type: 'ip' | 'user', key: string) {
  const store = type === 'ip' ? ipLimits : userLimits
  const entry = store.get(key)
  if (!entry) return { count: 0, remaining: type === 'ip' ? DEFAULT_IP_LIMIT.maxRequests : DEFAULT_USER_LIMIT.maxRequests, resetAt: 0 }
  return { count: entry.count, remaining: Math.max((type === 'ip' ? DEFAULT_IP_LIMIT.maxRequests : DEFAULT_USER_LIMIT.maxRequests) - entry.count, 0), resetAt: entry.resetAt }
}

export const RATE_LIMITS = {
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  ai: { windowMs: 60 * 1000, maxRequests: 10 },
  auth: { windowMs: 5 * 60 * 1000, maxRequests: 5 },
  mutation: { windowMs: 60 * 1000, maxRequests: 30 },
}

export async function rateLimit(ip: string, config: RateLimitConfig = RATE_LIMITS.api) {
  const result = await rateLimitByIP(ip, config)
  return {
    success: result.allowed,
    resetIn: result.retryAfter * 1000,
  }
}
