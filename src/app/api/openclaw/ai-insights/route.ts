import { NextRequest, NextResponse } from 'next/server'
import { executeMCPTool } from '@/lib/openclaw'

async function getSDK() {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  return ZAI.create()
}

export async function POST(request: NextRequest) {
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
        // Gateway failed, fall through to SDK
      }
    }

    // SDK fallback
    const zai = await getSDK()

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are an expert affiliate marketing analyst for Shopee Malaysia. Generate 4 actionable insights and 3 recommendations. Reply ONLY with valid JSON: {"insights":[{"type":"opportunity"|"warning"|"success"|"tip","message":"...","impact":"high"|"medium"|"low"}],"recommendations":["...","...","..."]}. No other text.' },
        { role: 'user', content: `Analyze this Shopee affiliate data and provide insights:\n- Total Clicks: ${totalClicks}\n- Total Earnings: RM ${totalEarnings}\n- Conversion Rate: ${conversionRate}%\n- Active Links: ${activeLinks}\n- Top Category: ${topCategory}\n- Period: Last 30 days` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = completion.choices[0]?.message?.content || '{}'
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [], recommendations: [] }

    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('AI insights error:', error)
    return NextResponse.json({ success: false, error: 'AI insights generation failed' }, { status: 500 })
  }
}
