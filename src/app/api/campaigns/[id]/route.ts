import { NextRequest, NextResponse } from 'next/server'

const DB_URL = process.env.DB_SERVICE_URL || 'http://127.0.0.1:3005'

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
    const { id } = await params
    const body = await request.json()

    const campaign = await fetch(`${DB_URL}/campaigns/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())

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
  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ success: true })
  }
  try {
    const { id } = await params
    await fetch(`${DB_URL}/campaigns/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Campaign DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
