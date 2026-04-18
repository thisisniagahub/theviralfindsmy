import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  validateDemoMode,
  isDemoMode,
  requireDemoMode,
  requireDemoModeAsync
} from './demo-mode-guard'

describe('demo-mode-guard', () => {
  const originalEnv = process.env
  let consoleErrorMock: any

  beforeEach(() => {
    // Reset process.env before each test
    vi.resetModules()
    process.env = { ...originalEnv }
    // Clean up specific env vars
    delete process.env.DEMO_MODE
    delete process.env.NODE_ENV
    delete process.env.VERCEL_ENV
    delete process.env.AWS_EXECUTION_ENV
    delete process.env.AWS_REGION
    delete process.env.EC2_INSTANCE_ID
    delete process.env.GOOGLE_CLOUD_PROJECT
    delete process.env.K_SERVICE
    delete process.env.K_CONFIGURATION

    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    consoleErrorMock.mockRestore()
  })

  describe('validateDemoMode', () => {
    it('should not throw if DEMO_MODE is not true', () => {
      process.env.DEMO_MODE = 'false'
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'

      expect(() => validateDemoMode()).not.toThrow()
    })

    it('should not throw if DEMO_MODE is true in development', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'development'

      expect(() => validateDemoMode()).not.toThrow()
    })

    it('should throw if DEMO_MODE is true in Vercel production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'

      expect(() => validateDemoMode()).toThrow(/\[SECURITY\] DEMO_MODE is enabled in PRODUCTION/)
      expect(consoleErrorMock).toHaveBeenCalled()
    })

    it('should not throw if DEMO_MODE is true in Vercel preview', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'preview'

      expect(() => validateDemoMode()).not.toThrow()
    })

    it('should throw if DEMO_MODE is true in AWS Lambda production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs18.x'.toLowerCase()

      expect(() => validateDemoMode()).toThrow(/\[SECURITY\] DEMO_MODE is enabled in PRODUCTION/)
      expect(consoleErrorMock).toHaveBeenCalled()
    })

    it('should throw if DEMO_MODE is true in AWS EC2 production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.AWS_REGION = 'us-east-1'
      process.env.EC2_INSTANCE_ID = 'i-1234567890abcdef0'

      expect(() => validateDemoMode()).toThrow(/\[SECURITY\] DEMO_MODE is enabled in PRODUCTION/)
      expect(consoleErrorMock).toHaveBeenCalled()
    })

    it('should throw if DEMO_MODE is true in GCP Cloud Run production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.GOOGLE_CLOUD_PROJECT = 'my-project'
      process.env.K_SERVICE = 'my-service'

      expect(() => validateDemoMode()).toThrow(/\[SECURITY\] DEMO_MODE is enabled in PRODUCTION/)
      expect(consoleErrorMock).toHaveBeenCalled()
    })

    it('should not throw if DEMO_MODE is true in local production build', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      // No VERCEL_ENV, AWS_EXECUTION_ENV, or GOOGLE_CLOUD_PROJECT

      expect(() => validateDemoMode()).not.toThrow()
    })
  })

  describe('isDemoMode', () => {
    it('should return true if DEMO_MODE is true and not in production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'development'

      expect(isDemoMode()).toBe(true)
    })

    it('should return false if DEMO_MODE is false', () => {
      process.env.DEMO_MODE = 'false'

      expect(isDemoMode()).toBe(false)
    })

    it('should throw if DEMO_MODE is true in production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'

      expect(() => isDemoMode()).toThrow(/\[SECURITY\] DEMO_MODE is enabled in PRODUCTION/)
    })
  })

  describe('requireDemoMode', () => {
    it('should not throw if DEMO_MODE is true and not in production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'development'

      expect(() => requireDemoMode()).not.toThrow()
    })

    it('should throw if DEMO_MODE is false', () => {
      process.env.DEMO_MODE = 'false'

      expect(() => requireDemoMode()).toThrow(/This feature requires DEMO_MODE=true/)
    })

    it('should throw if DEMO_MODE is true in production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'

      // Should throw the security error, not the missing demo mode error
      expect(() => requireDemoMode()).toThrow(/\[SECURITY\] DEMO_MODE is enabled in PRODUCTION/)
    })
  })

  describe('requireDemoModeAsync', () => {
    it('should not throw if DEMO_MODE is true and not in production', async () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'development'

      await expect(requireDemoModeAsync()).resolves.not.toThrow()
    })

    it('should throw if DEMO_MODE is false', async () => {
      process.env.DEMO_MODE = 'false'

      await expect(requireDemoModeAsync()).rejects.toThrow(/This feature requires DEMO_MODE=true/)
    })
  })
})
