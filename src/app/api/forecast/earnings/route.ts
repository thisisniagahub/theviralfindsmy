import { NextRequest, NextResponse } from 'next/server'
import { forecastEarnings, suggestCommissionRate } from '@/lib/forecast'

/**
 * Forecast Earnings API
 * GET /api/forecast/earnings?days=30&period=30d
 * Returns predictive earnings forecast based on historical data.
 */

export const dynamic = 'force-dynamic'

// Mock historical data (replace with real DB query)
function getMockHistoricalData(days: number) {
  const data = []
  const today = new Date()
  // Simulate growth trend with some variance
  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const base = 50 + (days - i) * 2 // Growth trend
    const variance = Math.random() * 30 - 15 // Random variance
    data.push({
      date: date.toISOString().split('T')[0],
      earnings: Math.max(0, base + variance),
      clicks: Math.floor(100 + (days - i) * 5 + Math.random() * 50),
    })
  }
  return data
}

export async function GET(request: NextRequest) {
  const days = parseInt(request.nextUrl.searchParams.get('days') || '30')
  const period = parseInt(request.nextUrl.searchParams.get('period') || '30')

  // Get historical data (mock for now, replace with DB query)
  const historicalData = getMockHistoricalData(period)

  // Generate forecast
  const forecast = forecastEarnings(historicalData, days)

  // Get commission rate suggestion
  const rateSuggestion = suggestCommissionRate(historicalData)

  return NextResponse.json({
    success: true,
    forecast,
    rateSuggestion,
    historicalData: historicalData.slice(-30), // Last 30 days
  })
}
