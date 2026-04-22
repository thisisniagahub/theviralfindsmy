import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { createPayoutSchema } from '@/lib/validations'
import { dbFetch, isDemoMode } from '@/lib/db-safe'
import { z } from 'zod'

export async function GET() {
  if (isDemoMode()) {
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
    const data = await dbFetch('/payouts')

    return NextResponse.json(data)
  } catch (error) {
    console.error('Payouts error:', error)
    return NextResponse.json({ error: 'Failed to load payouts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = withRateLimit(request, RATE_LIMITS.mutation)
  if (rateLimited) return rateLimited

  let validated
  try {
    const body = await request.json()
    validated = createPayoutSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (isDemoMode()) {
    const now = new Date()
    return NextResponse.json({
      id: `pay-demo-${Date.now()}`,
      method: validated.method || 'bank_transfer',
      amount: validated.amount || 100,
      status: 'pending',
      bankName: validated.bankName || 'Maybank',
      accountNo: validated.accountNo || '****0000',
      accountName: validated.accountName || 'Demo User',
      note: validated.note || null,
      requestedAt: now.toISOString(),
      processedAt: null,
    }, { status: 201 })
  }
  try {
    const payout = await dbFetch('/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
    })

    return NextResponse.json(payout, { status: 201 })
  } catch (error) {
    console.error('Payouts POST error:', error)
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 })
  }
}
