import { describe, it, expect } from 'vitest'
import { hasFeature, getLimit, canCreateLink, getTierByName, type TierId } from './tiers'

describe('tiers', () => {
  describe('hasFeature', () => {
    it('should return true for enabled features', () => {
      expect(hasFeature('free', 'hasAnalytics')).toBe(true)
      expect(hasFeature('pro', 'hasAITools')).toBe(true)
      expect(hasFeature('enterprise', 'hasTeamAccess')).toBe(true)
    })

    it('should return false for disabled features', () => {
      expect(hasFeature('free', 'hasAITools')).toBe(false)
      expect(hasFeature('pro', 'hasTeamAccess')).toBe(false)
    })

    it('should evaluate numeric limits as booleans properly', () => {
      expect(hasFeature('free', 'maxAICalls')).toBe(false) // 0 -> false
      expect(hasFeature('free', 'maxLinks')).toBe(true) // 5 -> true
    })

    it('should return false for an unknown tier', () => {
      expect(hasFeature('unknown' as TierId, 'hasAnalytics')).toBe(false)
    })
  })

  describe('getLimit', () => {
    it('should return the correct limit for a given tier', () => {
      expect(getLimit('free', 'maxLinks')).toBe(5)
      expect(getLimit('pro', 'maxLinks')).toBe(Infinity)
      expect(getLimit('enterprise', 'hasTeamAccess')).toBe(true)
      expect(getLimit('free', 'hasTeamAccess')).toBe(false)
    })

    it('should return false for an unknown tier', () => {
      expect(getLimit('unknown' as TierId, 'maxLinks')).toBe(false)
    })
  })

  describe('canCreateLink', () => {
    it('should return true if current count is below limit', () => {
      expect(canCreateLink('free', 4)).toBe(true)
      expect(canCreateLink('free', 0)).toBe(true)
    })

    it('should return false if current count is at or above limit', () => {
      expect(canCreateLink('free', 5)).toBe(false)
      expect(canCreateLink('free', 6)).toBe(false)
    })

    it('should return true for unlimited tiers', () => {
      expect(canCreateLink('pro', 99999)).toBe(true)
      expect(canCreateLink('enterprise', 99999)).toBe(true)
    })

    it('should return false for an unknown tier', () => {
      expect(canCreateLink('unknown' as TierId, 0)).toBe(false)
    })
  })

  describe('getTierByName', () => {
    it('should return the correct tier id ignoring case', () => {
      expect(getTierByName('Free')).toBe('free')
      expect(getTierByName('free')).toBe('free')
      expect(getTierByName('PRO')).toBe('pro')
      expect(getTierByName('Enterprise')).toBe('enterprise')
    })

    it('should return free for unknown tier names', () => {
      expect(getTierByName('Unknown')).toBe('free')
      expect(getTierByName('')).toBe('free')
    })
  })
})
