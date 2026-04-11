import { NextResponse } from 'next/server'
import { updateAgent, getAllAgents, approveAgent } from '@/lib/shopee-office-store'
import type { OfficeState } from '@/lib/shopee-office-store'

type RouteContext = {
  params: Promise<{ id: string }>
}

// Simple in-memory task counter per agent
const taskCounters: Record<string, number> = {
  'product-scout': 47,
  'link-builder': 89,
  'campaign-master': 12,
  'analytics-agent': 156,
  'content-writer': 23,
  'payout-checker': 34,
  'seo-optimizer': 67,
  'review-monitor': 41,
}

function mapAgent(agent: ReturnType<typeof getAllAgents>[0]) {
  return {
    agentId: agent.agentId,
    name: agent.name,
    emoji: agent.emoji,
    status: agent.state,
    detail: agent.detail,
    zone: agent.area === 'breakroom' ? 'rest' : agent.area === 'error' ? 'error' : agent.area === 'writing' ? 'work' : 'sync',
    area: agent.area,
    authStatus: agent.authStatus,
    updated_at: agent.updated_at,
    tasksCompleted: taskCounters[agent.agentId] || 0,
  }
}

/**
 * POST /api/shopee-office/agents/[id]
 * Updates a single agent's state, detail, or authStatus.
 *
 * Body: { state?: string, detail?: string, authStatus?: string }
 * Returns: { ok: true, agent: updatedAgent }
 */
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    // Handle authStatus changes (approve/reject)
    if (body.authStatus && !body.state) {
      const action = body.authStatus === 'approved' ? 'approve' : 'reject'
      const success = approveAgent(id, action)
      if (!success) {
        return NextResponse.json(
          { error: `Could not update agent: ${id}` },
          { status: 404 }
        )
      }
      const agents = getAllAgents()
      const agent = agents.find((a) => a.agentId === id)
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }
      return NextResponse.json({ ok: true, agent: mapAgent(agent) })
    }

    // Handle state/detail changes (accept both 'state' and 'status' from frontend)
    const bodyState = body.state || body.status
    if (bodyState) {
      const validStates: OfficeState[] = ['idle', 'writing', 'researching', 'executing', 'syncing', 'error']
      if (!validStates.includes(bodyState)) {
        return NextResponse.json(
          { error: `Invalid status: ${bodyState}` },
          { status: 400 }
        )
      }

      const agent = updateAgent(id, { state: bodyState, detail: body.detail })

      if (!agent) {
        return NextResponse.json(
          { error: `Agent not found: ${id}` },
          { status: 404 }
        )
      }

      // Increment task counter when agent starts working
      if (bodyState !== 'idle' && taskCounters[id] !== undefined) {
        taskCounters[id]++
      }

      return NextResponse.json({ ok: true, agent: mapAgent(agent) })
    }

    return NextResponse.json({ error: 'Missing state or authStatus' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
