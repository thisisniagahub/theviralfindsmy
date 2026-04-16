import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { joinOffice, getJoinInfo } from '@/lib/shopee-office-store'
import type { JoinRequest } from '@/lib/shopee-office-store'

/**
 * GET /api/shopee-office/join
 * Returns join information: max concurrent guests and current online count.
 */
export async function GET() {
  const info = getJoinInfo()
  return NextResponse.json(info)
}

/**
 * POST /api/shopee-office/join
 * Allows a guest agent to join the office.
 *
 * Body: { name: string, joinKey: string, state?: string, detail?: string }
 * Returns: { ok: true, agentId: string, authStatus: 'approved' }
 *
 * Validation:
 * - name must be non-empty and unique
 * - joinKey must match the expected key
 * - max concurrent guests is 3
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = (await request.json()) as JoinRequest

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid field: name' },
        { status: 400 }
      )
    }

    if (!body.joinKey || typeof body.joinKey !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid field: joinKey' },
        { status: 400 }
      )
    }

    // Trim name to max 32 characters
    const name = body.name.trim().slice(0, 32)

    const result = joinOffice({
      name,
      joinKey: body.joinKey,
      state: body.state,
      detail: body.detail,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      )
    }

    return NextResponse.json({
      ok: true,
      agentId: result.agentId,
      authStatus: result.authStatus,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
