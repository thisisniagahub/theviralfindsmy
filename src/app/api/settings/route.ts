import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { updateSettingsSchema } from '@/lib/validations'
import { dbFetch, isDemoMode } from '@/lib/db-safe'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export async function GET() {
  if (isDemoMode()) {
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
    const settings = await dbFetch('/settings')
    return NextResponse.json(settings)
  } catch (error) {
    logger.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const rateLimited = withRateLimit(request, RATE_LIMITS.mutation)
  if (rateLimited) return rateLimited

  if (isDemoMode()) {
    return NextResponse.json({ success: true })
  }
  try {
    const body = await request.json()
    const validated = updateSettingsSchema.parse(body)

    await dbFetch('/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    logger.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
