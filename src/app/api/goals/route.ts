import { NextRequest, NextResponse } from 'next/server'

const DB_URL = process.env.DB_SERVICE_URL || 'http://127.0.0.1:3005'

export async function GET() {
  if (process.env.DEMO_MODE === 'true') {
    const now = new Date()
    const goals = [
      { id: 'goal-1', name: 'Monthly Earnings Target', targetAmount: 2000, currentAmount: 1450, period: 'monthly', startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate: null, status: 'active', createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(), updatedAt: now.toISOString() },
      { id: 'goal-2', name: 'Q1 Revenue Goal', targetAmount: 5000, currentAmount: 5000, period: 'quarterly', startDate: new Date(now.getFullYear(), 0, 1).toISOString(), endDate: new Date(now.getFullYear(), 2, 31).toISOString(), status: 'achieved', createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(), updatedAt: new Date(now.getTime() - 5 * 86400000).toISOString() },
      { id: 'goal-3', name: 'New Product Launch', targetAmount: 800, currentAmount: 320, period: 'monthly', startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate: null, status: 'active', createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(), updatedAt: now.toISOString() },
    ]
    return NextResponse.json({
      goals,
      summary: {
        totalGoals: 3,
        activeGoals: 2,
        achievedGoals: 1,
        totalTarget: 7800,
        totalCurrent: 6770,
        overallProgress: 87,
      },
    })
  }
  try {
    const data = await fetch(`${DB_URL}/goals`).then(r => r.json())

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({
      goals: [],
      summary: {
        totalGoals: 0,
        activeGoals: 0,
        achievedGoals: 0,
        totalTarget: 0,
        totalCurrent: 0,
        overallProgress: 0,
      },
    })
  }
}

export async function POST(request: NextRequest) {
  if (process.env.DEMO_MODE === 'true') {
    const body = await request.json()
    const now = new Date()
    return NextResponse.json({
      id: `goal-demo-${Date.now()}`,
      name: body.name || 'New Goal',
      targetAmount: body.targetAmount || 1000,
      currentAmount: 0,
      period: body.period || 'monthly',
      startDate: now.toISOString(),
      endDate: body.endDate || null,
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }, { status: 201 })
  }
  try {
    const body = await request.json()

    // Basic inline validation
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Validation failed', details: [{ message: 'name is required', path: ['name'] }] }, { status: 400 })
    }
    if (!body.targetAmount || typeof body.targetAmount !== 'number' || body.targetAmount <= 0) {
      return NextResponse.json({ error: 'Validation failed', details: [{ message: 'targetAmount must be a positive number', path: ['targetAmount'] }] }, { status: 400 })
    }

    const goal = await fetch(`${DB_URL}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
