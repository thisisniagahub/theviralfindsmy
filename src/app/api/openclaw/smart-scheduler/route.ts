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
    const { platform = 'all', contentType = 'all', niche = 'affiliate marketing', source = 'auto' } = body

    // Try OpenClaw gateway first
    if (source === 'openclaw' || source === 'auto') {
      try {
        const mcpResult = await executeMCPTool('smart_scheduler', { platform, contentType, niche })
        if (!mcpResult.result.isError) {
          const parsed = JSON.parse(mcpResult.result.content[0].text)
          return NextResponse.json({ success: true, ...parsed, platform, contentType, source: mcpResult._source })
        }
      } catch {
        // Gateway MCP failed, fall through to completion fallback
      }
    }

    // Gateway completion fallback
    const completion = await openClawCompletion({
      messages: [
        { role: 'system', content: 'You are a social media scheduling expert for Malaysian Shopee affiliates. Return JSON: {bestTimes:[{day,hour,platform,score (1-100)}], worstTimes:[{day,hour,platform}], tips:[string], weeklyCalendar:{Mon:[],Tue:[],...}}. Generate 7 best times and 3 worst times. Reply ONLY with valid JSON.' },
        { role: 'user', content: `Suggest optimal posting schedule for ${platform} platform, ${contentType} content type, in ${niche} niche targeting Malaysian audience. Provide scheduling recommendations as JSON.` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = extractMessageContent(completion)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    const schedule = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return NextResponse.json({ success: true, ...schedule, platform, contentType, source: 'gateway' })
  } catch (error) {
    console.error('Smart scheduler error:', error)
    return NextResponse.json({ success: false, error: 'Schedule optimization failed' }, { status: 500 })
  }
}
