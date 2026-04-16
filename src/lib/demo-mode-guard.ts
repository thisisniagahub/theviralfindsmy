/** DEMO_MODE production safeguard - fails fast if enabled in production */

export function validateDemoMode(): void {
  if (process.env.DEMO_MODE === 'true' && process.env.NODE_ENV === 'production') {
    const error = new Error(
      '⛔ DEMO_MODE is enabled in PRODUCTION. ' +
      'This is a critical security risk and must be disabled. ' +
      'Set DEMO_MODE=false in your environment variables.'
    )
    console.error(error.message)
    throw error
  }
}

// Run validation on import
if (process.env.NODE_ENV === 'production') {
  validateDemoMode()
}
