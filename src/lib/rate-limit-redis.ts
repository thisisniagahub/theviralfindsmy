/**
 * Redis-Backed Rate Limiter with In-Memory Fallback
 *
 * Uses @upstash/ratelimit for distributed rate limiting when Redis is available.
 * Falls back to in-memory rate limiting when Redis is unavailable.
 */

import { getRedis, isRedisAvailable } from './redis'

class RedisRateLimiter {
  async limit(
    key: string,
    limit: number = 60,
    window: number = 60000
  ): Promise<{
    success: boolean
    remaining: number
    resetIn: number
  }> {
    const redis = getRedis()

    if (redis && isRedisAvailable()) {
      try {
        const { Ratelimit } = await import('@upstash/ratelimit')

        const ratelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(limit, `${Math.floor(window / 1000)} s`),
        })

        const { success, remaining, reset } = await ratelimit.limit(key)

        return {
          success,
          remaining,
          resetIn: reset - Date.now(),
        }
      } catch (error) {
        console.warn('Redis rate limit failed, using in-memory fallback:', error)
      }
    }

    // Fallback to in-memory rate limiter
    const { rateLimitByIP } = await import('./rate-limit')
    const result = await rateLimitByIP(key, { windowMs: window, maxRequests: limit })
    return {
      success: result.allowed,
      remaining: result.remaining,
      resetIn: result.retryAfter * 1000,
    }
  }
}

export const redisRateLimiter = new RedisRateLimiter()
