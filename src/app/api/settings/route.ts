import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { updateSettingsSchema } from '@/lib/validations'
import { dbFetch, isDemoMode } from '@/lib/db-safe'
import { cache, TTL } from '@/lib/cache'
import { z } from 'zod'

export async function GET() {
  // Check cache first
  const cached = cache.get<any>('settings')
  if (cached) return NextResponse.json(cached)

  let settings: any

  if (isDemoMode()) {
    settings = {
      siteName: 'The Viral Finds',
      currency: 'MYR',
      timezone: 'Asia/Kuala_Lumpur',
      defaultCommissionRate: '5',
      shopeeAffId: 'demo_aff_id',
      notificationEmail: 'admin@theviralfinds.com',
      autoPauseExpired: 'true',
    }
  } else {
    try {
      settings = await dbFetch('/settings')
    } catch (error) {
      console.error('Settings GET error:', error)
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }
  }

  // Store in cache with 60s TTL
  cache.set('settings', settings, TTL.MEDIUM)

  return NextResponse.json(settings)
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

    // Invalidate settings cache after update
    cache.invalidate('settings')

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
