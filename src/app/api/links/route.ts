import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { createLinkSchema } from '@/lib/validations'
import { z } from 'zod'

const DB_URL = process.env.DB_SERVICE_URL

export async function GET(request: NextRequest) {
  if (process.env.DEMO_MODE === 'true') {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const now = new Date()
    const demoLinks = Array.from({ length: 18 }, (_, i) => {
      const names = ['Laneige Water Mask', 'TWS Earbuds Pro', 'Running Shoes', 'Vitamin C Serum', 'Cetaphil Cleanser', 'AirPods Pro Case', 'Retinol Night Cream', 'Yoga Mat Premium', 'Mechanical Keyboard', 'Protein Powder', 'Wireless Charger', 'Sunscreen SPF50', 'Bluetooth Speaker', 'Lip Tint Set', 'Smart Watch Band', 'Coffee Maker', 'Backpack Travel', 'Face Sheet Masks']
      const categories = ['Beauty', 'Electronics', 'Sports', 'Beauty', 'Beauty', 'Electronics', 'Beauty', 'Sports', 'Electronics', 'Health', 'Electronics', 'Beauty', 'Electronics', 'Beauty', 'Electronics', 'Home', 'Fashion', 'Beauty']
      const campaigns = [{ id: 'camp-1', name: 'Beauty Week' }, { id: 'camp-2', name: 'Tech Deals' }, null, { id: 'camp-1', name: 'Beauty Week' }, null, { id: 'camp-2', name: 'Tech Deals' }, null, null, { id: 'camp-2', name: 'Tech Deals' }, null, null, { id: 'camp-1', name: 'Beauty Week' }, null, { id: 'camp-1', name: 'Beauty Week' }, null, null, null, { id: 'camp-1', name: 'Beauty Week' }]
      const clicks = [456, 389, 312, 267, 234, 198, 176, 155, 143, 132, 121, 110, 98, 87, 76, 65, 54, 43]
      const conversions = [34, 28, 22, 19, 16, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 3, 2]
      const earnings = [456.80, 398.40, 312.00, 267.30, 198.00, 178.20, 156.80, 139.50, 128.70, 118.80, 108.90, 99.00, 88.20, 78.30, 68.40, 58.50, 48.60, 38.70]
      const statuses: ('active' | 'paused')[] = ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'paused', 'active', 'active', 'active', 'active', 'active', 'active', 'paused', 'active', 'active', 'active']
      const shortCodes = ['lnMask', 'twPro', 'rnShoe', 'vitC', 'ceta', 'airCase', 'retCr', 'yogaM', 'mechK', 'protP', 'wirC', 'sunS', 'btSp', 'lipT', 'swB', 'coffM', 'bkTr', 'faceM']
      const price = (Math.random() * 200 + 20).toFixed(2)
      return {
        id: `link-${i + 1}`,
        name: names[i],
        productName: names[i],
        productImage: `/products/product-${i + 1}.png`,
        productUrl: `https://shopee.com.my/product-${i + 1}`,
        affiliateUrl: `https://shopee.com.my/product-${i + 1}?aff_id=demo`,
        shortCode: shortCodes[i],
        category: categories[i],
        clicks: clicks[i],
        conversions: conversions[i],
        earnings: earnings[i],
        commission: parseFloat((Math.random() * 10 + 2).toFixed(2)),
        productPrice: parseFloat(price),
        status: statuses[i],
        campaignId: campaigns[i]?.id || null,
        createdAt: new Date(now.getTime() - (18 - i) * 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - i * 3600000).toISOString(),
        expiresAt: i === 7 ? new Date(now.getTime() + 3 * 86400000).toISOString() : null,
        campaign: campaigns[i],
        dailyClicks: Array.from({ length: 7 }, () => Math.floor(Math.random() * 30 + 5)),
        expiresIn: i === 7 ? 3 : null,
        isExpired: false,
        expiryStatus: i === 7 ? 'expiring_soon' as const : 'none' as const,
      }
    })
    const total = demoLinks.length
    const start = (page - 1) * limit
    const pagedLinks = demoLinks.slice(start, start + limit)
    return NextResponse.json({
      links: pagedLinks,
      campaigns: [
        { id: 'camp-1', name: 'Beauty Week' },
        { id: 'camp-2', name: 'Tech Deals' },
      ],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'
    const status = searchParams.get('status') || ''
    const campaignId = searchParams.get('campaignId') || ''
    const search = searchParams.get('search') || ''

    const params = new URLSearchParams({ page, limit, status, campaignId, search })
    const data = await fetch(`${DB_URL}/links?${params.toString()}`).then(r => r.json())

    return NextResponse.json(data)
  } catch (error) {
    console.error('Links GET error:', error)
    return NextResponse.json({ error: 'Failed to load links' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = withRateLimit(request, RATE_LIMITS.mutation)
  if (rateLimited) return rateLimited

  let validated
  try {
    const body = await request.json()
    validated = createLinkSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (process.env.DEMO_MODE === 'true') {
    const now = new Date()
    return NextResponse.json({
      id: `link-demo-${Date.now()}`,
      name: validated.name || 'New Link',
      productName: validated.productName || 'Demo Product',
      productImage: validated.productImage || '/products/demo.png',
      productUrl: validated.productUrl,
      affiliateUrl: validated.affiliateUrl || 'https://shopee.com.my/demo?aff_id=demo',
      shortCode: validated.shortCode || `demo${Date.now().toString(36)}`,
      category: validated.category || 'Other',
      clicks: 0,
      conversions: 0,
      earnings: 0,
      commission: validated.commission || 0,
      productPrice: validated.productPrice || 0,
      status: validated.status || 'active',
      campaignId: validated.campaignId || null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: validated.expiresAt || null,
    }, { status: 201 })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }

    const link = await fetch(`${DB_URL}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
    }).then(r => r.json())

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error('Links POST error:', error)
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
  }
}
