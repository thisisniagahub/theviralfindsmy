import { NextResponse } from 'next/server'
import { getAllAgents, updateAgent } from '@/lib/shopee-office-store'
import type { OfficeState } from '@/lib/shopee-office-store'

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

/**
 * GET /api/shopee-office/agents
 * Returns all agents with positions, states, auth status, and task counts.
 */
export async function GET() {
  const agents = getAllAgents()

  const response = {
    agents: agents.map((a) => ({
      agentId: a.agentId,
      name: a.name,
      emoji: a.emoji,
      status: a.state,
      detail: a.detail,
      zone: a.area === 'breakroom' ? 'rest' : a.area === 'error' ? 'error' : a.area === 'writing' ? 'work' : 'sync',
      area: a.area,
      authStatus: a.authStatus,
      updated_at: a.updated_at,
      tasksCompleted: taskCounters[a.agentId] || 0,
    })),
  }

  return NextResponse.json(response)
}

/**
 * POST /api/shopee-office/agents
 * Sets ALL agents to a specific status (bulk update for testing/demo).
 *
 * Body: { status: 'idle' | 'writing' | ... }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const status = body.status as OfficeState

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    }

    const validStates: OfficeState[] = ['idle', 'writing', 'researching', 'executing', 'syncing', 'error']
    if (!validStates.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 })
    }

    const agents = getAllAgents()
    for (const agent of agents) {
      updateAgent(agent.agentId, { state: status })
      // Increment task counter when agent starts working
      if (status !== 'idle' && taskCounters[agent.agentId] !== undefined) {
        taskCounters[agent.agentId]++
      }
    }

    // Return updated agents
    const updated = getAllAgents()
    return NextResponse.json({
      agents: updated.map((a) => ({
        agentId: a.agentId,
        name: a.name,
        emoji: a.emoji,
        status: a.state,
        detail: a.detail,
        zone: a.area === 'breakroom' ? 'rest' : a.area === 'error' ? 'error' : a.area === 'writing' ? 'work' : 'sync',
        area: a.area,
        authStatus: a.authStatus,
        updated_at: a.updated_at,
        tasksCompleted: taskCounters[a.agentId] || 0,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
