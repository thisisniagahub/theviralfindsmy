import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import pkg from '../../../package.json'

export async function GET() {
  const startTime = Date.now()

  // Demo mode: return all healthy
  if (env.DEMO_MODE === 'true') {
    return NextResponse.json({
      status: 'healthy',
      version: pkg.version,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      services: {
        database: 'healthy',
        openclaw: 'healthy',
        notification: 'healthy',
      },
      responseTimeMs: Date.now() - startTime,
      _demo: true,
    })
  }

  // Check services
  const services = {
    database: 'healthy',
    openclaw: 'healthy',
    notification: 'healthy',
  }

  // Check database
  try {
    await db.$queryRaw`SELECT 1`
    services.database = 'healthy'
  } catch {
    services.database = 'unhealthy'
  }

  // Check OpenClaw Gateway
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${env.OPENCLAW_GATEWAY_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    services.openclaw = res.ok ? 'healthy' : 'unhealthy'
  } catch {
    services.openclaw = 'unhealthy'
  }

  // Check Notification Service
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${env.NOTIFICATION_SERVICE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    services.notification = res.ok ? 'healthy' : 'unhealthy'
  } catch {
    services.notification = 'unhealthy'
  }

  // Determine overall status
  const isDatabaseDown = services.database === 'unhealthy'
  const allServicesUp = Object.values(services).every((s) => s === 'healthy')
  const someServicesDown = Object.values(services).some((s) => s === 'unhealthy')

  let status: 'healthy' | 'degraded' | 'unhealthy'
  if (isDatabaseDown) {
    status = 'unhealthy'
  } else if (someServicesDown) {
    status = 'degraded'
  } else {
    status = 'healthy'
  }

  const response = {
    status,
    version: pkg.version,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    services,
    responseTimeMs: Date.now() - startTime,
  }

  return NextResponse.json(response)
}
