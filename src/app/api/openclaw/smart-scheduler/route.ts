import { NextRequest, NextResponse } from 'next/server'
import { executeMCPTool } from '@/lib/openclaw'

async function getSDK() {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  return ZAI.create()
}

export async function POST(request: NextRequest) {
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
        // Gateway failed, fall through to SDK
      }
    }

    // SDK fallback
    const zai = await getSDK()

    const searchResults = await zai.functions.invoke('web_search', {
      query: `best time to post social media Malaysia ${platform} engagement rate 2025`,
      num: 5,
    })

    const contextText = searchResults
      .map((r: { name?: string; snippet?: string }, i: number) => `${i + 1}. ${r.name}: ${r.snippet}`)
      .join('\n')

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a social media scheduling expert for Malaysian Shopee affiliates. Return JSON: {bestTimes:[{day,hour,platform,score (1-100)}], worstTimes:[{day,hour,platform}], tips:[string], weeklyCalendar:{Mon:[],Tue:[],...}}. Generate 7 best times and 3 worst times. Reply ONLY with valid JSON.' },
        { role: 'user', content: `Suggest optimal posting schedule for ${platform} platform, ${contentType} content type, in ${niche} niche targeting Malaysian audience.\n\nResearch context:\n${contextText}\n\nProvide scheduling recommendations as JSON.` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = completion.choices[0]?.message?.content || '{}'
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    const schedule = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return NextResponse.json({ success: true, ...schedule, platform, contentType, source: 'ai_web_search' })
  } catch (error) {
    console.error('Smart scheduler error:', error)
    return NextResponse.json({ success: false, error: 'Schedule optimization failed' }, { status: 500 })
  }
}
