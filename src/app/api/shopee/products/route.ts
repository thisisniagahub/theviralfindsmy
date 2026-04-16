/**
 * Shopee Products API — Real product data from Shopee Open API
 *
 * GET  /api/shopee/products         — List products
 * GET  /api/shopee/products?ids=... — Get specific product details
 */

import { NextResponse } from 'next/server'
import { getProductList, getProductDetails, calculateBoostScore, isShopeeConfigured } from '@/lib/shopee'

export async function GET(request: Request) {
  if (!isShopeeConfigured()) {
    return NextResponse.json(
      { error: 'Shopee SDK not configured', hint: 'Set SHOPEE_PARTNER_ID and SHOPEE_PARTNER_KEY in .env' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')

    // If specific IDs requested, fetch details
    if (ids) {
      const itemIds = ids.split(',').map(Number).filter(Boolean)
      const products = await getProductDetails(itemIds)

      return NextResponse.json({
        products: products.map((p) => ({
          ...p,
          boostScore: calculateBoostScore(p),
        })),
      })
    }

    // Otherwise, list products
    const offset = Number(searchParams.get('offset') ?? 0)
    const pageSize = Number(searchParams.get('pageSize') ?? 20)
    const status = searchParams.get('status') as 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST' | null

    const result = await getProductList({
      offset,
      pageSize,
      ...(status && { status }),
    })

    return NextResponse.json({
      ...result,
      products: result.products.map((p) => ({
        ...p,
        boostScore: calculateBoostScore(p),
      })),
    })
  } catch (error) {
    console.error('[API] Shopee products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
