import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, authenticatedDbFetch } from '@/lib/api-auth'

const DB_URL = process.env.DB_SERVICE_URL

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = await requireAuth()
  if (error) return error

  if (process.env.DEMO_MODE === 'true') {
    const { id } = await params
    const body = await request.json()
    const now = new Date()
    return NextResponse.json({
      id,
      name: body.name || 'Monthly Earnings Target',
      targetAmount: body.targetAmount || 2000,
      currentAmount: 1450,
      period: 'monthly',
      endDate: body.endDate || null,
      status: 'active',
      updatedAt: now.toISOString(),
    })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const { id } = await params
    const body = await request.json()

    const response = await authenticatedDbFetch(DB_URL, `/goals/${encodeURIComponent(id)}`, auth!, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Failed to update goal' }))
      return NextResponse.json(errorBody, { status: response.status })
    }
    const goal = await response.json()

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = await requireAuth()
  if (error) return error

  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ success: true })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const { id } = await params
    const response = await authenticatedDbFetch(DB_URL, `/goals/${encodeURIComponent(id)}`, auth!, { method: 'DELETE' })
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Failed to delete goal' }))
      return NextResponse.json(errorBody, { status: response.status })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
