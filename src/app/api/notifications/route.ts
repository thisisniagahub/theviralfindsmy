import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { requireAuth, authenticatedDbFetch } from '@/lib/api-auth'

const DB_URL = process.env.DB_SERVICE_URL

export async function GET(request: NextRequest) {
  const rateLimited = await withRateLimit(request, RATE_LIMITS.api)
  if (rateLimited) return rateLimited

  if (process.env.DEMO_MODE === 'true') {
    const now = new Date()
    const notifications = [
      { id: 'notif-1', type: 'conversion', title: 'New Sale!', description: 'Laneige Water Sleeping Mask — RM 12.50 commission', read: false, timestamp: new Date(now.getTime() - 1800000).toISOString() },
      { id: 'notif-2', type: 'conversion', title: 'New Sale!', description: 'TWS Earbuds Pro Max — RM 14.20 commission', read: false, timestamp: new Date(now.getTime() - 7200000).toISOString() },
      { id: 'notif-3', type: 'payout', title: 'Payout Processing', description: 'RM 350.00 payout is being processed via CIMB', read: false, timestamp: new Date(now.getTime() - 28800000).toISOString() },
      { id: 'notif-4', type: 'conversion', title: 'New Sale!', description: 'Running Shoes — RM 15.60 commission', read: true, timestamp: new Date(now.getTime() - 86400000).toISOString() },
      { id: 'notif-5', type: 'payout', title: 'Payout Received', description: 'RM 500.00 has been deposited to Maybank ****4521', read: true, timestamp: new Date(now.getTime() - 259200000).toISOString() },
      { id: 'notif-6', type: 'conversion', title: 'Click Milestone!', description: 'Laneige Water Mask reached 400 clicks', read: true, timestamp: new Date(now.getTime() - 432000000).toISOString() },
    ]
    const filter = new URL(request.url).searchParams.get('filter') || 'all'
    let filtered = notifications
    if (filter === 'unread') filtered = notifications.filter(n => !n.read)
    else if (filter === 'conversions') filtered = notifications.filter(n => n.type === 'conversion')
    else if (filter === 'payouts') filtered = notifications.filter(n => n.type === 'payout')
    return NextResponse.json({
      notifications: filtered,
      unreadCount: notifications.filter(n => !n.read).length,
    })
  }
  try {
    const { auth, error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    const params = new URLSearchParams({ filter })
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }

    const data = await authenticatedDbFetch(DB_URL, `/notifications?${params.toString()}`, auth!).then(r => r.json())

    return NextResponse.json(data)
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load notifications' },
      { status: 500 }
    )
  }
}

// PUT: Mark all notifications as read (idempotent — no request body expected)
export async function PUT(request: NextRequest) {
  const { auth, error } = await requireAuth()
  if (error) return error

  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ success: true, message: 'All notifications marked as read' })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    // Ensure no unexpected payload is sent; this endpoint is idempotent
    const contentType = request.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const body = await request.json().catch(() => null)
      if (body && Object.keys(body).length > 0) {
        return NextResponse.json(
          { error: 'This endpoint does not accept a request body' },
          { status: 400 }
        )
      }
    }

    await authenticatedDbFetch(DB_URL, '/notifications', auth!, { method: 'PUT' })

    return NextResponse.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}
