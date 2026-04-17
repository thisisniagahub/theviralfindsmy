import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getAllAgents, updateAgent } from '@/lib/shopee-office-store'
import type { OfficeState } from '@/lib/shopee-office-store'
import { withErrorHandling, ValidationError, AuthenticationError } from '@/lib/api-handler'
import { successResponse, errorResponse } from '@/lib/api-response'

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
export const GET = withErrorHandling(async () => {
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

  return NextResponse.json(successResponse(response))
})

/**
 * POST /api/shopee-office/agents
 * Sets ALL agents to a specific status (bulk update for testing/demo).
 *
 * Body: { status: 'idle' | 'writing' | ... }
 */
export const POST = withErrorHandling(async (request: Request) => {
  const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
  if (!session?.user?.id) {
    throw new AuthenticationError('Authentication required')
  }
  const userId = session.user.id

  const body = await request.json()
  const status = body.status as OfficeState

  if (!status) {
    throw new ValidationError('Missing status field')
  }

  const validStates: OfficeState[] = ['idle', 'writing', 'researching', 'executing', 'syncing', 'error']
  if (!validStates.includes(status)) {
    throw new ValidationError(`Invalid status: ${status}`)
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
  return NextResponse.json(successResponse({
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
  }))
})
