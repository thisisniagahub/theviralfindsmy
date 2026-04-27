import { NextRequest, NextResponse } from 'next/server'
import { dbFetch, isDemoMode } from '@/lib/db-safe'
import { updateGoalProgressSchema } from '@/lib/validations'
import { z } from 'zod'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isDemoMode()) {
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
    const { id } = await params
    const body = await request.json()

    let validated
    try {
      validated = updateGoalProgressSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
      }
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const goal = await dbFetch(`/goals/${encodeURIComponent(id)}/update-progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error updating goal progress:', error)
    return NextResponse.json({ error: 'Failed to update goal progress' }, { status: 500 })
  }
}
