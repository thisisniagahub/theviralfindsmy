import { NextRequest, NextResponse } from 'next/server'

const DB_URL = process.env.DB_SERVICE_URL

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.DEMO_MODE === 'true') {
    const price = 89.90
    const originalPrice = (price * 1.3).toFixed(2)
    const productName = 'Laneige Water Sleeping Mask'
    const affiliateUrl = 'https://shopee.com.my/laneige-water-mask?aff_id=demo'
    return NextResponse.json({
      shareText: `🔥 Check out this deal! ${productName} - RM ${price.toFixed(2)} (was RM ${originalPrice})\n\nShop now: ${affiliateUrl}`,
      shareUrl: affiliateUrl,
      productName,
      price: price.toFixed(2),
      originalPrice,
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
    }) as { name: string; productName: string; productPrice: number; affiliateUrl: string }

    const price = link.productPrice || 0
    const originalPrice = price ? (price * 1.3).toFixed(2) : '0.00'
    const productName = link.productName || link.name

    const shareText = `🔥 Check out this deal! ${productName} - RM ${price.toFixed(2)} (was RM ${originalPrice})\n\nShop now: ${link.affiliateUrl}`
    const shareUrl = link.affiliateUrl

    return NextResponse.json({
      shareText,
      shareUrl,
      productName,
      price: price.toFixed(2),
      originalPrice,
    })
  } catch (error) {
    console.error('Share API error:', error)
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to generate share data' }, { status: 500 })
  }
}
