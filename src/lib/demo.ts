// Demo mode utility (T2.2)
// Wraps mock data generators with DEMO_MODE check.
// When DEMO_MODE=true, the app uses mock data and shows demo labels.
// When DEMO_MODE=false, real API calls are made instead.

/** Check if the app is running in demo mode */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true'
}

// Legacy export — captured at import time. Use isDemoMode() for runtime checks.
// This is fine because DEMO_MODE doesn't change during a server process lifetime.
export const isDemo = isDemoMode()

/**
 * Return demo value in demo mode, production value otherwise.
 * Use this to wrap any Math.random() or mock data generation
 * so in production mode, real API calls are made instead.
 */
export function demoData<T>(demoValue: T, prodValue: T): T {
  return isDemoMode() ? demoValue : prodValue
}

/**
 * Returns a label suffix to show in the UI when viewing demo data.
 * Returns empty string in production mode.
 */
export function getDemoLabel(): string {
  return isDemoMode() ? '📊 Demo Data' : ''
}
