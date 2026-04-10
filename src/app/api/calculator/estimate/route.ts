import { NextRequest, NextResponse } from 'next/server'
import { calculatorEstimateSchema } from '@/lib/validations'
import { ZodError } from 'zod'

const TIER_CLICKS = [500, 1000, 2500, 5000, 10000]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = calculatorEstimateSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      )
    }
    const { price, commissionRate, clicks, conversionRate } = validated.data

    const commissionPerSale = (price * commissionRate) / 100
    const monthlySales = Math.floor((clicks * conversionRate) / 100)
    const monthlyEarnings = commissionPerSale * monthlySales
    const annualEarnings = monthlyEarnings * 12
    const dailyEarnings = monthlyEarnings / 30

    const tiers = TIER_CLICKS.map((tierClicks) => {
      const tierMonthlySales = Math.floor((tierClicks * conversionRate) / 100)
      const tierMonthlyEarnings = commissionPerSale * tierMonthlySales
      const tierAnnualEarnings = tierMonthlyEarnings * 12
      const tierDailyEarnings = tierMonthlyEarnings / 30
      return {
        clicks: tierClicks,
        monthlySales: tierMonthlySales,
        monthlyEarnings: parseFloat(tierMonthlyEarnings.toFixed(2)),
        annualEarnings: parseFloat(tierAnnualEarnings.toFixed(2)),
        dailyEarnings: parseFloat(tierDailyEarnings.toFixed(2)),
      }
    })

    return NextResponse.json({
      commissionPerSale: parseFloat(commissionPerSale.toFixed(2)),
      monthlySales,
      monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
      annualEarnings: parseFloat(annualEarnings.toFixed(2)),
      dailyEarnings: parseFloat(dailyEarnings.toFixed(2)),
      tiers,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
