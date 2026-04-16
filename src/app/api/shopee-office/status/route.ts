import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getOfficeStatus, setOfficeStatus } from '@/lib/shopee-office-store'
import type { SetStatusRequest } from '@/lib/shopee-office-store'

const VALID_STATES = ['idle', 'writing', 'researching', 'executing', 'syncing', 'error']

/**
 * GET /api/shopee-office/status
 * Returns the current office status including state, detail, progress, and timestamp.
 * Auto-idles if no update received for 300 seconds.
 */
export async function GET() {
  const status = getOfficeStatus()
  return NextResponse.json(status)
}

/**
 * POST /api/shopee-office/status
 * Sets the office status. Accepts state, detail, and optional progress.
 *
 * Body: { state: OfficeState, detail: string, progress?: number }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = (await request.json()) as SetStatusRequest

    if (!body.state || !body.detail) {
      return NextResponse.json(
        { error: 'Missing required fields: state, detail' },
        { status: 400 }
      )
    }

    if (!VALID_STATES.includes(body.state)) {
      return NextResponse.json(
        { error: `Invalid state. Must be one of: ${VALID_STATES.join(', ')}` },
        { status: 400 }
      )
    }

    const status = setOfficeStatus(body)
    return NextResponse.json(status)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
