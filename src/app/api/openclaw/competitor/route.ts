import { NextRequest, NextResponse } from 'next/server'
import { executeMCPTool } from '@/lib/openclaw'

async function getSDK() {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  return ZAI.create()
}

export async function POST(request: NextRequest) {
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
        // Gateway failed, fall through to SDK
      }
    }

    // SDK fallback
    const zai = await getSDK()

    const searchResults = await zai.functions.invoke('web_search', {
      query: `Shopee Malaysia ${competitorShop} shop seller review ratings products`,
      num: 5,
    })

    const contextText = searchResults
      .map((r: { name?: string; snippet?: string }, i: number) => `${i + 1}. ${r.name}: ${r.snippet}`)
      .join('\n')

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a Shopee competitor analysis expert. Analyze the competitor and return a JSON object: {competitor, analysis:{totalProducts, avgRating, avgPrice, estimatedSales, strengths:[], weaknesses:[], strategies:[], threatLevel:"Low"|"Medium"|"High"}}. Reply ONLY with valid JSON.' },
        { role: 'user', content: `Analyze Shopee competitor shop "${competitorShop}". Focus on ${metrics} metrics.\n\nWeb search context:\n${contextText}\n\nProvide detailed competitor analysis as JSON.` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = completion.choices[0]?.message?.content || '{}'
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return NextResponse.json({ success: true, ...analysis, competitor: competitorShop, source: 'ai_web_search' })
  } catch (error) {
    console.error('AI competitor error:', error)
    return NextResponse.json({ success: false, error: 'Competitor analysis failed' }, { status: 500 })
  }
}
