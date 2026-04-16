import { NextRequest, NextResponse } from 'next/server'
import { executeMCPTool, openClawCompletion, extractMessageContent } from '@/lib/openclaw'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { requireAuth } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  // 1. Check auth
  const { auth, error } = await requireAuth()
  if (error) return error

  // 2. Check rate limit (10 req/min for AI)
  const rateLimited = await withRateLimit(request, RATE_LIMITS.ai)
  if (rateLimited) return rateLimited

  try {
    const body = await request.json()
    const { totalClicks = 0, totalEarnings = 0, conversionRate = 0, activeLinks = 0, topCategory = 'Electronics', source = 'auto' } = body || {}

    const metrics = { totalClicks, totalEarnings, conversionRate, activeLinks, topCategory }

    // Try OpenClaw gateway first
    if (source === 'openclaw' || source === 'auto') {
      try {
        const mcpResult = await executeMCPTool('ai_insights', { metrics })
        if (!mcpResult.result.isError) {
          const parsed = JSON.parse(mcpResult.result.content[0].text)
          return NextResponse.json({ success: true, ...parsed, source: mcpResult._source })
        }
      } catch {
        // Gateway MCP failed, fall through to completion fallback
      }
    }

    // Gateway completion fallback
    const completion = await openClawCompletion({
      messages: [
        { role: 'system', content: 'You are an expert affiliate marketing analyst for Shopee Malaysia. Generate 4 actionable insights and 3 recommendations. Reply ONLY with valid JSON: {"insights":[{"type":"opportunity"|"warning"|"success"|"tip","message":"...","impact":"high"|"medium"|"low"}],"recommendations":["...","...","..."]}. No other text.' },
        { role: 'user', content: `Analyze this Shopee affiliate data and provide insights:\n- Total Clicks: ${totalClicks}\n- Total Earnings: RM ${totalEarnings}\n- Conversion Rate: ${conversionRate}%\n- Active Links: ${activeLinks}\n- Top Category: ${topCategory}\n- Period: Last 30 days` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = extractMessageContent(completion)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [], recommendations: [] }

    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('AI insights error:', error)
    return NextResponse.json({ success: false, error: 'AI insights generation failed' }, { status: 500 })
  }
}
