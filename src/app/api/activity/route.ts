import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, authenticatedDbFetch } from '@/lib/api-auth'

const DB_URL = process.env.DB_SERVICE_URL

export async function GET(request: NextRequest) {
  if (process.env.DEMO_MODE === 'true') {
    const now = new Date()
    const activities = [
      { id: 'act-1', type: 'conversion', title: 'New sale: Laneige Water Sleeping Mask', description: 'RM 12.50 commission earned · Order ORD-10001', timestamp: new Date(now.getTime() - 1800000).toISOString(), metadata: { amount: 89.90, commission: 12.50, status: 'confirmed', productName: 'Laneige Water Sleeping Mask' }, icon: 'ShoppingCart', time: '30m ago' },
      { id: 'act-2', type: 'click_milestone', title: 'TWS Earbuds Pro reached 300 clicks!', description: 'Your affiliate link for "TWS Earbuds Pro Max" hit a new milestone', timestamp: new Date(now.getTime() - 7200000).toISOString(), metadata: { linkId: 'link-2', clicks: 389, milestone: 300 }, icon: 'MousePointer', time: '2h ago' },
      { id: 'act-3', type: 'link_created', title: 'New link created: Vitamin C Serum', description: 'Beauty · Vitamin C Brightening Serum', timestamp: new Date(now.getTime() - 14400000).toISOString(), metadata: { linkId: 'link-4', shortCode: 'vitC', category: 'Beauty' }, icon: 'Link2', time: '4h ago' },
      { id: 'act-4', type: 'payout_requested', title: 'Payout of RM 350.00 requested', description: 'Status: Processing · Bank Transfer via CIMB', timestamp: new Date(now.getTime() - 28800000).toISOString(), metadata: { amount: 350, status: 'processing', method: 'bank_transfer' }, icon: 'ArrowUpRight', time: '8h ago' },
      { id: 'act-5', type: 'conversion', title: 'New sale: Running Shoes', description: 'RM 15.60 commission earned · Order ORD-10000', timestamp: new Date(now.getTime() - 43200000).toISOString(), metadata: { amount: 129.90, commission: 15.60, status: 'pending', productName: 'Ultra Running Shoes V2' }, icon: 'ShoppingCart', time: '12h ago' },
      { id: 'act-6', type: 'goal_achieved', title: 'Goal milestone: Monthly Earnings Target', description: '72% achieved — RM 1,450.00 of RM 2,000.00', timestamp: new Date(now.getTime() - 86400000).toISOString(), metadata: { goalId: 'goal-1', current: 1450, target: 2000, percentage: 72 }, icon: 'Trophy', time: '1 day ago' },
      { id: 'act-7', type: 'campaign_started', title: 'Campaign started: Beauty Week', description: 'Budget RM 1,500.00 · 1 Mar 2026', timestamp: new Date(now.getTime() - 172800000).toISOString(), metadata: { campaignId: 'camp-1', budget: 1500, status: 'active' }, icon: 'Megaphone', time: '2 days ago' },
      { id: 'act-8', type: 'payout_received', title: 'Payout of RM 500.00 received', description: 'Bank Transfer via Maybank — ****4521', timestamp: new Date(now.getTime() - 259200000).toISOString(), metadata: { amount: 500, method: 'bank_transfer', bankName: 'Maybank' }, icon: 'Wallet', time: '3 days ago' },
      { id: 'act-9', type: 'link_updated', title: 'Link updated: Cetaphil Cleanser', description: '234 clicks, 16 conversions, RM 198.00 earned', timestamp: new Date(now.getTime() - 345600000).toISOString(), metadata: { linkId: 'link-5', clicks: 234, earnings: 198 }, icon: 'Edit', time: '4 days ago' },
      { id: 'act-10', type: 'conversion', title: 'New sale: TWS Earbuds Pro', description: 'RM 14.20 commission earned · Order ORD-9998', timestamp: new Date(now.getTime() - 432000000).toISOString(), metadata: { amount: 79.90, commission: 14.20, status: 'paid', productName: 'TWS Earbuds Pro Max' }, icon: 'ShoppingCart', time: '5 days ago' },
    ]
    return NextResponse.json({
      activities,
      totalActivities: 15,
      todayCount: 3,
      thisWeekCount: 8,
      limit: 20,
      hasMore: false,
    })
  }
  try {
    const { auth, error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '20'

    const params = new URLSearchParams({ limit })
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }

    const data = await authenticatedDbFetch(DB_URL, `/activity?${params.toString()}`, auth!).then(r => r.json())

    return NextResponse.json(data)
  } catch (error) {
    console.error('Activity feed error:', error)
    return NextResponse.json(
      { error: 'Failed to load activity feed' },
      { status: 500 }
    )
  }
}
