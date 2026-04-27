import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { createGoalSchema } from '@/lib/validations'
import { dbFetch, isDemoMode } from '@/lib/db-safe'
import { z } from 'zod'

export async function GET() {
  if (isDemoMode()) {
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
    const data = await dbFetch('/goals')

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Failed to load goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = withRateLimit(request, RATE_LIMITS.mutation)
  if (rateLimited) return rateLimited

  let validated
  try {
    const body = await request.json()
    validated = createGoalSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (isDemoMode()) {
    const now = new Date()
    return NextResponse.json({
      id: `goal-demo-${Date.now()}`,
      name: validated.name || 'New Goal',
      targetAmount: validated.targetAmount || 1000,
      currentAmount: 0,
      period: validated.period || 'monthly',
      startDate: now.toISOString(),
      endDate: validated.endDate || null,
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }, { status: 201 })
  }
  try {
    const goal = await dbFetch('/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
