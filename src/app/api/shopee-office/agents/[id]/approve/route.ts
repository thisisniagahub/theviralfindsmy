import { NextResponse } from 'next/server'
import { approveAgent } from '@/lib/shopee-office-store'
import type { ApproveRequest } from '@/lib/shopee-office-store'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * POST /api/shopee-office/agents/[id]/approve
 * Approves or rejects a guest agent's join request.
 *
 * Body: { action: 'approve' | 'reject' }
 * Returns: { ok: true }
 */
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as ApproveRequest

    if (!body.action || (body.action !== 'approve' && body.action !== 'reject')) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject".' },
        { status: 400 }
      )
    }

    const success = approveAgent(id, body.action)

    if (!success) {
      return NextResponse.json(
        { error: `Agent not found or cannot be modified: ${id}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
