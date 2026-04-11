import { NextRequest, NextResponse } from 'next/server'
import { executeMCPTool } from '@/lib/openclaw'

async function getSDK() {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  return ZAI.create()
}

export async function POST(request: NextRequest) {
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
        // Gateway failed, fall through to SDK
      }
    }

    // SDK fallback
    const zai = await getSDK()

    const categoryQuery = category !== 'all' ? ` ${category}` : ''
    const searchResults = await zai.functions.invoke('web_search', {
      query: `Shopee Malaysia trending products${categoryQuery} best seller 2025`,
      num: 8,
    })

    const contextText = searchResults
      .map((r: { name?: string; snippet?: string }, i: number) => `${i + 1}. ${r.name}: ${r.snippet}`)
      .join('\n')

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a Shopee Malaysia trending products analyst. Generate a JSON array of trending products. Each product: {rank, name, category, price (number RM), salesVolume (number), trendScore (60-99), velocity (emoji + text like "🔥 Hot" or "🚀 Rising")}. Generate exactly 8 products. Reply ONLY with the JSON array, no other text.' },
        { role: 'user', content: `Find trending Shopee products in ${category !== 'all' ? category : 'all categories'} for ${region} region.\n\nWeb search results:\n${contextText}\n\nGenerate 8 trending products as JSON array.` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = completion.choices[0]?.message?.content || '[]'
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/)
    const products = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    return NextResponse.json({ success: true, products, category, region, total: products.length, source: 'ai_web_search' })
  } catch (error) {
    console.error('AI trending error:', error)
    return NextResponse.json({ success: false, error: 'Trending analysis failed' }, { status: 500 })
  }
}
