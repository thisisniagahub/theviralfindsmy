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
    const currentAmount = 1450 + (body.amount || 50)
    return NextResponse.json({
      id,
      name: 'Monthly Earnings Target',
      targetAmount: 2000,
      currentAmount,
      period: 'monthly',
      status: currentAmount >= 2000 ? 'achieved' : 'active',
      updatedAt: now.toISOString(),
    })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const { id } = await params
    const body = await request.json()

    const goal = await fetch(`${DB_URL}/goals/${encodeURIComponent(id)}/update-progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error updating goal progress:', error)
    return NextResponse.json({ error: 'Failed to update goal progress' }, { status: 500 })
  }
}
