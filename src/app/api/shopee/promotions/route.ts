/**
 * Shopee Promotions API — Vouchers, discounts, and deals management
 *
 * GET  /api/shopee/promotions               — List vouchers and discounts
 * POST /api/shopee/promotions               — Create a new voucher
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getVoucherList, getDiscountList, createVoucher, isShopeeConfigured } from '@/lib/shopee'

const createVoucherSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(4).max(10).toUpperCase(),
  startTime: z.number().min(Math.floor(Date.now() / 1000)),
  endTime: z.number(),
  discountAmount: z.number().min(1),
  usageQuantity: z.number().min(1).max(10000),
  minSpend: z.number().optional(),
})

export async function GET(request: Request) {
  if (!isShopeeConfigured()) {
    return NextResponse.json(
      { error: 'Shopee SDK not configured' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'all' // 'vouchers' | 'discounts' | 'all'

    const result: Record<string, unknown> = {}

    if (type === 'vouchers' || type === 'all') {
      result.vouchers = await getVoucherList({
        status: (searchParams.get('status') as 'ongoing' | 'upcoming' | 'expired') ?? 'all',
      })
    }

    if (type === 'discounts' || type === 'all') {
      result.discounts = await getDiscountList({
        status: (searchParams.get('status') as 'ongoing' | 'upcoming' | 'expired') ?? undefined,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Shopee promotions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    )
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
    const validated = createVoucherSchema.parse(body)

    const result = await createVoucher(validated)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 422 }
      )
    }
    console.error('[API] Shopee create voucher error:', error)
    return NextResponse.json(
      { error: 'Failed to create voucher' },
      { status: 500 }
    )
  }
}
