/**
 * Shopee Affiliate API Integration
 * 
 * When SHOPEE_AFFILIATE_API_KEY is set, real API calls are made.
 * When not set, falls back to demo data.
 */

import { isDemoMode } from '@/lib/demo'

const SHOPEE_API_BASE = 'https://partner.shopeemobile.com/api/v2'
const SHOPEE_AFFILIATE_BASE = 'https://affiliate.shopee.com.my/api/v1'

interface ShopeeProduct {
  itemId: string
  name: string
  image: string
  price: number
  originalPrice?: number
  commissionRate: number
  commission: number
  category: string
  rating: number
  sold: number
  shopName: string
  affiliateUrl: string
}

interface ShopeeSearchParams {
  keyword: string
  page?: number
  limit?: number
  sortBy?: 'price' | 'commission' | 'sold' | 'rating'
  sortOrder?: 'asc' | 'desc'
  category?: string
  minPrice?: number
  maxPrice?: number
}

/**
 * Search products on Shopee
 */
export async function searchProducts(params: ShopeeSearchParams): Promise<{
  products: ShopeeProduct[]
  total: number
  page: number
  limit: number
}> {
  const apiKey = process.env.SHOPEE_AFFILIATE_API_KEY

  if (!apiKey || isDemoMode()) {
    // Return demo data when no API key or in demo mode
    return getDemoSearchResults(params)
  }

  try {
    const url = new URL(`${SHOPEE_AFFILIATE_BASE}/products/search`)
    url.searchParams.set('keyword', params.keyword)
    url.searchParams.set('page', String(params.page || 1))
    url.searchParams.set('limit', String(params.limit || 20))
    if (params.sortBy) url.searchParams.set('sort_by', params.sortBy)
    if (params.sortOrder) url.searchParams.set('sort_order', params.sortOrder)
    if (params.category) url.searchParams.set('category', params.category)

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`Shopee API error: ${response.status}`)
      return getDemoSearchResults(params)
    }

    const data = await response.json()
    return {
      products: data.data?.products || [],
      total: data.data?.total || 0,
      page: params.page || 1,
      limit: params.limit || 20,
    }
  } catch (error) {
    console.error('Shopee API call failed:', error)
    return getDemoSearchResults(params)
  }
}

/**
 * Generate affiliate link for a product
 */
