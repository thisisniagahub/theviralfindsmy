/**
 * DB Service Validations Tests
 * Tests input validation schemas from mini-services/db-service/validations.ts
 */

import { describe, it, expect } from 'vitest'
import {
  createLinkBody,
  updateLinkBody,
  createCampaignBody,
  createPayoutBody,
  createGoalBody,
  updateSettingsBody,
  validateBody,
} from '../../mini-services/db-service/validations'

describe('createLinkBody', () => {
  it('should validate complete link data', () => {
    const data = {
      name: 'Gaming Mouse',
      productUrl: 'https://shopee.com.my/product/123',
      affiliateUrl: 'https://shopee.com.my/affiliate/123',
      commission: 10,
      status: 'active' as const,
    }
    const result = createLinkBody.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should validate minimal required fields', () => {
    const data = {
      name: 'Test Product',
      productUrl: 'https://example.com',
    }
    const result = createLinkBody.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const data = { name: '', productUrl: 'https://example.com' }
    const result = createLinkBody.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject invalid URL', () => {
    const data = { name: 'Test', productUrl: 'not-a-url' }
    const result = createLinkBody.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject name longer than 200 characters', () => {
    const data = { name: 'a'.repeat(201), productUrl: 'https://example.com' }
    const result = createLinkBody.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject negative commission', () => {
    const data = { name: 'Test', productUrl: 'https://example.com', commission: -5 }
    const result = createLinkBody.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should coerce string numbers to actual numbers', () => {
    const data = {
      name: 'Test',
      productUrl: 'https://example.com',
      commission: '10.5',
    }
    const result = createLinkBody.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.commission).toBe('number')
    }
  })
})

describe('updateLinkBody', () => {
  it('should validate partial updates', () => {
    const data = { name: 'Updated Name' }
    const result = updateLinkBody.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should validate status update', () => {
    const data = { status: 'paused' }
    const result = updateLinkBody.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const data = { name: '' }
    const result = updateLinkBody.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject completely empty body', () => {
    const data = {}
    const result = updateLinkBody.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('createCampaignBody', () => {
  it('should validate complete campaign data', () => {
    const data = {
      name: 'Summer Sale',
      description: 'Summer campaign',
      budget: 5000,
      startDate: '2026-06-01T00:00:00Z',
      endDate: '2026-06-30T23:59:59Z',
    }
    const result = createCampaignBody.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should validate minimal campaign data', () => {
    const data = { name: 'Test Campaign' }
    const result = createCampaignBody.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const data = { name: '' }
    const result = createCampaignBody.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('createPayoutBody', () => {
  it('should validate complete payout data', () => {
    const data = {
      amount: 500,
      method: 'bank_transfer' as const,
      bankName: 'Maybank',
      accountNo: '123456789',
      accountName: 'Ahmad Ali',
    }
    const result = createPayoutBody.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject amount below RM 100', () => {
    const data = { amount: 50 }
    const result = createPayoutBody.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject negative amount', () => {
    const data = { amount: -100 }
    const result = createPayoutBody.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('createGoalBody', () => {
  it('should validate complete goal data', () => {
    const data = {
      name: 'Monthly Target',
      targetAmount: 1000,
      period: 'monthly' as const,
    }
    const result = createGoalBody.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should validate all period types', () => {
    const periods = ['monthly', 'weekly', 'yearly', 'custom'] as const
    for (const period of periods) {
      const data = { name: 'Goal', targetAmount: 500, period }
      const result = createGoalBody.safeParse(data)
      expect(result.success).toBe(true)
    }
  })

  it('should reject negative target amount', () => {
    const data = { name: 'Goal', targetAmount: -100, period: 'monthly' }
    const result = createGoalBody.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('updateSettingsBody', () => {
  it('should validate settings array', () => {
    const data = [{ key: 'theme', value: 'dark' }, { key: 'notifications', value: 'enabled' }]
    const result = updateSettingsBody.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject values over 500 characters', () => {
    const data = [{ key: 'test', value: 'a'.repeat(501) }]
    const result = updateSettingsBody.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject empty keys', () => {
    const data = [{ key: '', value: 'test' }]
    const result = updateSettingsBody.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('validateBody', () => {
  it('should return parsed data on success', () => {
    const data = { name: 'Test', productUrl: 'https://example.com' }
    const result = validateBody(createLinkBody, data)
    expect(result.name).toBe('Test')
  })

  it('should throw on invalid data', () => {
    const data = { name: '', productUrl: 'https://example.com' }
    expect(() => validateBody(createLinkBody, data)).toThrow()
  })
})
