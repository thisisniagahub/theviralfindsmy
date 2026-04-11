import { describe, it, expect, beforeEach } from 'vitest'
import { cache, TTL } from '@/lib/cache'

describe('MemoryCache', () => {
  beforeEach(() => {
    cache.clear()
  })

  it('should store and retrieve values', () => {
    cache.set('key1', { data: 'test' }, TTL.SHORT)
    expect(cache.get('key1')).toEqual({ data: 'test' })
  })

  it('should return null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull()
  })

  it('should expire entries after TTL', () => {
    cache.set('key1', 'value', 1) // 1ms TTL
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(cache.get('key1')).toBeNull()
        resolve()
      }, 10)
    })
  })

  it('should invalidate entries by pattern', () => {
    cache.set('links:1', 'a', TTL.LONG)
    cache.set('links:2', 'b', TTL.LONG)
    cache.set('other:1', 'c', TTL.LONG)
    cache.invalidate('links')
    expect(cache.get('links:1')).toBeNull()
    expect(cache.get('links:2')).toBeNull()
    expect(cache.get('other:1')).toEqual('c')
  })

  it('should clear all entries', () => {
    cache.set('a', 1, TTL.LONG)
    cache.set('b', 2, TTL.LONG)
    cache.clear()
    expect(cache.get('a')).toBeNull()
    expect(cache.get('b')).toBeNull()
  })
})
