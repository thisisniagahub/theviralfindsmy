import { NextRequest, NextResponse } from 'next/server'

const DB_URL = process.env.DB_SERVICE_URL

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const goal = await fetch(`${DB_URL}/goals/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())

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
  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ success: true })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const { id } = await params
    await fetch(`${DB_URL}/goals/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
