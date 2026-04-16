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
    const { url = '', extractType = 'summary', source = 'auto' } = body

    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    // Try OpenClaw gateway first
    if (source === 'openclaw' || source === 'auto') {
      try {
        const mcpResult = await executeMCPTool('web_reader', { url, extractType })
        if (!mcpResult.result.isError) {
          const parsed = JSON.parse(mcpResult.result.content[0].text)
          return NextResponse.json({ success: true, url, extractType, ...parsed, source: mcpResult._source })
        }
      } catch {
        // Gateway MCP failed, fall through to completion fallback
      }
    }

    // Gateway completion fallback
    const extractPrompts: Record<string, string> = {
      summary: `Summarize the webpage at ${url} in 3-5 bullet points. Focus on key information.`,
      keywords: `Extract the most important keywords and topics from ${url}. Return as a comma-separated list.`,
      products: `Extract all product information from ${url}: names, prices, features, ratings. Format as structured data.`,
      sentiment: `Analyze the sentiment of content at ${url}. Rate overall sentiment (positive/negative/neutral) with confidence score.`,
      affiliate: `Analyze ${url} for affiliate marketing potential. Identify: target audience, monetization opportunities, recommended platforms, and content strategy.`,
    }

    const completion = await openClawCompletion({
      messages: [
        { role: 'system', content: 'You are a web content analyst. Provide clear, actionable analysis based on the URL provided.' },
        { role: 'user', content: extractPrompts[extractType] || extractPrompts['summary'] },
      ],
      thinking: { type: 'disabled' },
    })

    const analysis = extractMessageContent(completion)

    return NextResponse.json({
      success: true,
      url,
      extractType,
      analysis,
      source: 'gateway',
    })
  } catch (error) {
    console.error('Web reader error:', error)
    return NextResponse.json({ success: false, error: 'Web content extraction failed' }, { status: 500 })
  }
}
