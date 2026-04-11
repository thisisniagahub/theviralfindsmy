import { NextRequest, NextResponse } from 'next/server'

const DB_URL = process.env.DB_SERVICE_URL

export async function GET() {
  if (process.env.DEMO_MODE === 'true') {
    const now = new Date()
    const payouts = [
      { id: 'pay-1', method: 'bank_transfer', amount: 500.00, status: 'completed', bankName: 'Maybank', accountNo: '****4521', accountName: 'Ahmad Demo', note: null, requestedAt: new Date(now.getTime() - 15 * 86400000).toISOString(), processedAt: new Date(now.getTime() - 12 * 86400000).toISOString() },
      { id: 'pay-2', method: 'bank_transfer', amount: 350.00, status: 'processing', bankName: 'CIMB', accountNo: '****8832', accountName: 'Ahmad Demo', note: null, requestedAt: new Date(now.getTime() - 3 * 86400000).toISOString(), processedAt: null },
      { id: 'pay-3', method: 'e_wallet', amount: 200.00, status: 'pending', bankName: 'Touch\'n Go', accountNo: '****1234', accountName: 'Ahmad Demo', note: 'Monthly payout', requestedAt: new Date(now.getTime() - 1 * 86400000).toISOString(), processedAt: null },
    ]
    const monthlyEarnings = Array.from({ length: 12 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (11 - i))
      return { month: d.toLocaleString('default', { month: 'short', year: '2-digit' }), earnings: Math.floor(Math.random() * 800 + 200) }
    })
    return NextResponse.json({
      payouts,
      summary: {
        totalEarned: 3125.50,
        pendingAmount: 550.00,
        availableAmount: 1775.50,
        withdrawnAmount: 800.00,
      },
      monthlyEarnings,
    })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const data = await fetch(`${DB_URL}/payouts`).then(r => r.json())

    return NextResponse.json(data)
  } catch (error) {
    console.error('Payouts error:', error)
    return NextResponse.json({ error: 'Failed to load payouts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (process.env.DEMO_MODE === 'true') {
    const body = await request.json()
    const now = new Date()
    return NextResponse.json({
      id: `pay-demo-${Date.now()}`,
      method: body.method || 'bank_transfer',
      amount: body.amount || 100,
      status: 'pending',
      bankName: body.bankName || 'Maybank',
      accountNo: body.accountNo || '****0000',
      accountName: body.accountName || 'Demo User',
      note: body.note || null,
      requestedAt: now.toISOString(),
      processedAt: null,
    }, { status: 201 })
  }
  try {
    if (!DB_URL) {
      return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
    }
    const body = await request.json()

    // Basic inline validation
    if (!body.method || typeof body.method !== 'string') {
      return NextResponse.json({ error: 'Validation failed', details: [{ message: 'method is required', path: ['method'] }] }, { status: 400 })
    }
    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ error: 'Validation failed', details: [{ message: 'amount must be a positive number', path: ['amount'] }] }, { status: 400 })
    }

    const payout = await fetch(`${DB_URL}/payouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())

    return NextResponse.json(payout, { status: 201 })
  } catch (error) {
    console.error('Payouts POST error:', error)
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 })
  }
}
