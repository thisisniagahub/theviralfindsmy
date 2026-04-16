import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import {
  triggerAgentHook,
  triggerWakeHook,
} from '@/lib/openclaw'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  // 1. Check auth
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // 2. Check rate limit (10 req/min for AI)
  const rateLimited = await withRateLimit(request, RATE_LIMITS.ai)
  if (rateLimited) return rateLimited

  try {
    const body = await request.json()

    if (body.type === 'wake') {
      if (typeof body.text !== 'string' || !body.text.trim()) {
        return NextResponse.json({ error: 'text is required for wake hooks' }, { status: 400 })
      }

      const result = await triggerWakeHook(body.text, body.mode === 'next-heartbeat' ? 'next-heartbeat' : 'now')
      return NextResponse.json(result)
    }

    if (body.type === 'agent') {
      if (typeof body.message !== 'string' || !body.message.trim()) {
        return NextResponse.json({ error: 'message is required for agent hooks' }, { status: 400 })
      }

      const result = await triggerAgentHook({
        message: body.message,
        name: typeof body.name === 'string' ? body.name : undefined,
        agentId: typeof body.agentId === 'string' ? body.agentId : undefined,
        model: typeof body.model === 'string' ? body.model : undefined,
        thinking: typeof body.thinking === 'string' ? body.thinking : undefined,
        wakeMode: body.wakeMode === 'next-heartbeat' ? 'next-heartbeat' : 'now',
        deliver: typeof body.deliver === 'boolean' ? body.deliver : undefined,
        channel: typeof body.channel === 'string' ? body.channel : undefined,
        to: typeof body.to === 'string' ? body.to : undefined,
      })

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown hook type' }, { status: 400 })
  } catch (error) {
    console.error('OpenClaw hooks route error:', error)
    return NextResponse.json({ error: 'Hook request failed' }, { status: 500 })
  }
}
