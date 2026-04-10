import { NextResponse } from 'next/server'
import { leaveOffice } from '@/lib/shopee-office-store'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * POST /api/shopee-office/agents/[id]/leave
 * Removes a guest agent from the office.
 *
 * Returns: { ok: true }
 */
export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const success = leaveOffice(id)

    if (!success) {
      return NextResponse.json(
        { error: `Agent not found: ${id}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
