import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { bulkActionSchema, bulkDeleteSchema } from '@/lib/validations'
import { z } from 'zod'

const DB_URL = process.env.DB_SERVICE_URL

// PUT: Bulk activate, pause, or expire links
export async function PUT(request: NextRequest) {
  const rateLimited = withRateLimit(request, RATE_LIMITS.mutation)
  if (rateLimited) return rateLimited

  let validated
  try {
    const body = await request.json()
    validated = bulkActionSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ success: true, affected: validated.ids.length })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }

    // No direct DB service endpoint for bulk operations — update individually
    const results = await Promise.allSettled(
      validated.ids.map((id: string) =>
        fetch(`${DB_URL}/links/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: validated.action === 'activate' ? 'active' : validated.action === 'pause' ? 'paused' : 'expired' }),
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
  const rateLimited = withRateLimit(request, RATE_LIMITS.mutation)
  if (rateLimited) return rateLimited

  let validated
  try {
    const body = await request.json()
    validated = bulkDeleteSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ success: true, affected: validated.ids.length })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }

    // No direct DB service endpoint for bulk delete — delete individually
    const results = await Promise.allSettled(
      validated.ids.map((id: string) =>
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
