/**
 * API Rate Limiting Middleware
 * Per-IP and per-user rate limits with 429 responses and retry-after headers.
 * Uses in-memory Map (for production, use Redis or similar).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

export interface RateLimitConfig {
  windowMs: number       // Window size in milliseconds
  maxRequests: number    // Max requests per window
}

// Rate limit stores
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

export function rateLimitByIP(ip: string, config?: Partial<RateLimitConfig>) {
  const cfg = { ...DEFAULT_IP_LIMIT, ...config }
  return checkLimit(ip, ipLimits, cfg)
}

export function rateLimitByUser(userId: string, config?: Partial<RateLimitConfig>) {
  const cfg = { ...DEFAULT_USER_LIMIT, ...config }
  return checkLimit(userId, userLimits, cfg)
}

// Reset limits (useful for testing)
export function resetRateLimits() {
  ipLimits.clear()
  userLimits.clear()
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

export function rateLimit(ip: string, config: RateLimitConfig = RATE_LIMITS.api) {
  const result = rateLimitByIP(ip, config)
  return {
    success: result.allowed,
    resetIn: result.retryAfter * 1000,
  }
}

