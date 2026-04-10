/**
 * Timeout wrapper for Prisma queries in Next.js 16 + Turbopack
 * Prisma queries can hang in Turbopack route handlers due to binary engine loading issues.
 * This wrapper adds a timeout and falls back to demo data if the query hangs.
 */

import { getDb } from '@/lib/db-safe'

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
 * Check if Prisma is responsive by doing a simple count query
 */
let prismaReady: boolean | null = null

export async function isPrismaResponsive(): Promise<boolean> {
  if (prismaReady === true) return true

  try {
    const db = await getDb()
    const result = await Promise.race([
      db.affiliateLink.count(),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ])
    if (typeof result === 'number') {
      prismaReady = true
      return true
    }
  } catch {
    prismaReady = false
  }
  return false
}
