import { NextRequest, NextResponse } from 'next/server'

const DB_URL = process.env.DB_SERVICE_URL || 'http://127.0.0.1:3005'

export async function GET(request: NextRequest) {
  if (process.env.DEMO_MODE === 'true') {
    const days = 30
    const performanceData = Array.from({ length: days }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      return {
        date: d.toISOString().split('T')[0],
        clicks: Math.floor(Math.random() * 80 + 20),
        conversions: Math.floor(Math.random() * 8 + 1),
        earnings: Math.round((Math.random() * 150 + 10) * 100) / 100,
      }
    })
    const topProducts = [
      { id: 'link-1', name: 'Laneige Water Mask', productName: 'Laneige Water Sleeping Mask', category: 'Beauty', clicks: 456, conversions: 34, earnings: 456.80 },
      { id: 'link-2', name: 'TWS Earbuds Pro', productName: 'TWS Earbuds Pro Max', category: 'Electronics', clicks: 389, conversions: 28, earnings: 398.40 },
      { id: 'link-3', name: 'Running Shoes', productName: 'Ultra Running Shoes V2', category: 'Sports', clicks: 312, conversions: 22, earnings: 312.00 },
      { id: 'link-4', name: 'Vitamin C Serum', productName: 'Vitamin C Brightening Serum', category: 'Beauty', clicks: 267, conversions: 19, earnings: 267.30 },
      { id: 'link-5', name: 'Cetaphil Cleanser', productName: 'Cetaphil Gentle Skin Cleanser', category: 'Beauty', clicks: 234, conversions: 16, earnings: 198.00 },
    ]
    const sourceData = [
      { name: 'Direct', value: 2340 },
      { name: 'Facebook', value: 1560 },
      { name: 'Instagram', value: 890 },
      { name: 'WhatsApp', value: 670 },
      { name: 'TikTok', value: 520 },
    ]
    const deviceData = [
      { name: 'Mobile', value: 4200 },
      { name: 'Desktop', value: 1500 },
      { name: 'Tablet', value: 412 },
    ]
    const categoryData = [
      { name: 'Beauty', clicks: 1200, conversions: 89, earnings: 1340.10 },
      { name: 'Electronics', clicks: 890, conversions: 56, earnings: 986.30 },
      { name: 'Sports', clicks: 456, conversions: 32, earnings: 451.00 },
      { name: 'Health', clicks: 234, conversions: 18, earnings: 218.80 },
      { name: 'Fashion', clicks: 178, conversions: 12, earnings: 129.30 },
    ]
    const totalClicks = 6112
    const totalConversions = 284
    const funnelData = [
      { stage: 'Page Views', count: totalClicks, color: '#EE4D2D' },
      { stage: 'Add to Cart', count: Math.floor(totalClicks * 0.35), color: '#FF6742' },
      { stage: 'Purchase', count: Math.floor(totalClicks * 0.12), color: '#FFB347' },
      { stage: 'Completed', count: totalConversions, color: '#22C55E' },
    ]
    const baseClicks = Math.floor(totalClicks / (7 * 24))
    const heatmap: { day: number; hour: number; clicks: number }[] = []
    for (let day = 0; day < 7; day++) {
      const isWeekend = day >= 5
      for (let hour = 0; hour < 24; hour++) {
        let multiplier = 0.1 + Math.random() * 0.1
        if (hour >= 8 && hour <= 10) multiplier = isWeekend ? 1.2 : 2.0
        else if (hour >= 12 && hour <= 14) multiplier = isWeekend ? 1.0 : 1.4
        else if (hour >= 18 && hour <= 20) multiplier = isWeekend ? 1.3 : 1.6
        else if (hour >= 20 && hour <= 23) multiplier = isWeekend ? 1.8 : 2.2
        else if (hour >= 7 && hour <= 7) multiplier = isWeekend ? 0.6 : 0.9
        else if (hour >= 1 && hour <= 6) multiplier = 0.05 + Math.random() * 0.05
        heatmap.push({ day, hour, clicks: Math.max(0, Math.round(baseClicks * multiplier * (0.85 + Math.random() * 0.3))) })
      }
    }
    return NextResponse.json({ performanceData, topProducts, sourceData, deviceData, categoryData, funnelData, heatmap })
  }
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const data = await fetch(`${DB_URL}/analytics?period=${encodeURIComponent(period)}`).then(r => r.json())
    return NextResponse.json(data)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
