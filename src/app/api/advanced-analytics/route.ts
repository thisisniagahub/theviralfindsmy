import { NextRequest, NextResponse } from 'next/server'

/**
 * Advanced Analytics API
 * GET /api/advanced-analytics?type=cohort|attribution|abtest
 * Provides cohort analysis, attribution modeling, and A/B test results.
 */

export const dynamic = 'force-dynamic'

// Mock data generators
function generateCohortData() {
  const cohorts = []
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

  for (let i = 0; i < months.length; i++) {
    const retentionRates: number[] = []
    for (let j = 0; j <= i && j < 6; j++) {
      retentionRates.push(Math.round((100 - j * 15 - Math.random() * 10) * 10) / 10)
    }
    cohorts.push({
      cohort: `${months[i]} 2026`,
      users: Math.floor(100 + i * 50 + Math.random() * 30),
      retentionRates,
    })
  }

  return {
    cohorts,
    summary: {
      avgMonth1Retention: 78.5,
      avgMonth3Retention: 52.3,
      avgMonth6Retention: 35.1,
      trend: 'improving',
    },
  }
}

function generateAttributionData() {
  return {
    models: {
      'First-Touch': {
        channels: [
          { name: 'Social Media', value: 35, revenue: 1250.00 },
          { name: 'Direct', value: 25, revenue: 890.00 },
          { name: 'Search', value: 20, revenue: 710.00 },
          { name: 'Email', value: 12, revenue: 425.00 },
          { name: 'Referral', value: 8, revenue: 280.00 },
        ],
      },
      'Last-Touch': {
        channels: [
          { name: 'Direct', value: 30, revenue: 1070.00 },
          { name: 'Social Media', value: 28, revenue: 1000.00 },
          { name: 'Email', value: 22, revenue: 785.00 },
          { name: 'Search', value: 12, revenue: 425.00 },
          { name: 'Referral', value: 8, revenue: 280.00 },
        ],
      },
      'Multi-Touch': {
        channels: [
          { name: 'Social Media', value: 32, revenue: 1140.00 },
          { name: 'Direct', value: 27, revenue: 965.00 },
          { name: 'Email', value: 18, revenue: 640.00 },
          { name: 'Search', value: 15, revenue: 535.00 },
          { name: 'Referral', value: 8, revenue: 280.00 },
        ],
      },
    },
    topPath: 'Social → Email → Direct → Purchase',
    avgTouchpoints: 3.2,
  }
}

function generateABTestData() {
  return {
    tests: [
      {
        id: 'test-001',
        name: 'Link Button Color: Orange vs Green',
        status: 'completed',
        variantA: { name: 'Orange (#EE4D2D)', conversions: 142, rate: 4.8 },
        variantB: { name: 'Green (#22c55e)', conversions: 128, rate: 4.3 },
        winner: 'A',
        confidence: 94.2,
        duration: '14 days',
      },
      {
        id: 'test-002',
        name: 'Headline: "Best Deals" vs "Top Picks"',
        status: 'running',
        variantA: { name: '"Best Deals"', conversions: 89, rate: 5.1 },
        variantB: { name: '"Top Picks"', conversions: 95, rate: 5.4 },
        winner: null,
        confidence: 67.8,
        duration: '7 days',
      },
    ],
    totalTests: 12,
    completedTests: 9,
    winRate: 66.7,
  }
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') || 'cohort'

  switch (type) {
    case 'cohort':
      return NextResponse.json({ success: true, type: 'cohort', data: generateCohortData() })
    case 'attribution':
      return NextResponse.json({ success: true, type: 'attribution', data: generateAttributionData() })
    case 'abtest':
      return NextResponse.json({ success: true, type: 'abtest', data: generateABTestData() })
    default:
      return NextResponse.json(
        { error: 'Invalid type. Use: cohort, attribution, or abtest' },
        { status: 400 }
      )
  }
}
