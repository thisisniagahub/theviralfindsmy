import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'

const DB_URL = process.env.DB_SERVICE_URL

export async function GET(request: NextRequest) {
  const rateLimited = withRateLimit(request, RATE_LIMITS.api)
  if (rateLimited) return rateLimited

  if (process.env.DEMO_MODE === 'true') {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const now = new Date()
    const allConversions = Array.from({ length: 25 }, (_, i) => {
      const products = ['Laneige Water Sleeping Mask', 'TWS Earbuds Pro Max', 'Ultra Running Shoes V2', 'Vitamin C Brightening Serum', 'Cetaphil Gentle Skin Cleanser']
      const statuses: ('confirmed' | 'pending' | 'paid')[] = ['confirmed', 'pending', 'paid']
      return {
        id: `conv-${i + 1}`,
        orderId: `ORD-${10000 + i}`,
        amount: Math.round((Math.random() * 200 + 30) * 100) / 100,
        commission: Math.round((Math.random() * 30 + 5) * 100) / 100,
        status: statuses[i % 3],
        linkId: `link-${(i % 5) + 1}`,
        createdAt: new Date(now.getTime() - i * 3600000 * 6).toISOString(),
        affiliateLink: { name: products[i % 5], productName: products[i % 5], shortCode: `sc${i}` },
      }
    })
    const total = allConversions.length
    const start = (page - 1) * limit
    const conversions = allConversions.slice(start, start + limit)
    return NextResponse.json({
      conversions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '25'

    const data = await fetch(`${DB_URL}/conversions?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`).then(r => r.json())

    return NextResponse.json(data)
  } catch (error) {
    console.error('Conversions error:', error)
    return NextResponse.json({ error: 'Failed to load conversions' }, { status: 500 })
  }
}
