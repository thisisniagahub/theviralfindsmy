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
    const { competitorShop = '', metrics = 'all', source = 'auto' } = body

    if (!competitorShop) return NextResponse.json({ error: 'Competitor shop name required' }, { status: 400 })

    // Try OpenClaw gateway first
    if (source === 'openclaw' || source === 'auto') {
      try {
        const mcpResult = await executeMCPTool('competitor_analysis', { competitorShop, metrics })
        if (!mcpResult.result.isError) {
          const parsed = JSON.parse(mcpResult.result.content[0].text)
          return NextResponse.json({ success: true, ...parsed, competitor: competitorShop, source: mcpResult._source })
        }
      } catch {
        // Gateway MCP failed, fall through to completion fallback
      }
    }

    // Gateway completion fallback
    const completion = await openClawCompletion({
      messages: [
        { role: 'system', content: 'You are a Shopee competitor analysis expert. Analyze the competitor and return a JSON object: {competitor, analysis:{totalProducts, avgRating, avgPrice, estimatedSales, strengths:[], weaknesses:[], strategies:[], threatLevel:"Low"|"Medium"|"High"}}. Reply ONLY with valid JSON.' },
        { role: 'user', content: `Analyze Shopee competitor shop "${competitorShop}". Focus on ${metrics} metrics. Provide detailed competitor analysis as JSON.` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = extractMessageContent(completion)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return NextResponse.json({ success: true, ...analysis, competitor: competitorShop, source: 'gateway' })
  } catch (error) {
    console.error('AI competitor error:', error)
    return NextResponse.json({ success: false, error: 'Competitor analysis failed' }, { status: 500 })
  }
}
