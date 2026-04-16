import { describe, it, expect } from 'vitest'
import {
  createLinkSchema,
  updateLinkSchema,
  createCampaignSchema,
  createPayoutSchema,
  createGoalSchema,
  updateSettingsSchema,
  loginSchema,
} from './validations'

describe('createLinkSchema', () => {
  it('should validate complete link data', () => {
    const data = {
      name: 'Gaming Mouse',
      productUrl: 'https://shopee.com.my/product/123',
      affiliateUrl: 'https://shopee.com.my/affiliate/123',
      commission: 10,
      status: 'active' as const,
    }
    const result = createLinkSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should validate minimal required fields', () => {
    const data = {
      name: 'Test Product',
      productUrl: 'https://example.com',
    }
    const result = createLinkSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const data = { name: '', productUrl: 'https://example.com' }
    const result = createLinkSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('required')
    }
  })

  it('should reject invalid URL', () => {
    const data = { name: 'Test', productUrl: 'not-a-url' }
    const result = createLinkSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject name longer than 200 characters', () => {
    const data = { name: 'a'.repeat(201), productUrl: 'https://example.com' }
    const result = createLinkSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject negative commission', () => {
    const data = { name: 'Test', productUrl: 'https://example.com', commission: -5 }
    const result = createLinkSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject invalid status', () => {
    const data = {
      name: 'Test',
      productUrl: 'https://example.com',
      status: 'invalid',
    }
    const result = createLinkSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should coerce string numbers to actual numbers', () => {
    const data = {
      name: 'Test',
      productUrl: 'https://example.com',
      commission: '10.5',
    }
    const result = createLinkSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.commission).toBe('number')
    }
  })
})

describe('updateLinkSchema', () => {
  it('should validate partial updates', () => {
    const data = { name: 'Updated Name' }
    const result = updateLinkSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should validate status update', () => {
    const data = { status: 'paused' }
    const result = updateLinkSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const data = { name: '' }
    const result = updateLinkSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('createCampaignSchema', () => {
  it('should validate complete campaign data', () => {
    const data = {
      name: 'Summer Sale',
      description: 'Summer campaign',
      budget: 5000,
      startDate: '2026-06-01T00:00:00Z',
      endDate: '2026-06-30T23:59:59Z',
    }
    const result = createCampaignSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should validate minimal campaign data', () => {
    const data = { name: 'Test Campaign' }
    const result = createCampaignSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const data = { name: '' }
    const result = createCampaignSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('createPayoutSchema', () => {
  it('should validate complete payout data', () => {
    const data = {
      amount: 500,
      method: 'bank_transfer' as const,
      bankName: 'Maybank',
      accountNo: '123456789',
      accountName: 'Ahmad Ali',
    }
    const result = createPayoutSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject amount below RM 100', () => {
    const data = { amount: 50 }
    const result = createPayoutSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject negative amount', () => {
    const data = { amount: -100 }
    const result = createPayoutSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('createGoalSchema', () => {
  it('should validate complete goal data', () => {
    const data = {
      name: 'Monthly Target',
      targetAmount: 1000,
      period: 'monthly' as const,
    }
    const result = createGoalSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should validate all period types', () => {
    const periods = ['monthly', 'weekly', 'yearly', 'custom'] as const
    for (const period of periods) {
      const data = { name: 'Goal', targetAmount: 500, period }
      const result = createGoalSchema.safeParse(data)
      expect(result.success).toBe(true)
    }
  })

  it('should reject negative target amount', () => {
    const data = { name: 'Goal', targetAmount: -100, period: 'monthly' }
    const result = createGoalSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('updateSettingsSchema', () => {
  it('should validate settings with updates array', () => {
    const data = { updates: [{ key: 'theme', value: 'dark' }, { key: 'notifications', value: 'enabled' }] }
    const result = updateSettingsSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject values over 500 characters', () => {
    const data = { updates: [{ key: 'test', value: 'a'.repeat(501) }] }
    const result = updateSettingsSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject unknown fields (strict mode)', () => {
    const data = { updates: [{ key: 'theme', value: 'dark' }], extraField: 'bad' }
    const result = updateSettingsSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject empty keys', () => {
    const data = { updates: [{ key: '', value: 'test' }] }
    const result = updateSettingsSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('should validate complete login data', () => {
    const data = {
      email: 'admin@theviralfinds.my',
      password: 'password123',
    }
    const result = loginSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const data = { email: 'not-an-email', password: 'password123' }
    const result = loginSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject password shorter than 6 characters', () => {
    const data = { email: 'admin@test.com', password: '12345' }
    const result = loginSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})
