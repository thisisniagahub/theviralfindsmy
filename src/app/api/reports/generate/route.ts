import { NextRequest, NextResponse } from 'next/server'

/**
 * Scheduled Reports API
 * POST /api/reports/generate — Generate PDF/CSV report
 * GET /api/reports/generate — List available reports
 */

export const dynamic = 'force-dynamic'

// In-memory store for scheduled reports
const scheduledReports = new Map<string, unknown>()

// Mock dashboard data (replace with real DB query)
function getReportData(period: string) {
  return {
    period,
    generatedAt: new Date().toISOString(),
    summary: {
      totalLinks: 42,
      totalClicks: 12500,
      totalConversions: 380,
      totalEarnings: 3250.50,
      avgConversionRate: 3.04,
    },
    topLinks: [
      { name: 'TWS Earbuds Pro', clicks: 2340, earnings: 580.00, conversions: 85 },
      { name: 'Phone Case Slim', clicks: 1890, earnings: 420.00, conversions: 62 },
      { name: 'LED Ring Light', clicks: 1560, earnings: 350.00, conversions: 48 },
    ],
    earningsByCategory: {
      'Electronics': 1250.00,
      'Fashion': 850.00,
      'Home & Living': 650.50,
      'Beauty': 500.00,
    },
    forecast: {
      nextMonth: 3680.00,
      trend: 'up',
      growthRate: 8.2,
    },
  }
}

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get('period') || '30d'
  const format = request.nextUrl.searchParams.get('format') || 'json'

  const data = getReportData(period)

  if (format === 'csv') {
    const rows = [
      ['Metric', 'Value'],
      ['Total Links', data.summary.totalLinks],
      ['Total Clicks', data.summary.totalClicks],
      ['Total Conversions', data.summary.totalConversions],
      ['Total Earnings (RM)', data.summary.totalEarnings],
      ['Avg Conversion Rate (%)', data.summary.avgConversionRate],
      [],
      ['Top Links', 'Clicks', 'Earnings', 'Conversions'],
      ...data.topLinks.map(l => [l.name, l.clicks, l.earnings, l.conversions]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="report-${period}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  return NextResponse.json({
    success: true,
    report: data,
    format,
    generatedAt: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { period = '30d', format = 'json', schedule } = body

    const data = getReportData(period)
    const reportId = `report-${Date.now()}`

    // If schedule requested, store it
    if (schedule) {
      scheduledReports.set(reportId, {
        id: reportId,
        period,
        format,
        schedule, // 'weekly' | 'monthly'
        createdAt: new Date().toISOString(),
        nextRun: new Date(Date.now() + (schedule === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)).toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      reportId,
      data,
      scheduled: !!schedule,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
