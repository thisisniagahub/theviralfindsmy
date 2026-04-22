import { NextRequest, NextResponse } from 'next/server'
import { dbFetch, isDemoMode } from '@/lib/db-safe'
import { createCampaignSchema } from '@/lib/validations'

const updateCampaignSchema = createCampaignSchema.partial()

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

  const validated = updateCampaignSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: 'Validation failed', details: validated.error.issues }, { status: 400 })
  }

  if (isDemoMode()) {
    const { id } = await params
    const now = new Date()
    return NextResponse.json({
      id,
      name: validated.data.name || 'Beauty Week',
      description: validated.data.description || 'Weekly beauty deals campaign',
      status: validated.data.status || 'active',
      budget: validated.data.budget || 1500,
      startDate: validated.data.startDate ? new Date(validated.data.startDate).toISOString() : null,
      endDate: validated.data.endDate ? new Date(validated.data.endDate).toISOString() : null,
      updatedAt: now.toISOString(),
    })
  }
  try {
    const { id } = await params

    const campaign = await dbFetch(`/campaigns/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated.data),
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Campaign PUT error:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
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
    await dbFetch(`/campaigns/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Campaign DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
