import { NextRequest, NextResponse } from 'next/server'

const DB_URL = process.env.DB_SERVICE_URL

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.DEMO_MODE === 'true') {
    const { id } = await params
    const chartDays = 30
    const chartData = Array.from({ length: chartDays }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (chartDays - 1 - i))
      return {
        date: d.toISOString().split('T')[0],
        clicks: Math.floor(Math.random() * 25 + 5),
        conversions: Math.floor(Math.random() * 3),
      }
    })
    return NextResponse.json({
      link: {
        id,
        name: 'Laneige Water Mask',
        productName: 'Laneige Water Sleeping Mask',
        shortCode: 'lnMask',
        clicks: 456,
        conversions: 34,
        earnings: 456.80,
        status: 'active',
        category: 'Beauty',
      },
      chartData,
      deviceBreakdown: [
        { name: 'Mobile', value: 312 },
        { name: 'Desktop', value: 120 },
        { name: 'Tablet', value: 24 },
      ],
      conversionRate: 7.5,
      totalEarnings: 456.80,
    })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const { id } = await params
    const data = await fetch(`${DB_URL}/links/${encodeURIComponent(id)}/stats`).then(r => {
      if (!r.ok) throw new Error(`${r.status}`)
      return r.json()
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Link stats error:', error)
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to load link stats' }, { status: 500 })
  }
}
