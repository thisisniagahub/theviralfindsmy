import { NextRequest, NextResponse } from 'next/server'

const DB_URL = process.env.DB_SERVICE_URL

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.DEMO_MODE === 'true') {
    const { id } = await params
    const now = new Date()
    return NextResponse.json({
      id,
      name: 'Laneige Water Mask',
      productName: 'Laneige Water Sleeping Mask',
      productImage: '/products/laneige-mask.png',
      productUrl: 'https://shopee.com.my/laneige-water-mask',
      affiliateUrl: 'https://shopee.com.my/laneige-water-mask?aff_id=demo',
      shortCode: 'lnMask',
      category: 'Beauty',
      clicks: 456,
      conversions: 34,
      earnings: 456.80,
      commission: 12.50,
      productPrice: 89.90,
      status: 'active',
      campaignId: 'camp-1',
      createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      expiresAt: null,
      campaign: { id: 'camp-1', name: 'Beauty Week', status: 'active' },
      _count: { clickRecords: 456, conversionRecords: 34 },
      expiresIn: null,
      isExpired: false,
      expiryStatus: 'none' as const,
    })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const { id } = await params
    const link = await fetch(`${DB_URL}/links/${encodeURIComponent(id)}`).then(r => {
      if (!r.ok) throw new Error(`${r.status}`)
      return r.json()
    })

    return NextResponse.json(link)
  } catch (error) {
    console.error('Link GET error:', error)
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to load link' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.DEMO_MODE === 'true') {
    const { id } = await params
    const body = await request.json()
    const now = new Date()
    return NextResponse.json({
      id,
      name: body.name || 'Laneige Water Mask',
      status: body.status || 'active',
      campaignId: body.campaignId || 'camp-1',
      expiresAt: body.expiresAt || null,
      updatedAt: now.toISOString(),
    })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const { id } = await params
    const body = await request.json()

    const link = await fetch(`${DB_URL}/links/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())

    return NextResponse.json(link)
  } catch (error) {
    console.error('Link PUT error:', error)
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ success: true })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const { id } = await params
    await fetch(`${DB_URL}/links/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Link DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }
}
