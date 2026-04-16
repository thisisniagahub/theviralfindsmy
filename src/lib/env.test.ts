import { describe, it, expect } from 'vitest'
import { envSchema } from './env'

const BASE_ENV = {
  DATABASE_URL: 'postgresql://localhost:5432/test',
  NEXTAUTH_SECRET: 'test-secret',
  DB_SERVICE_SECRET: 'test-db-secret',
}

describe('env schema', () => {
  it('should validate minimum required env vars', () => {
    const result = envSchema.safeParse(BASE_ENV)
    expect(result.success).toBe(true)
  })

  it('should reject missing DATABASE_URL', () => {
    const env = { NEXTAUTH_SECRET: 'test-secret', DB_SERVICE_SECRET: 'test' }
    const result = envSchema.safeParse(env)
    expect(result.success).toBe(false)
  })

  it('should reject missing NEXTAUTH_SECRET', () => {
    const env = { DATABASE_URL: 'postgresql://localhost:5432/test', DB_SERVICE_SECRET: 'test' }
    const result = envSchema.safeParse(env)
    expect(result.success).toBe(false)
  })

  it('should default DEMO_MODE to false', () => {
    const result = envSchema.safeParse(BASE_ENV)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.DEMO_MODE).toBe('false')
    }
  })

  it('should validate valid SHOPEE_REGION', () => {
    const env = { ...BASE_ENV, SHOPEE_REGION: 'MY' }
    const result = envSchema.safeParse(env)
    expect(result.success).toBe(true)
  })

  it('should reject invalid SHOPEE_REGION', () => {
    const env = { ...BASE_ENV, SHOPEE_REGION: 'INVALID' }
    const result = envSchema.safeParse(env)
    expect(result.success).toBe(false)
  })

  it('should default OpenClaw URL to production', () => {
    const result = envSchema.safeParse(BASE_ENV)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.OPENCLAW_GATEWAY_URL).toBe('https://operator.gangniaga.my')
    }
  })
})
