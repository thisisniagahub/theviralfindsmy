/**
 * Shopee Shipping API — Logistics tracking and delivery status
 *
 * GET /api/shopee/shipping                   — List shipping channels
 * GET /api/shopee/shipping?order=ORDER_SN    — Get tracking info for order
 */

import { NextResponse } from 'next/server'
import { getShippingChannels, getTrackingInfo, isShopeeConfigured } from '@/lib/shopee'

export async function GET(request: Request) {
  if (!isShopeeConfigured()) {
    return NextResponse.json(
      { error: 'Shopee SDK not configured' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const orderSn = searchParams.get('order')

    // If order SN provided, get tracking
    if (orderSn) {
      const tracking = await getTrackingInfo(orderSn)
      if (!tracking) {
        return NextResponse.json(
          { error: 'Tracking info not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ tracking })
    }

    // Otherwise, list channels
    const channels = await getShippingChannels()
    return NextResponse.json({ channels })
  } catch (error) {
    console.error('[API] Shopee shipping error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipping data' },
      { status: 500 }
    )
  }
}
