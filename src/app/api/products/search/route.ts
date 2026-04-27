import { NextRequest, NextResponse } from 'next/server'
import { searchProducts, getCategories } from '@/lib/shopee-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword') || searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  const sortByParam = searchParams.get('sortBy') || searchParams.get('sort') || undefined
  const sortOrderParam = searchParams.get('sortOrder') || undefined
  const category = searchParams.get('category') || undefined
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined

  // Map legacy sort param names to Shopee API sort fields
  let sortBy: 'price' | 'commission' | 'sold' | 'rating' | undefined
  if (sortByParam) {
    switch (sortByParam) {
      case 'price-low':
      case 'price-high':
      case 'price':
        sortBy = 'price'
        break
      case 'rating':
        sortBy = 'rating'
        break
      case 'popular':
      case 'sold':
        sortBy = 'sold'
        break
      case 'commission':
        sortBy = 'commission'
        break
    }
  }

  // Determine sort order
  let sortOrder: 'asc' | 'desc' | undefined
  if (sortOrderParam) {
    sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc'
  } else if (sortByParam === 'price-low') {
    sortOrder = 'asc'
  } else if (sortByParam === 'price-high') {
    sortOrder = 'desc'
  } else if (sortByParam) {
    sortOrder = 'desc' // default descending for rating/sold/commission
  }

  const result = await searchProducts({
    keyword,
    page,
    limit,
    sortBy,
    sortOrder,
    category,
    minPrice,
    maxPrice,
  })

  // Map ShopeeProduct fields to the existing product shape expected by the frontend
  const products = result.products.map(p => ({
    id: p.itemId,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
    rating: p.rating,
    sold: p.sold,
    category: p.category,
    shop: p.shopName,
    commissionRate: p.commissionRate,
    commission: p.commission,
    affiliateUrl: p.affiliateUrl,
  }))

  const categories = await getCategories()

  return NextResponse.json({
    products,
    categories,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  })
}
