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
