import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { calculateExpiry, getLinkExpiryStatus, shouldAutoExpire } from '@/lib/link-expiry'

describe('link-expiry utilities', () => {
  const MOCK_NOW = new Date('2024-01-01T12:00:00Z')
  let originalNow: typeof Date.now
  let OriginalDate: typeof Date

  beforeEach(() => {
    // Manual mocking of Date for compatibility with bun test environment
    originalNow = Date.now
    OriginalDate = global.Date

    Date.now = () => MOCK_NOW.getTime()
    // @ts-ignore
    global.Date = class extends OriginalDate {
      constructor(arg: any) {
        if (arg === undefined) return new OriginalDate(MOCK_NOW)
        return new OriginalDate(arg)
      }
      static now() {
        return MOCK_NOW.getTime()
      }
    }
  })

  afterEach(() => {
    Date.now = originalNow
    global.Date = OriginalDate
  })

  describe('calculateExpiry', () => {
    it('should handle null input', () => {
      const result = calculateExpiry(null)
      expect(result).toEqual({
        expiresIn: null,
        isExpired: false,
        expiryStatus: 'none',
      })
    })

    it('should return expired status for past dates', () => {
      const pastDate = new Date(MOCK_NOW.getTime() - 1000).toISOString()
      const result = calculateExpiry(pastDate)
      expect(result.isExpired).toBe(true)
      expect(result.expiryStatus).toBe('expired')
    })

    it('should return expiring_soon for dates within 7 days', () => {
      const soonDate = new Date(MOCK_NOW.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
      const result = calculateExpiry(soonDate)
      expect(result.isExpired).toBe(false)
      expect(result.expiresIn).toBe(5)
      expect(result.expiryStatus).toBe('expiring_soon')
    })

    it('should return active for dates more than 7 days away', () => {
      const futureDate = new Date(MOCK_NOW.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()
      const result = calculateExpiry(futureDate)
      expect(result.isExpired).toBe(false)
      expect(result.expiresIn).toBe(10)
      expect(result.expiryStatus).toBe('active')
    })

    it('should handle exactly now as not expired (diffMs = 0)', () => {
      const result = calculateExpiry(MOCK_NOW.toISOString())
      expect(result.isExpired).toBe(false)
      expect(result.expiryStatus).toBe('expiring_soon')
      expect(result.expiresIn).toBe(0)
    })
  })

  describe('getLinkExpiryStatus', () => {
    it('should handle null/undefined input', () => {
      expect(getLinkExpiryStatus(null)).toEqual({
        isExpired: false,
        isExpiringSoon: false,
        daysRemaining: null,
        label: 'No expiry',
        color: 'text-muted-foreground',
      })
      expect(getLinkExpiryStatus(undefined)).toEqual({
        isExpired: false,
        isExpiringSoon: false,
        daysRemaining: null,
        label: 'No expiry',
        color: 'text-muted-foreground',
      })
    })

    it('should return expired status for past dates', () => {
      const pastDate = new Date(MOCK_NOW.getTime() - 1000).toISOString()
      const result = getLinkExpiryStatus(pastDate)
      expect(result.isExpired).toBe(true)
      expect(result.label).toBe('Expired')
      expect(result.color).toBe('text-red-500')
    })

    it('should return expiring soon for dates within 3 days', () => {
      const soonDate = new Date(MOCK_NOW.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
      const result = getLinkExpiryStatus(soonDate)
      expect(result.isExpired).toBe(false)
      expect(result.isExpiringSoon).toBe(true)
      expect(result.label).toBe('2d left')
      expect(result.color).toBe('text-amber-500')
    })

    it('should return active status for dates more than 3 days away', () => {
      const futureDate = new Date(MOCK_NOW.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
      const result = getLinkExpiryStatus(futureDate)
      expect(result.isExpired).toBe(false)
      expect(result.isExpiringSoon).toBe(false)
      expect(result.label).toBe('5d left')
      expect(result.color).toBe('text-green-500')
    })

    it('should handle exactly now as expired (daysRemaining <= 0)', () => {
      const result = getLinkExpiryStatus(MOCK_NOW.toISOString())
      expect(result.isExpired).toBe(true)
      expect(result.daysRemaining).toBe(0)
    })
  })

  describe('shouldAutoExpire', () => {
    it('should return false for null/undefined', () => {
      expect(shouldAutoExpire(null)).toBe(false)
      expect(shouldAutoExpire(undefined)).toBe(false)
    })

    it('should return true for past dates', () => {
      const pastDate = new Date(MOCK_NOW.getTime() - 1000).toISOString()
      expect(shouldAutoExpire(pastDate)).toBe(true)
    })

    it('should return false for future dates', () => {
      const futureDate = new Date(MOCK_NOW.getTime() + 1000).toISOString()
      expect(shouldAutoExpire(futureDate)).toBe(false)
    })

    it('should return false for exactly now', () => {
      expect(shouldAutoExpire(MOCK_NOW.toISOString())).toBe(false)
    })
  })
})
