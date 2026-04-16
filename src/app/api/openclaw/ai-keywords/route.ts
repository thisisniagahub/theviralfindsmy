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
    const { seedKeyword = '', source = 'auto' } = body

    if (!seedKeyword) return NextResponse.json({ error: 'Keyword required' }, { status: 400 })

    // Try OpenClaw gateway first
    if (source === 'openclaw' || source === 'auto') {
      try {
        const mcpResult = await executeMCPTool('keyword_research', { seedKeyword })
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
        { role: 'system', content: 'You are a Shopee SEO expert. Generate keyword suggestions in JSON array format only. No explanations. Each keyword: {keyword, volume (number), competition ("low"|"medium"|"high"), relevance (number 1-100)}. Generate 10 keywords.' },
        { role: 'user', content: `Seed keyword: "${seedKeyword}"\n\nGenerate 10 relevant Shopee SEO keywords as a JSON array. Consider Malaysian market trends and Shopee search patterns.` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = extractMessageContent(completion)
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/)
    const keywords = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    return NextResponse.json({ success: true, keywords, seedKeyword, source: 'gateway' })
  } catch (error) {
    console.error('AI keywords error:', error)
    return NextResponse.json({ success: false, error: 'Keyword research failed' }, { status: 500 })
  }
}
