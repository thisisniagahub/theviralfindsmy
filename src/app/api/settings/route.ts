import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { updateSettingsSchema } from '@/lib/validations'
import { z } from 'zod'

const DB_URL = process.env.DB_SERVICE_URL

export async function GET() {
  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({
      siteName: 'The Viral Finds',
      currency: 'MYR',
      timezone: 'Asia/Kuala_Lumpur',
      defaultCommissionRate: '5',
      shopeeAffId: 'demo_aff_id',
      notificationEmail: 'admin@theviralfinds.com',
      autoPauseExpired: 'true',
    })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const settings = await fetch(`${DB_URL}/settings`).then(r => r.json())
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const rateLimited = withRateLimit(request, RATE_LIMITS.mutation)
  if (rateLimited) return rateLimited

  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ success: true })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const body = await request.json()
    const validated = updateSettingsSchema.parse(body)

    await fetch(`${DB_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
