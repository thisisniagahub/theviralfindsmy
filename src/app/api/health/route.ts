import { NextResponse } from 'next/server'
import { checkOpenClawHealth } from '@/lib/openclaw'
import { env } from '@/lib/env'

export async function GET() {
  const version = '0.7.0'
  const timestamp = new Date().toISOString()
  const uptime = process.uptime()

  // In demo mode, return healthy status without checking services
  if (env.DEMO_MODE === 'true') {
    return NextResponse.json({
      status: 'healthy',
      version,
      timestamp,
      uptime,
      services: {
        database: 'healthy',
        openclaw: 'healthy',
        notification: 'healthy',
      },
      _demo: true,
    })
  }

  // Check database
  let databaseStatus = 'unhealthy'
  try {
    const { db } = await import('@/lib/db')
    await db.$queryRaw`SELECT 1`
    databaseStatus = 'healthy'
  } catch {
    databaseStatus = 'unhealthy'
  }

  // Check OpenClaw
  let openclawStatus = 'unhealthy'
  try {
    const health = await checkOpenClawHealth()
    openclawStatus = health.status === 'healthy' ? 'healthy' : 'degraded'
  } catch {
    openclawStatus = 'unhealthy'
  }

  // Check notification service
  let notificationStatus = 'unhealthy'
  try {
    const res = await fetch(`${env.NOTIFICATION_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    notificationStatus = res.ok ? 'healthy' : 'unhealthy'
  } catch {
    notificationStatus = 'unhealthy'
  }

  // Determine overall status
  const services = { database: databaseStatus, openclaw: openclawStatus, notification: notificationStatus }
  let status = 'healthy'
  if (databaseStatus === 'unhealthy') {
    status = 'unhealthy'
  } else if (openclawStatus === 'unhealthy' || notificationStatus === 'unhealthy') {
    status = 'degraded'
  }

  return NextResponse.json({
    status,
    version,
    timestamp,
    uptime,
    services,
  })
}
