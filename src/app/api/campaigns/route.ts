import { NextRequest, NextResponse } from 'next/server'

const DB_URL = process.env.DB_SERVICE_URL || 'http://127.0.0.1:3005'

export async function GET() {
  if (process.env.DEMO_MODE === 'true') {
    const now = new Date()
    const campaigns = [
      { id: 'camp-1', name: 'Beauty Week', description: 'Weekly beauty deals campaign', status: 'active', budget: 1500, spent: 890, startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(), createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(), updatedAt: now.toISOString(), totalClicks: 957, totalConversions: 69, totalEarnings: 922.10, linkCount: 7, links: [{ clicks: 456, conversions: 34, earnings: 456.80 }, { clicks: 267, conversions: 19, earnings: 267.30 }, { clicks: 234, conversions: 16, earnings: 198.00 }], _count: { links: 7 } },
      { id: 'camp-2', name: 'Tech Deals', description: 'Electronics and gadgets promotions', status: 'active', budget: 2000, spent: 1200, startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate: null, createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(), updatedAt: now.toISOString(), totalClicks: 710, totalConversions: 52, totalEarnings: 685.70, linkCount: 4, links: [{ clicks: 389, conversions: 28, earnings: 398.40 }, { clicks: 198, conversions: 14, earnings: 178.20 }, { clicks: 123, conversions: 10, earnings: 109.10 }], _count: { links: 4 } },
      { id: 'camp-3', name: 'Summer Sports', description: 'Sports and fitness gear', status: 'paused', budget: 800, spent: 450, startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(), endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString(), createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(), updatedAt: new Date(now.getTime() - 5 * 86400000).toISOString(), totalClicks: 312, totalConversions: 22, totalEarnings: 312.00, linkCount: 2, links: [{ clicks: 312, conversions: 22, earnings: 312.00 }], _count: { links: 2 } },
    ]
    return NextResponse.json(campaigns)
  }
  try {
    const data = await fetch(`${DB_URL}/campaigns`).then(r => r.json())
    return NextResponse.json(data)
  } catch (error) {
    console.error('Campaigns GET error:', error)
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (process.env.DEMO_MODE === 'true') {
    const body = await request.json()
    const now = new Date()
    return NextResponse.json({
      id: `camp-demo-${Date.now()}`,
      name: body.name || 'New Campaign',
      description: body.description || '',
      status: body.status || 'active',
      budget: body.budget || 0,
      startDate: body.startDate ? new Date(body.startDate).toISOString() : null,
      endDate: body.endDate ? new Date(body.endDate).toISOString() : null,
      spent: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }, { status: 201 })
  }
  try {
    const body = await request.json()

    // Basic inline validation
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Validation failed', details: [{ message: 'name is required', path: ['name'] }] }, { status: 400 })
    }

    const campaign = await fetch(`${DB_URL}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Campaigns POST error:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
