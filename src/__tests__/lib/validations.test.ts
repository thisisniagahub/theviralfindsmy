import { describe, it, expect } from 'vitest'
import { createLinkSchema, createCampaignSchema, loginSchema, calculatorEstimateSchema } from '@/lib/validations'

describe('createLinkSchema', () => {
  it('should validate a valid link', () => {
    const result = createLinkSchema.safeParse({
      name: 'Test Link',
      productUrl: 'https://shopee.com.my/product/123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const result = createLinkSchema.safeParse({
      name: '',
      productUrl: 'https://shopee.com.my/product/123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid URL', () => {
    const result = createLinkSchema.safeParse({
      name: 'Test',
      productUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('should validate valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'admin@test.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject short password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@test.com',
      password: '12345',
    })
    expect(result.success).toBe(false)
  })
})

describe('calculatorEstimateSchema', () => {
  it('should validate valid calculator input', () => {
    const result = calculatorEstimateSchema.safeParse({
      price: 100,
      commissionRate: 5,
      clicks: 1000,
      conversionRate: 2.5,
    })
    expect(result.success).toBe(true)
  })

  it('should reject commission rate over 100', () => {
    const result = calculatorEstimateSchema.safeParse({
      price: 100,
      commissionRate: 150,
      clicks: 1000,
      conversionRate: 2.5,
    })
    expect(result.success).toBe(false)
  })
})
