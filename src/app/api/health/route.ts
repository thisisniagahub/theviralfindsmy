import { NextResponse } from 'next/server'
import packageJson from '../../../../package.json'
import { env } from '@/lib/env'
import { withErrorHandling, ApiError } from '@/lib/api-handler'
import { successResponse, errorResponse } from '@/lib/api-response'

const APP_VERSION = packageJson.version

async function checkServiceHealth(
  url: string,
  name: string,
  timeoutMs = 3000
): Promise<{ name: string; status: 'healthy' | 'unhealthy' }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return { name, status: response.ok ? 'healthy' : 'unhealthy' }
  } catch {
    return { name, status: 'unhealthy' }
  }
}

export const GET = withErrorHandling(async () => {
  const startTime = Date.now()

  // Demo mode: return all healthy
  if (env.DEMO_MODE === 'true') {
    return NextResponse.json(successResponse({
      status: 'healthy',
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      services: {
        database: 'healthy',
        openclaw: 'healthy',
        notification: 'healthy',
      },
      responseTimeMs: Date.now() - startTime,
      _demo: true,
    }))
  }

  // Check services via HTTP (no direct Prisma imports)
  const dbServiceResult = await checkServiceHealth(env.DB_SERVICE_URL, 'database')
  const openclawResult = await checkServiceHealth(env.OPENCLAW_GATEWAY_URL, 'openclaw')
  const notifResult = await checkServiceHealth(env.NOTIFICATION_SERVICE_URL, 'notification')

  const services = {
    database: dbServiceResult.status,
    openclaw: openclawResult.status,
    notification: notifResult.status,
  }

  // Determine overall status
  const isDatabaseDown = services.database === 'unhealthy'
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
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    services,
    responseTimeMs: Date.now() - startTime,
  }

  return NextResponse.json(successResponse(response))
})
