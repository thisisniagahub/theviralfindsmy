/**
 * Shopee Shop Status API — Shop info, account health, and OAuth callback
 *
 * GET  /api/shopee/shop           — Shop info + account health
 * GET  /api/shopee/shop?action=auth&callback=URL — Get OAuth URL
 * POST /api/shopee/shop           — OAuth code exchange
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getShopInfo,
  getAccountHealth,
  getShopeeConnectionState,
  isShopeeConfigured,
  getAuthorizationUrl,
  authenticateWithCode,
} from '@/lib/shopee'

const authCodeSchema = z.object({
  code: z.string().min(1),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Generate OAuth URL
  if (action === 'auth') {
    const callback = searchParams.get('callback')
    if (!callback) {
      return NextResponse.json({ error: 'callback URL required' }, { status: 400 })
    }
    const url = getAuthorizationUrl(callback)
    if (!url) {
      return NextResponse.json({ error: 'Shopee SDK not configured' }, { status: 503 })
    }
    return NextResponse.json({ authUrl: url })
  }

  // Return connection state + shop info
  const state = getShopeeConnectionState()

  if (!isShopeeConfigured()) {
    return NextResponse.json({
      configured: false,
      connection: state,
      hint: 'Set SHOPEE_PARTNER_ID and SHOPEE_PARTNER_KEY in .env',
    })
  }

  try {
    const [shopInfo, accountHealth] = await Promise.all([
      getShopInfo(),
      getAccountHealth(),
    ])

    return NextResponse.json({
      configured: true,
      connection: state,
      shop: shopInfo,
      health: accountHealth,
    })
  } catch (error) {
    console.error('[API] Shopee shop error:', error)
    return NextResponse.json({
      configured: true,
      connection: state,
      shop: null,
      health: null,
      error: 'Failed to fetch shop data',
    })
  }
}

export async function POST(request: Request) {
  if (!isShopeeConfigured()) {
    return NextResponse.json(
      { error: 'Shopee SDK not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { code } = authCodeSchema.parse(body)

    const success = await authenticateWithCode(code)

    if (!success) {
      return NextResponse.json(
        { error: 'OAuth authentication failed' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true, message: 'Shop linked successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 422 }
      )
    }
    console.error('[API] Shopee auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
