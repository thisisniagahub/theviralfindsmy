import { NextResponse } from 'next/server'
import {
  checkOpenClawHealth,
  discoverAgents,
  discoverTools,
  getGatewayUrl,
} from '@/lib/openclaw'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  try {
    const [tools, agents, health] = await Promise.all([
      discoverTools(),
      discoverAgents(),
      checkOpenClawHealth(),
    ])

    return NextResponse.json({
      tools,
      agents,
      gateway: getGatewayUrl(),
      status: health,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (error) {
    console.error('OpenClaw discover route error:', error)
    return NextResponse.json({ error: 'Discovery request failed' }, { status: 500 })
  }
}
