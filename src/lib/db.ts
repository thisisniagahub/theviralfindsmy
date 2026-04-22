import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

// Always use singleton (including production) to prevent connection pool exhaustion
// In serverless environments, consider using PgBouncer in transaction mode
// and set connection_limit in DATABASE_URL (e.g., ?connection_limit=5)
if (!globalForPrisma.prisma) globalForPrisma.prisma = db

export function shouldUseDemoData(): boolean {
  return process.env.DEMO_MODE === 'true'
}
