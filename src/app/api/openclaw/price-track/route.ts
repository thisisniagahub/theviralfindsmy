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
    const { productNames = [], source = 'auto' } = body

    if (!productNames.length) return NextResponse.json({ error: 'Product names required' }, { status: 400 })

    // Try OpenClaw gateway first
    if (source === 'openclaw' || source === 'auto') {
      try {
        const mcpResult = await executeMCPTool('price_tracker', { productNames })
        if (!mcpResult.result.isError) {
          const parsed = JSON.parse(mcpResult.result.content[0].text)
          return NextResponse.json({ success: true, ...parsed, trackedCount: parsed.products?.length || 0, source: mcpResult._source })
        }
      } catch {
        // Gateway MCP failed, fall through to completion fallback
      }
    }

    // Gateway completion fallback
    const completion = await openClawCompletion({
      messages: [
        { role: 'system', content: 'You are a Shopee price analyst. Analyze prices for the given products and return a JSON object: {products:[{name, currentPrice (number), lowestPrice (number), highestPrice (number), trend ("up"|"down"|"stable"), change (number %), recommendation ("Buy Now"|"Wait"|"Monitor")}], marketInsight (string)}. Reply ONLY with valid JSON.' },
        { role: 'user', content: `Track prices for these Shopee products: ${productNames.join(', ')}. Provide price analysis as JSON.` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = extractMessageContent(completion)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return NextResponse.json({ success: true, ...data, trackedCount: data.products?.length || 0, source: 'gateway' })
  } catch (error) {
    console.error('Price track error:', error)
    return NextResponse.json({ success: false, error: 'Price tracking failed' }, { status: 500 })
  }
}
