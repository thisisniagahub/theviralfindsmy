/**
 * Timeout wrapper for database queries
 *
 * Provides a generic timeout wrapper that falls back to default values
 * when queries take too long. Used with the DB microservice or Prisma.
 */

const QUERY_TIMEOUT_MS = 8_000 // 8 seconds max per query

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = QUERY_TIMEOUT_MS,
  fallback: T
): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn(`[db-timeout] Query timed out after ${ms}ms, using fallback`)
      resolve(fallback)
    }, ms)

    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((err) => {
        clearTimeout(timer)
        console.warn(`[db-timeout] Query failed: ${err.message}, using fallback`)
        resolve(fallback)
      })
  })
}

/**
 * Check if the DB microservice is responsive
 */
export async function isDbServiceResponsive(): Promise<boolean> {
  const DB_SERVICE_URL = process.env.DB_SERVICE_URL
  if (!DB_SERVICE_URL) return false
  try {
    const res = await fetch(`${DB_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}
