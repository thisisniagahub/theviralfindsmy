import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { requireAuth, authenticatedDbFetch } from '@/lib/api-auth'
import { createGoalSchema } from '@/lib/validations'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const DB_URL = process.env.DB_SERVICE_URL

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
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const session = await getServerSession(authOptions)
    const userId = (session as any)?.user?.id
    const url = userId ? `${DB_URL}/goals?userId=${encodeURIComponent(userId)}` : `${DB_URL}/goals`
    const data = await fetch(url).then(r => r.json())

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
  const rateLimited = await withRateLimit(request, RATE_LIMITS.mutation)
  if (rateLimited) return rateLimited

  const { auth, error } = await requireAuth()
  if (error) return error

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

  if (process.env.DEMO_MODE === 'true') {
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
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }

    const response = await authenticatedDbFetch(DB_URL, '/goals', auth!, {
      method: 'POST',
      body: JSON.stringify(validated),
    })
    const goal = await response.json()

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