export async function generateAffiliateLink(productId: string, productUrl: string): Promise<string> {
  const apiKey = process.env.SHOPEE_AFFILIATE_API_KEY

  if (!apiKey || isDemoMode()) {
    // Demo: create a fake affiliate URL
    return `https://shopee.com.my/-p${productId}?af_siteid=demo_aff`
  }

  try {
    const response = await fetch(`${SHOPEE_AFFILIATE_BASE}/links/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_url: productUrl }),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`Shopee link generation error: ${response.status}`)
      return productUrl // Fallback to original URL
    }

    const data = await response.json()
    return data.data?.affiliate_url || productUrl
  } catch (error) {
    console.error('Shopee link generation failed:', error)
    return productUrl
  }
}

// Demo search results (fallback)
function getDemoSearchResults(params: ShopeeSearchParams): {
  products: ShopeeProduct[]
  total: number
  page: number
  limit: number
} {
  const allProducts: ShopeeProduct[] = [
    {
      itemId: 'item-1',
      name: 'Laneige Water Sleeping Mask',
      image: '/products/laneige-mask.png',
      price: 89.90,
      commissionRate: 0.14,
      commission: 12.59,
      category: 'Beauty',
      rating: 4.8,
      sold: 15000,
      shopName: 'Laneige Official',
      affiliateUrl: 'https://shopee.com.my/laneige-water-sleeping-mask?af_siteid=demo',
    },
    {
      itemId: 'item-2',
      name: 'TWS Earbuds Pro Max',
      image: '/products/tws-earbuds.png',
      price: 79.90,
      commissionRate: 0.18,
      commission: 14.38,
      category: 'Electronics',
      rating: 4.5,
      sold: 8000,
      shopName: 'AudioTech Store',
      affiliateUrl: 'https://shopee.com.my/tws-earbuds-pro?af_siteid=demo',
    },
    {
      itemId: 'item-3',
      name: 'Vitamin C Brightening Serum',
      image: '/products/vitamin-c.png',
      price: 45.90,
      commissionRate: 0.20,
      commission: 9.18,
      category: 'Beauty',
      rating: 4.6,
      sold: 22000,
      shopName: 'GlowUp Official',
      affiliateUrl: 'https://shopee.com.my/vitamin-c-serum?af_siteid=demo',
    },
    {
      itemId: 'item-4',
      name: 'Ultra Running Shoes V2',
      image: '/products/running-shoes.png',
      price: 129.90,
      commissionRate: 0.12,
      commission: 15.59,
      category: 'Sports',
      rating: 4.7,
      sold: 5000,
      shopName: 'SportZone',
      affiliateUrl: 'https://shopee.com.my/running-shoes-v2?af_siteid=demo',
    },
    {
      itemId: 'item-5',
      name: 'Cetaphil Gentle Cleanser',
      image: '/products/cetaphil.png',
      price: 34.90,
      commissionRate: 0.15,
      commission: 5.24,
      category: 'Beauty',
      rating: 4.9,
      sold: 35000,
      shopName: 'Cetaphil Official',
      affiliateUrl: 'https://shopee.com.my/cetaphil-cleanser?af_siteid=demo',
    },
    {
      itemId: 'item-6',
      name: 'Apple AirPods Pro',
      image: '/products/airpods-pro.png',
      price: 899.00,
      commissionRate: 0.05,
      commission: 44.95,
      category: 'Electronics',
      rating: 4.8,
      sold: 12000,
      shopName: 'Apple Authorized',
      affiliateUrl: 'https://shopee.com.my/airpods-pro?af_siteid=demo',
    },
    {
      itemId: 'item-7',
      name: 'Innisfree Green Tea Serum',
      image: '/products/innisfree-serum.png',
      price: 59.90,
      commissionRate: 0.16,
      commission: 9.58,
      category: 'Beauty',
      rating: 4.5,
      sold: 18000,
      shopName: 'Innisfree MY',
      affiliateUrl: 'https://shopee.com.my/innisfree-serum?af_siteid=demo',
    },
    {
      itemId: 'item-8',
      name: 'Snack Box Premium Set',
      image: '/products/snack-box.png',
      price: 29.90,
      commissionRate: 0.10,
      commission: 2.99,
      category: 'Food',
      rating: 4.3,
      sold: 45000,
      shopName: 'SnackHaus',
      affiliateUrl: 'https://shopee.com.my/snack-box?af_siteid=demo',
    },
    {
      itemId: 'item-9',
      name: 'Uniqlo Supima Cotton Tee',
      image: '/products/uniqlo-tshirt.png',
      price: 59.90,
      commissionRate: 0.08,
      commission: 4.79,
      category: 'Fashion',
      rating: 4.4,
      sold: 28000,
      shopName: 'Uniqlo MY',
      affiliateUrl: 'https://shopee.com.my/uniqlo-tee?af_siteid=demo',
    },
    {
      itemId: 'item-10',
      name: 'Ensure Gold Nutrition',
      image: '/products/ensure-gold.png',
      price: 89.90,
      commissionRate: 0.12,
      commission: 10.79,
      category: 'Health',
      rating: 4.7,
      sold: 9500,
      shopName: 'Abbott Official',
      affiliateUrl: 'https://shopee.com.my/ensure-gold?af_siteid=demo',
    },
  ]

  // Filter by keyword
  let filtered = allProducts
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(kw) || 
      p.category.toLowerCase().includes(kw) ||
      p.shopName.toLowerCase().includes(kw)
    )
  }

  // Filter by category
  if (params.category) {
    filtered = filtered.filter(p => p.category.toLowerCase() === params.category!.toLowerCase())
  }

  // Filter by price range
  if (params.minPrice) filtered = filtered.filter(p => p.price >= params.minPrice!)
  if (params.maxPrice) filtered = filtered.filter(p => p.price <= params.maxPrice!)

  // Sort
  if (params.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[params.sortBy as keyof ShopeeProduct] as number
      const bVal = b[params.sortBy as keyof ShopeeProduct] as number
      return params.sortOrder === 'desc' ? bVal - aVal : aVal - bVal
    })
  }

  // Paginate
  const page = params.page || 1
  const limit = params.limit || 20
  const start = (page - 1) * limit
  const paginated = filtered.slice(start, start + limit)

  return {
    products: paginated,
    total: filtered.length,
    page,
    limit,
  }
}

/**
 * Get product categories from Shopee
 */
export async function getCategories(): Promise<string[]> {
  return ['Beauty', 'Electronics', 'Fashion', 'Food', 'Health', 'Home', 'Sports', 'Toys']
}
