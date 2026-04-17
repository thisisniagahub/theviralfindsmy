/**
 * DEMO_MODE multi-layered production safeguard
 * Prevents demo mode from being enabled in production environments
 */

/** Check if running in AWS production environment */
function isAwsProduction(): boolean {
  // AWS Lambda sets AWS_EXECUTION_ENV
  // EC2 instances have AWS_REGION but not AWS_EXECUTION_ENV with Lambda
  const awsExecutionEnv = process.env.AWS_EXECUTION_ENV
  const awsRegion = process.env.AWS_REGION

  if (awsExecutionEnv?.includes('lambda')) {
    return true
  }

  // Check for EC2 production by looking for AWS metadata
  if (awsRegion && process.env.EC2_INSTANCE_ID) {
    return true
  }

  return false
}

/** Check if running in GCP production environment */
function isGcpProduction(): boolean {
  // GCP Cloud Run, App Engine, or GKE sets specific environment variables
  const gcpProject = process.env.GOOGLE_CLOUD_PROJECT
  const gcpService = process.env.K_SERVICE // Cloud Run service name
  const gcpConfiguration = process.env.K_CONFIGURATION

  return !!(gcpProject && (gcpService || gcpConfiguration))
}

/** Check if running in Vercel production */
function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === 'production'
}

/** Check if running in any production environment */
function isProtectedProductionContext(): boolean {
  // Node.js production environment
  if (process.env.NODE_ENV === 'production') {
    // Check for cloud providers that indicate real production deployment
    if (isVercelProduction() || isAwsProduction() || isGcpProduction()) {
      return true
    }

    // If VERCEL_ENV is set but not production, we're on Vercel preview/deployment
    // but not in production - allow demo mode
    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
      return false
    }

    // For non-cloud environments, check if it's a local production build
    // Allow local production builds for testing
    if (!process.env.VERCEL_ENV && !isAwsProduction() && !isGcpProduction()) {
      return false
    }
  }

  return false
}

/** Validate demo mode is not enabled in production */
export function validateDemoMode(): void {
  if (process.env.DEMO_MODE === 'true' && isProtectedProductionContext()) {
    const environmentDetails = [
      `NODE_ENV: ${process.env.NODE_ENV}`,
      `VERCEL_ENV: ${process.env.VERCEL_ENV || 'not set'}`,
      `AWS_REGION: ${process.env.AWS_REGION || 'not set'}`,
      `GCP_PROJECT: ${process.env.GOOGLE_CLOUD_PROJECT || 'not set'}`,
    ].join(', ')

    const error = new Error(
      '[SECURITY] DEMO_MODE is enabled in PRODUCTION. ' +
      'This is a critical security risk. ' +
      `Environment: ${environmentDetails}. ` +
      'Set DEMO_MODE=false immediately.'
    )
    console.error(error.message)
    throw error
  }
}

/**
 * Check if demo mode is enabled and safe to use
 * Returns true only if DEMO_MODE=true AND not in production
 */
export function isDemoMode(): boolean {
  // Always validate first - throws if in production
  validateDemoMode()

  return process.env.DEMO_MODE === 'true'
}

/**
 * Require demo mode to be enabled
 * Throws error if not in demo mode OR if in production
 */
export function requireDemoMode(): void {
  validateDemoMode()

  if (process.env.DEMO_MODE !== 'true') {
    throw new Error(
      'This feature requires DEMO_MODE=true. ' +
      'Set DEMO_MODE=true in your environment variables.'
    )
  }
}

/**
 * Require demo mode to be enabled (async version)
 * Throws error if not in demo mode OR if in production
 */
export async function requireDemoModeAsync(): Promise<void> {
  requireDemoMode()
}

// Auto-validate on module import in production contexts
if (isProtectedProductionContext()) {
  validateDemoMode()
}
