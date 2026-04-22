import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

describe('rateLimit', () => {
  const testConfig = { windowMs: 60_000, maxRequests: 3 }

  it('should allow requests under the limit', () => {
    const result = rateLimit('test-ip', testConfig)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('should block requests over the limit', () => {
    rateLimit('test-ip-2', testConfig)
    rateLimit('test-ip-2', testConfig)
    rateLimit('test-ip-2', testConfig)
    const result = rateLimit('test-ip-2', testConfig)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should track different identifiers separately', () => {
    rateLimit('ip-a', testConfig)
    rateLimit('ip-a', testConfig)
    const result = rateLimit('ip-b', testConfig)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(2)
  })
})
