import { NextRequest, NextResponse } from 'next/server'

const DB_URL = process.env.DB_SERVICE_URL

// PUT: Bulk activate, pause, or expire links
export async function PUT(request: NextRequest) {
  if (process.env.DEMO_MODE === 'true') {
    const body = await request.json()
    return NextResponse.json({ success: true, affected: body.ids?.length || 3 })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const body = await request.json()

    // Basic inline validation
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: 'Validation failed', details: [{ message: 'ids must be a non-empty array', path: ['ids'] }] }, { status: 400 })
    }

    // No direct DB service endpoint for bulk operations — update individually
    const results = await Promise.allSettled(
      body.ids.map((id: string) =>
        fetch(`${DB_URL}/links/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: body.action === 'activate' ? 'active' : body.action === 'pause' ? 'paused' : 'expired' }),
        })
      )
    )
    const affected = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ success: true, affected })
  } catch (error) {
    console.error('Bulk PUT error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update links' }, { status: 500 })
  }
}

// DELETE: Bulk delete links
export async function DELETE(request: NextRequest) {
  if (process.env.DEMO_MODE === 'true') {
    const body = await request.json()
    return NextResponse.json({ success: true, affected: body.ids?.length || 2 })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const body = await request.json()

    // Basic inline validation
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: 'Validation failed', details: [{ message: 'ids must be a non-empty array', path: ['ids'] }] }, { status: 400 })
    }

    // No direct DB service endpoint for bulk delete — delete individually
    const results = await Promise.allSettled(
      body.ids.map((id: string) =>
        fetch(`${DB_URL}/links/${encodeURIComponent(id)}`, { method: 'DELETE' })
      )
    )
    const affected = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ success: true, affected })
  } catch (error) {
    console.error('Bulk DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete links' }, { status: 500 })
  }
}
