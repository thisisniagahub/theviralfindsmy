/**
 * DEPRECATED: Do not import PrismaClient directly in Next.js.
 * Prisma's native query engine can hang in Next.js 16 + Turbopack API route handlers.
 *
 * Use dbFetch() from @/lib/db-safe.ts instead.
 *
 * This file is kept for backward compatibility only and will be removed in a future release.
 */
console.warn('⚠️ DEPRECATED: Do not import from @/lib/db. Use dbFetch() from @/lib/db-safe.ts instead.')

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with query logging in development
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Check if we should use demo data instead of real DB queries.
 * In Next.js 16 + Turbopack, Prisma's native query engine can hang in API route handlers.
 * When DEMO_MODE=true, we skip DB queries entirely and return mock data.
 */
export function shouldUseDemoData(): boolean {
  return process.env.DEMO_MODE === 'true'
}
