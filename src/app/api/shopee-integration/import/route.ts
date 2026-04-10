import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = body.url || ''

    // Extract product ID from Shopee URL
    const idMatch = url.match(/i\.(\d+)\./)
    const productId = idMatch ? idMatch[1] : String(Date.now())

    // Extract name slug from URL
    const slugMatch = url.match(/shopee\.com\.my\/([^-]+)-/)
    const slug = slugMatch ? slugMatch[1] : 'product'

    // Determine category from URL keywords
    const lowerUrl = url.toLowerCase()
    let category = 'Electronics'
    let name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

    if (lowerUrl.includes('fashion') || lowerUrl.includes('shirt') || lowerUrl.includes('shoe')) {
      category = 'Fashion'
    } else if (lowerUrl.includes('beauty') || lowerUrl.includes('skin') || lowerUrl.includes('serum')) {
      category = 'Beauty'
    } else if (lowerUrl.includes('home') || lowerUrl.includes('lamp') || lowerUrl.includes('kitchen')) {
      category = 'Home'
    } else if (lowerUrl.includes('health') || lowerUrl.includes('tea') || lowerUrl.includes('vitamin')) {
      category = 'Health'
    } else if (lowerUrl.includes('food') || lowerUrl.includes('nasi') || lowerUrl.includes('snack')) {
      category = 'Food'
    }

    if (!name || name === slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())) {
      name = 'Shopee Product ' + productId.slice(-6)
    }

    return NextResponse.json({
      success: true,
      product: {
        name,
        price: +(Math.random() * 80 + 10).toFixed(2),
        originalPrice: +(Math.random() * 120 + 50).toFixed(2),
        image: null,
        category,
        shopName: 'Official Store',
        rating: +(Math.random() * 1 + 4).toFixed(1),
        sold: Math.floor(Math.random() * 50000 + 500),
        shopeeUrl: url,
        commission: +(Math.random() * 4 + 3).toFixed(1),
        productId,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid URL provided' }, { status: 400 })
  }
}
