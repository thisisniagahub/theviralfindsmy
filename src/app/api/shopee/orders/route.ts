/**
 * Shopee Orders API — Real order data and conversion tracking
 *
 * GET /api/shopee/orders          — List orders for a time range
 * GET /api/shopee/orders?stats=1  — Get order statistics summary
 */

import { NextResponse } from 'next/server'
import { getOrderList, getOrderStats, isShopeeConfigured } from '@/lib/shopee'

export async function GET(request: Request) {
  if (!isShopeeConfigured()) {
    return NextResponse.json(
      { error: 'Shopee SDK not configured', hint: 'Set SHOPEE_PARTNER_ID and SHOPEE_PARTNER_KEY in .env' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const days = Number(searchParams.get('days') ?? 7)
    const wantStats = searchParams.get('stats') === '1'
    const status = searchParams.get('status') as 'COMPLETED' | 'SHIPPED' | 'CANCELLED' | null

    const now = Math.floor(Date.now() / 1000)
    const timeRange = {
      timeFrom: now - 86400 * days,
      timeTo: now,
      field: 'create_time' as const,
    }

    // Return stats summary
    if (wantStats) {
      const stats = await getOrderStats(timeRange)
      return NextResponse.json({ stats, period: `${days}d` })
    }

    // Return order list
    const pageSize = Number(searchParams.get('pageSize') ?? 50)
    const cursor = searchParams.get('cursor') ?? undefined

    const result = await getOrderList({
      timeRange,
      pageSize,
      cursor,
      ...(status && { status }),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Shopee orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
