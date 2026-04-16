import { describe, it, expect, beforeEach } from 'vitest'
import {
  rateLimit,
  rateLimitByIP,
  resetRateLimits,
  getRateLimitStats,
  RATE_LIMITS,
} from './rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimits()
  })

  it('should allow requests within limit', async () => {
    const result = await rateLimit('127.0.0.1', RATE_LIMITS.api)
    expect(result.success).toBe(true)
  })

  it('should track different IPs separately', async () => {
    const result1 = await rateLimitByIP('192.168.1.1', { windowMs: 60_000, maxRequests: 2 })
    const result2 = await rateLimitByIP('192.168.1.2', { windowMs: 60_000, maxRequests: 2 })

    expect(result1.allowed).toBe(true)
    expect(result2.allowed).toBe(true)
  })

  it('should block requests exceeding limit', async () => {
    const config = { windowMs: 60_000, maxRequests: 2 }

    const result1 = await rateLimitByIP('10.0.0.1', config)
    const result2 = await rateLimitByIP('10.0.0.1', config)
    const result3 = await rateLimitByIP('10.0.0.1', config)

    expect(result1.allowed).toBe(true)
    expect(result2.allowed).toBe(true)
    expect(result3.allowed).toBe(false)
    expect(result3.retryAfter).toBeGreaterThan(0)
  })

  it('should reset remaining count correctly', async () => {
    const ip = '172.16.0.1'
    const config = { windowMs: 60_000, maxRequests: 10 }

    await rateLimitByIP(ip, config)
    const stats = getRateLimitStats('ip', ip)

    expect(stats.count).toBe(1)
    // getRateLimitStats uses DEFAULT_IP_LIMIT.maxRequests (100), not config's maxRequests
    expect(stats.remaining).toBe(99)
  })
})
