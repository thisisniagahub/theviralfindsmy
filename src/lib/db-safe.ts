/**
 * Safe database access for Next.js 16 + Turbopack
 *
 * Problem: Prisma's native binary engine hangs during Turbopack compilation
 * when statically imported in API route handlers.
 *
 * Solution: Proxy all DB queries through a separate microservice on port 3005.
 * API routes call this service via HTTP fetch instead of importing Prisma directly.
 */

const DB_SERVICE_URL = process.env.DB_SERVICE_URL || 'http://127.0.0.1:3005'

/** Check if demo mode is active */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true'
}

/** Get the DB service base URL */
export function getDbServiceUrl(): string {
  return DB_SERVICE_URL
}

/**
 * Fetch data from the DB microservice.
 * This replaces direct Prisma calls in API routes.
 */
export async function dbFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${DB_SERVICE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    signal: options?.signal || AbortSignal.timeout(15_000),
    cache: 'no-store',
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'Unknown error')
    throw new Error(`DB Service error (${res.status}): ${errorBody}`)
  }

  return res.json() as Promise<T>
}
