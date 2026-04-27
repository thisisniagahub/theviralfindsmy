import { NextRequest, NextResponse } from 'next/server'
import { dbFetch, isDemoMode } from '@/lib/db-safe'
import { updateLinkSchema } from '@/lib/validations'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isDemoMode()) {
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
    const { id } = await params
    const link = await dbFetch(`/links/${encodeURIComponent(id)}`)

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
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const validated = updateLinkSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: 'Validation failed', details: validated.error.issues }, { status: 400 })
  }

  if (isDemoMode()) {
    const { id } = await params
    const now = new Date()
    return NextResponse.json({
      id,
      name: validated.data.name || 'Laneige Water Mask',
      status: validated.data.status || 'active',
      campaignId: validated.data.campaignId || 'camp-1',
      expiresAt: validated.data.expiresAt || null,
      updatedAt: now.toISOString(),
    })
  }
  try {
    const { id } = await params

    const link = await dbFetch(`/links/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated.data),
    })

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
  if (isDemoMode()) {
    return NextResponse.json({ success: true })
  }
  try {
    const { id } = await params
    await dbFetch(`/links/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Link DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }
}
