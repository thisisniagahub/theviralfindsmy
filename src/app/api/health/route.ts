import { NextRequest, NextResponse } from 'next/server'

/**
 * Health Check API — Returns status of all VPS services with latency measurements
 */

export const maxDuration = 10
export const dynamic = 'force-dynamic'

async function checkWithLatency(url: string, timeoutMs = 3000): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; latencyMs?: number }> {
  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    })
    const latencyMs = Date.now() - start
    if (res.ok) return { status: 'healthy', latencyMs }
    return { status: 'degraded', latencyMs }
  } catch {
    return { status: 'unhealthy', latencyMs: Date.now() - start }
  }
}

export async function GET(_request: NextRequest) {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'https://operator.gangniaga.my'
  const notifUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:3004'

  // Check OpenClaw Gateway
  const [openclawResult, dbResult, notifResult] = await Promise.all([
    checkWithLatency(`${gatewayUrl}/health`, 5000),
    // Check DB by hitting the dashboard API (which uses Prisma)
    checkWithLatency(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/dashboard`, 5000),
    checkWithLatency(notifUrl, 3000),
  ])

  const services = {
    openclaw: openclawResult.status,
    openclawLatencyMs: openclawResult.latencyMs,
    openclawDetail: gatewayUrl,
    database: dbResult.status,
    databaseLatencyMs: dbResult.latencyMs,
    notification: notifResult.status,
  }

  const overallHealthy = Object.values(services).every(v => v === 'healthy' || typeof v === 'number' || v === undefined)

  return NextResponse.json({
    status: overallHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services,
  })
}
