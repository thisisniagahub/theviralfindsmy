import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { dbFetch, isDemoMode } from '@/lib/db-safe'
import { cache, TTL } from '@/lib/cache'

// Demo data for when Prisma is unavailable or in demo mode
function getDemoDashboard(period: string) {
  const now = new Date()
  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === 'month' ? now.getDate() : 30
  const chartDays = Math.min(days, 30)

  const earningsData = Array.from({ length: chartDays }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (chartDays - 1 - i))
    return {
      date: d.toISOString().split('T')[0],
      earnings: Math.round((Math.random() * 150 + 30) * 100) / 100,
      clicks: Math.floor(Math.random() * 80 + 20),
    }
  })

  return {
    totalLinks: 18,
    totalClicks: 6112,
    totalConversions: 284,
    totalEarnings: 3125.50,
    conversionRate: 4.6,
    earningsData,
    topLinks: [
      { id: '1', name: 'Laneige Water Mask', productName: 'Laneige Water Sleeping Mask', productImage: '/products/laneige-mask.png', clicks: 456, conversions: 34, earnings: 456.80, status: 'active', shortCode: 'lnMask', category: 'Beauty', campaign: { name: 'Beauty Week' } },
      { id: '2', name: 'TWS Earbuds Pro', productName: 'TWS Earbuds Pro Max', productImage: '/products/tws-earbuds.png', clicks: 389, conversions: 28, earnings: 398.40, status: 'active', shortCode: 'twPro', category: 'Electronics', campaign: { name: 'Tech Deals' } },
      { id: '3', name: 'Running Shoes', productName: 'Ultra Running Shoes V2', productImage: '/products/running-shoes.png', clicks: 312, conversions: 22, earnings: 312.00, status: 'active', shortCode: 'rnShoe', category: 'Sports', campaign: null },
      { id: '4', name: 'Vitamin C Serum', productName: 'Vitamin C Brightening Serum', productImage: '/products/vitamin-c.png', clicks: 267, conversions: 19, earnings: 267.30, status: 'active', shortCode: 'vitC', category: 'Beauty', campaign: { name: 'Beauty Week' } },
      { id: '5', name: 'Cetaphil Cleanser', productName: 'Cetaphil Gentle Skin Cleanser', productImage: '/products/cetaphil.png', clicks: 234, conversions: 16, earnings: 198.00, status: 'active', shortCode: 'ceta', category: 'Beauty', campaign: null },
    ],
    recentConversions: Array.from({ length: 10 }, (_, i) => ({
      id: `conv-${i + 1}`,
      orderId: `ORD-${10000 + i}`,
      amount: Math.round((Math.random() * 200 + 30) * 100) / 100,
      commission: Math.round((Math.random() * 30 + 5) * 100) / 100,
      status: ['confirmed', 'pending', 'paid'][i % 3],
      createdAt: new Date(Date.now() - i * 3600000 * 6).toISOString(),
      affiliateLink: { name: ['Laneige Mask', 'TWS Earbuds', 'Running Shoes', 'Vitamin C', 'AirPods Pro'][i % 5], productName: 'Product', shortCode: `sc${i}` },
    })),
    countryData: [
      { name: 'Malaysia', value: 3840 },
      { name: 'Singapore', value: 890 },
      { name: 'Indonesia', value: 650 },
      { name: 'Thailand', value: 420 },
      { name: 'Philippines', value: 312 },
    ],
    period,
    performanceScore: 72,
    performanceGrade: 'C',
    scoreBreakdown: [
      { label: 'Conversion Rate', earned: 10, max: 20 },
      { label: 'Total Clicks', earned: 10, max: 20 },
      { label: 'Total Earnings', earned: 20, max: 20 },
      { label: 'Active Links', earned: 15, max: 15 },
      { label: 'Earnings/Click', earned: 8, max: 15 },
      { label: 'Paused Links', earned: 5, max: 10 },
    ],
    _demo: true,
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = withRateLimit(request, RATE_LIMITS.api)
  if (rateLimited) return rateLimited

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30d'
  const cacheKey = `dashboard:${period}`

  // Check cache first
  const cached = cache.get<any>(cacheKey)
  if (cached) return NextResponse.json(cached)

  let data: any

  if (isDemoMode()) {
    data = getDemoDashboard(period)
  } else {
    try {
      data = await dbFetch(`/dashboard/stats?period=${encodeURIComponent(period)}`)
    } catch (error) {
      console.error('Dashboard API error:', error)
      return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
    }
  }

  // Store in cache with 30s TTL
  cache.set(cacheKey, data, TTL.SHORT)

  return NextResponse.json(data)
}
