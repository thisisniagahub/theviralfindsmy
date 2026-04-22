import { NextRequest, NextResponse } from 'next/server'
import { dbFetch, isDemoMode } from '@/lib/db-safe'
import { createGoalSchema } from '@/lib/validations'

const updateGoalSchema = createGoalSchema.partial()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const validated = updateGoalSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: 'Validation failed', details: validated.error.issues }, { status: 400 })
  }

  if (isDemoMode()) {
    const { id } = await params
    const now = new Date()
    return NextResponse.json({
      id,
      name: validated.data.name || 'Monthly Earnings Target',
      targetAmount: validated.data.targetAmount || 2000,
      currentAmount: 1450,
      period: 'monthly',
      endDate: validated.data.endDate || null,
      status: 'active',
      updatedAt: now.toISOString(),
    })
  }
  try {
    const { id } = await params

    const goal = await dbFetch(`/goals/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated.data),
    })

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
  if (isDemoMode()) {
    return NextResponse.json({ success: true })
  }
  try {
    const { id } = await params
    await dbFetch(`/goals/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
