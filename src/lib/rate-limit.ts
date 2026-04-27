/**
 * Simple in-memory rate limiter for API routes.
 * For production, replace with Upstash Ratelimit + Redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 60_000)

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export const RATE_LIMITS = {
  api: { windowMs: 60_000, maxRequests: 60 },
  ai: { windowMs: 60_000, maxRequests: 10 },
  auth: { windowMs: 300_000, maxRequests: 5 },
  mutation: { windowMs: 60_000, maxRequests: 30 },
} as const

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.api
): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const key = identifier
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { success: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetIn: entry.resetAt - now }
  }

  entry.count++
  return { success: true, remaining: config.maxRequests - entry.count, resetIn: entry.resetAt - now }
}
