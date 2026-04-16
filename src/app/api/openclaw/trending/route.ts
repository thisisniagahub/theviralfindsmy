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
    const { category = 'all', region = 'MY', limit: _limit = 10, source = 'auto' } = body

    // If source is 'openclaw' or 'auto', try OpenClaw gateway first
    if (source === 'openclaw' || source === 'auto') {
      try {
        const mcpResult = await executeMCPTool('trending_scanner', { category, region })
        if (!mcpResult.result.isError) {
          const parsed = JSON.parse(mcpResult.result.content[0].text)
          return NextResponse.json({ success: true, ...parsed, source: mcpResult._source })
        }
      } catch {
        // Gateway MCP failed, fall through to completion fallback
      }
    }

    // Gateway completion fallback
    const categoryQuery = category !== 'all' ? ` in ${category} category` : ''
    const completion = await openClawCompletion({
      messages: [
        { role: 'system', content: 'You are a Shopee Malaysia trending products analyst. Generate a JSON array of trending products. Each product: {rank, name, category, price (number RM), salesVolume (number), trendScore (60-99), velocity (emoji + text like "🔥 Hot" or "🚀 Rising")}. Generate exactly 8 products. Reply ONLY with the JSON array, no other text.' },
        { role: 'user', content: `Find trending Shopee products${categoryQuery} for ${region} region. Generate 8 trending products as JSON array.` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = extractMessageContent(completion)
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/)
    const products = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    return NextResponse.json({ success: true, products, category, region, total: products.length, source: 'gateway' })
  } catch (error) {
    console.error('AI trending error:', error)
    return NextResponse.json({ success: false, error: 'Trending analysis failed' }, { status: 500 })
  }
}
