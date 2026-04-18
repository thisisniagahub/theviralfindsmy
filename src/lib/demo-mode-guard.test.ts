import { describe, it, expect, beforeEach, afterEach } from 'vitest'
describe('demo-mode-guard', () => {
  const originalEnv = process.env
  let guard: typeof import('./demo-mode-guard')
  beforeEach(async () => {
    // We cannot use vi.resetModules() as it causes issues in this environment.
    // Instead, we will directly mutate process.env and dynamically import
    // the module. Note: The module's root-level code might not re-run,
    // but the functions will pick up the mutated process.env.
    // Create a fresh copy of environment variables
    process.env = { ...originalEnv }
    // Clear variables that indicate production to avoid test contamination
    delete process.env.VERCEL_ENV
    delete process.env.AWS_EXECUTION_ENV
    delete process.env.AWS_REGION
    delete process.env.EC2_INSTANCE_ID
    delete process.env.GOOGLE_CLOUD_PROJECT
    delete process.env.K_SERVICE
    delete process.env.K_CONFIGURATION
    // Dynamically import
    guard = await import('./demo-mode-guard')
  })
  afterEach(() => {
    // Restore environment
    process.env = originalEnv
  })
  describe('validateDemoMode', () => {
    it('should not throw when DEMO_MODE is false in production', () => {
      process.env.DEMO_MODE = 'false'
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'
      expect(() => guard.validateDemoMode()).not.toThrow()
    })
    it('should throw when DEMO_MODE is true in Vercel production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'
      expect(() => guard.validateDemoMode()).toThrow(/DEMO_MODE is enabled in PRODUCTION/)
    })
    it('should not throw when DEMO_MODE is true in Vercel preview', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'preview'
      expect(() => guard.validateDemoMode()).not.toThrow()
    })
    it('should throw when DEMO_MODE is true in AWS Lambda production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.AWS_EXECUTION_ENV = 'AWS_lambda_nodejs20.x'
      expect(() => guard.validateDemoMode()).toThrow(/DEMO_MODE is enabled in PRODUCTION/)
    })
    it('should throw when DEMO_MODE is true in AWS EC2 production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.AWS_REGION = 'us-east-1'
      process.env.EC2_INSTANCE_ID = 'i-1234567890abcdef0'
      expect(() => guard.validateDemoMode()).toThrow(/DEMO_MODE is enabled in PRODUCTION/)
    })
    it('should throw when DEMO_MODE is true in GCP Cloud Run production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.GOOGLE_CLOUD_PROJECT = 'my-gcp-project'
      process.env.K_SERVICE = 'my-service'
      expect(() => guard.validateDemoMode()).toThrow(/DEMO_MODE is enabled in PRODUCTION/)
    })
    it('should not throw when DEMO_MODE is true in local non-production environment', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'development'
      expect(() => guard.validateDemoMode()).not.toThrow()
    })
    it('should not throw when DEMO_MODE is true in local production build', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      // No VERCEL_ENV, AWS, or GCP variables set
      expect(() => guard.validateDemoMode()).not.toThrow()
    })
  })
  describe('isDemoMode', () => {
    it('should return true when DEMO_MODE is true and not in production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'development'
      expect(guard.isDemoMode()).toBe(true)
    })
    it('should return false when DEMO_MODE is not true', () => {
      process.env.DEMO_MODE = 'false'
      process.env.NODE_ENV = 'development'
      expect(guard.isDemoMode()).toBe(false)
    })
    it('should throw when DEMO_MODE is true in production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'
      expect(() => guard.isDemoMode()).toThrow(/DEMO_MODE is enabled in PRODUCTION/)
    })
  })
  describe('requireDemoMode', () => {
    it('should throw when DEMO_MODE is not true', () => {
      process.env.DEMO_MODE = 'false'
      process.env.NODE_ENV = 'development'
      expect(() => guard.requireDemoMode()).toThrow(/This feature requires DEMO_MODE=true/)
    })
    it('should not throw when DEMO_MODE is true and not in production', () => {
      process.env.DEMO_MODE = 'true'
      process.env.NODE_ENV = 'development'
      expect(() => guard.requireDemoMode()).not.toThrow()
    })
  })
})
