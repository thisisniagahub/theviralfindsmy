import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { get, set, del, incr, expire, isRedisAvailable, resetRedis } from './redis'

describe('redis', () => {
  beforeEach(() => {
    resetRedis()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    resetRedis()
  })

  it('should return null from get when not configured', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    const result = await get('test-key')
    expect(result).toBeNull()
  })

  it('should report unavailable when env vars missing', () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    expect(isRedisAvailable()).toBe(false)
  })

  it('should store and retrieve values from memory fallback', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    await set('test-key', 'test-value')
    const result = await get('test-key')
    expect(result).toBe('test-value')
  })

  it('should delete values from memory fallback', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    await set('del-key', 'value')
    await del('del-key')
    const result = await get('del-key')
    expect(result).toBeNull()
  })

  it('should increment values in memory fallback', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    const result = await incr('counter')
    expect(result).toBe(1)

    const result2 = await incr('counter')
    expect(result2).toBe(2)
  })

  it('should set TTL on values in memory fallback', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    await set('ttl-key', 'value', 1) // 1 second TTL
    const result1 = await get('ttl-key')
    expect(result1).toBe('value')

    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 1100))
    const result2 = await get('ttl-key')
    expect(result2).toBeNull()
  })

  it('should set expiration on existing keys', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    await set('exp-key', 'value')
    await expire('exp-key', 1)

    const result1 = await get('exp-key')
    expect(result1).toBe('value')

    await new Promise((resolve) => setTimeout(resolve, 1100))
    const result2 = await get('exp-key')
    expect(result2).toBeNull()
  })
})
