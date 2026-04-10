import { NextResponse } from 'next/server'
import { getGuestAgents } from '@/lib/shopee-office-store'

/**
 * GET /api/shopee-office/guest-agents
 * Returns a list of all guest (non-main) agents currently in or recently in the office.
 *
 * Returns: { agents: GuestAgent[] }
 */
export async function GET() {
  const agents = getGuestAgents()

  return NextResponse.json({
    agents: agents.map((a) => ({
      agentId: a.agentId,
      name: a.name,
      state: a.state,
      detail: a.detail,
      authStatus: a.authStatus,
      joinedAt: a.joinedAt,
      lastPushAt: a.lastPushAt,
    })),
  })
}
