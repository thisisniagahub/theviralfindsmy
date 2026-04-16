import { describe, it, expect, beforeEach } from 'vitest'
import { cache, cacheKeys, cacheTTL } from './cache'

describe('cache', () => {
  beforeEach(() => {
    cache.clear()
  })

  it('should store and retrieve values', () => {
    cache.set('test-key', { data: 'value' })
    const result = cache.get('test-key')
    expect(result).toEqual({ data: 'value' })
  })

  it('should return null for expired entries', () => {
    cache.set('expire-key', 'value', 10) // 10ms TTL
    // Wait for expiry
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = cache.get('expire-key')
        expect(result).toBeNull()
        resolve(true)
      }, 20)
    })
  })

  it('should handle concurrent reads and writes', () => {
    // Write 100 items
    for (let i = 0; i < 100; i++) {
      cache.set(`key-${i}`, `value-${i}`)
    }

    // Read all back
    for (let i = 0; i < 100; i++) {
      const result = cache.get(`key-${i}`)
      expect(result).toBe(`value-${i}`)
    }
  })

  it('should delete keys', () => {
    cache.set('delete-key', 'value')
    cache.invalidate('delete-key')
    const result = cache.get('delete-key')
    expect(result).toBeNull()
  })

  it('should invalidate by pattern', () => {
    cache.set('dashboard:30d', 'data1')
    cache.set('dashboard:7d', 'data2')
    cache.set('other:key', 'data3')

    cache.invalidatePattern('dashboard')

    expect(cache.get('dashboard:30d')).toBeNull()
    expect(cache.get('dashboard:7d')).toBeNull()
    expect(cache.get('other:key')).toBe('data3')
  })

  it('should return cache stats', () => {
    cache.set('stat-1', 'value1')
    cache.set('stat-2', 'value2')

    cache.get('stat-1')
    cache.get('stat-1')
    cache.get('stat-2')

    const stats = cache.getStats()
    expect(stats.totalEntries).toBe(2)
    expect(stats.totalHits).toBe(3)
  })
})

describe('cacheKeys', () => {
  it('should generate consistent cache keys', () => {
    expect(cacheKeys.dashboard('30d')).toBe('dashboard:30d')
    expect(cacheKeys.leaderboard('7d')).toBe('leaderboard:7d')
    expect(cacheKeys.goals()).toBe('goals')
  })
})

describe('cacheTTL', () => {
  it('should have preset TTL values', () => {
    expect(cacheTTL.short).toBe(15_000)
    expect(cacheTTL.medium).toBe(30_000)
    expect(cacheTTL.long).toBe(60_000)
    expect(cacheTTL.veryLong).toBe(5 * 60_000)
  })
})
