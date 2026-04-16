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
      name: body.name || 'Beauty Week',
      description: body.description || 'Weekly beauty deals campaign',
      status: body.status || 'active',
      budget: body.budget || 1500,
      startDate: body.startDate ? new Date(body.startDate).toISOString() : null,
      endDate: body.endDate ? new Date(body.endDate).toISOString() : null,
      updatedAt: now.toISOString(),
    })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const { id } = await params
    const body = await request.json()

    const response = await authenticatedDbFetch(DB_URL, `/campaigns/${encodeURIComponent(id)}`, auth!, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    const campaign = await response.json()

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
    await authenticatedDbFetch(DB_URL, `/campaigns/${encodeURIComponent(id)}`, auth!, { method: 'DELETE' })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Campaign DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
