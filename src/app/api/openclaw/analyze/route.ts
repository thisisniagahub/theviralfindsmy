import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { requireAuth } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  // 1. Check auth
  const { auth, error } = await requireAuth()
  if (error) return error

  // 2. Check rate limit (10 req/min for AI)
  const rateLimited = await withRateLimit(request, RATE_LIMITS.ai)
  if (rateLimited) return rateLimited

  try {
    const body = await request.json()
    const tool = body.tool || 'general'

    const results: Record<string, Record<string, unknown>> = {
      'price-tracker': {
        tracked: [
          { name: 'TWS Wireless Earbuds Pro', current: 29.90, lowest: 19.90, highest: 59.90, trend: 'down', change: -15.0 },
          { name: 'Korean Skincare Set', current: 45.90, lowest: 38.90, highest: 89.90, trend: 'stable', change: 0 },
          { name: 'Gaming Mouse RGB', current: 39.90, lowest: 34.90, highest: 79.90, trend: 'up', change: 5.0 },
        ],
        alerts: 1,
      },
      'competitor': {
        competitors: [
          { name: 'TechGuruMY', links: 45, estEarnings: 4500, topCategory: 'Electronics', threat: 'High' },
          { name: 'BeautyQueenMY', links: 38, estEarnings: 3200, topCategory: 'Beauty', threat: 'Medium' },
          { name: 'FashionFindsMY', links: 32, estEarnings: 2800, topCategory: 'Fashion', threat: 'Medium' },
          { name: 'HomeDecoHub', links: 21, estEarnings: 1500, topCategory: 'Home', threat: 'Low' },
          { name: 'DealHunterMY', links: 56, estEarnings: 5100, topCategory: 'Mixed', threat: 'High' },
        ],
      },
      'trending': {
        products: [
          { name: 'Wireless Charging Pad 3-in-1', category: 'Electronics', trendScore: 95, velocity: '🔥 Hot' },
          { name: 'Mini Projector HD 1080p', category: 'Electronics', trendScore: 92, velocity: '🚀 Rising' },
          { name: 'Matcha Face Mask Pack', category: 'Beauty', trendScore: 88, velocity: '🔥 Hot' },
          { name: 'Portable Neck Fan USB', category: 'Electronics', trendScore: 85, velocity: '🚀 Rising' },
          { name: 'Organic Black Seed Oil', category: 'Health', trendScore: 82, velocity: '📈 Growing' },
          { name: 'Car Phone Mount Magnetic', category: 'Electronics', trendScore: 78, velocity: '📈 Growing' },
          { name: 'Bamboo Fiber Towel Set', category: 'Home', trendScore: 75, velocity: '📈 Growing' },
          { name: 'Protein Powder Chocolate 1kg', category: 'Health', trendScore: 72, velocity: '➡️ Steady' },
        ],
      },
      'keyword': {
        keywords: [
          { keyword: 'wireless earbuds malaysia', volume: 12400, competition: 'High', trend: 'up' },
          { keyword: 'cheap phone case', volume: 8900, competition: 'Low', trend: 'stable' },
          { keyword: 'korean skincare set', volume: 6700, competition: 'Medium', trend: 'up' },
          { keyword: 'portable blender shopee', volume: 5200, competition: 'Low', trend: 'up' },
          { keyword: 'running shoes women', volume: 15600, competition: 'High', trend: 'stable' },
          { keyword: 'led desk lamp usb', volume: 3800, competition: 'Low', trend: 'down' },
        ],
      },
      'link-doctor': {
        score: 87,
        grade: 'B+',
        items: [
          { check: 'Active Links Ratio', status: 'pass', detail: '15/18 links active (83%)' },
          { check: 'Click-to-Conversion Rate', status: 'pass', detail: '4.2% (above average)' },
          { check: 'Expired Links', status: 'warn', detail: '3 links expired — renew recommended' },
          { check: 'Link Diversity', status: 'pass', detail: 'Links spread across 6 categories' },
          { check: 'Mobile Optimization', status: 'fail', detail: '2 links have broken mobile previews' },
        ],
      },
      'scheduler': {
        bestTimes: [
          { day: 'Saturday', hour: '8:00 PM', platform: 'Instagram', score: 95 },
          { day: 'Sunday', hour: '9:00 PM', platform: 'TikTok', score: 92 },
          { day: 'Friday', hour: '7:00 PM', platform: 'WhatsApp Status', score: 88 },
          { day: 'Wednesday', hour: '8:30 PM', platform: 'Facebook', score: 85 },
          { day: 'Monday', hour: '9:00 PM', platform: 'Telegram', score: 82 },
        ],
      },
    }

    return NextResponse.json({
      tool,
      status: 'completed',
      data: results[tool] || results['general'],
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
