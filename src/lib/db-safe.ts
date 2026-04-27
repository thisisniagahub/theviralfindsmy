/**
 * Safe database access for Next.js 16 + Turbopack
 *
 * Problem: Prisma's native binary engine hangs during Turbopack compilation
 * when statically imported in API route handlers.
 *
 * Solution: Proxy all DB queries through a separate microservice on port 3005.
 * API routes call this service via HTTP fetch instead of importing Prisma directly.
 *
 * On Vercel: DB_SERVICE_URL is not set, so dbFetch() will throw.
 * API routes should check isDemoMode() first and return mock data.
 */

/** Check if demo mode is active */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true'
}

/** Check if the DB microservice is available */
export function isDbServiceAvailable(): boolean {
  const url = process.env.DB_SERVICE_URL
  if (!url) return false
  // Don't consider localhost URLs as available in production (Vercel)
  if (process.env.NODE_ENV === 'production' && (url.includes('127.0.0.1') || url.includes('localhost'))) {
    return false
  }
  return true
}

/** Get the DB service base URL */
export function getDbServiceUrl(): string {
  return process.env.DB_SERVICE_URL || ''
}

const DB_SERVICE_API_KEY = process.env.DB_SERVICE_API_KEY || 'tvf-internal-api-key-2024'

/**
 * Fetch data from the DB microservice.
 * This replaces direct Prisma calls in API routes.
 * Includes API key authentication and timeout handling.
 *
 * Throws if DB_SERVICE_URL is not configured or unreachable.
 * Callers should check isDemoMode() first and handle the error.
 */
export async function dbFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = process.env.DB_SERVICE_URL
  if (!baseUrl) {
    throw new Error('Database service not configured: DB_SERVICE_URL is not set')
  }
  const url = `${baseUrl}${path}`
  const headers: Record<string, string> = {
    'x-api-key': DB_SERVICE_API_KEY,
    ...(options?.headers as Record<string, string> || {}),
  }
  const res = await fetch(url, {
    ...options,
    headers,
    signal: options?.signal || AbortSignal.timeout(15_000),
    cache: 'no-store',
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'Unknown error')
    throw new Error(`DB Service error (${res.status}): ${errorBody}`)
  }

  return res.json() as Promise<T>
}
