import { NextResponse } from 'next/server'
import {
  getGatewayWS,
  getPresence,
  getWsHealth,
} from '@/lib/openclaw'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  try {
    const gatewayWS = getGatewayWS()
    await gatewayWS.ensureConnected()

    const [health, presence] = await Promise.all([
      Promise.resolve(getWsHealth()),
      getPresence(),
    ])

    return NextResponse.json({
      connected: health.connected,
      health,
      presence,
      uptime: health.uptimeMs,
    })
  } catch (error) {
    console.error('OpenClaw WS status route error:', error)
    return NextResponse.json({ error: 'WS status request failed' }, { status: 500 })
  }
}
