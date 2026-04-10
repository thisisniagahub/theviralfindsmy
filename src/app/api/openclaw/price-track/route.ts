import { NextRequest, NextResponse } from 'next/server'
import { executeMCPTool } from '@/lib/openclaw'

async function getSDK() {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  return ZAI.create()
}

export async function POST(request: NextRequest) {
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
        // Gateway failed, fall through to SDK
      }
    }

    // SDK fallback
    const zai = await getSDK()

    const query = productNames.slice(0, 3).join(' OR ')
    const searchResults = await zai.functions.invoke('web_search', {
      query: `Shopee Malaysia ${query} price review rating 2025`,
      num: 8,
    })

    const contextText = searchResults
      .map((r: { name?: string; snippet?: string }, i: number) => `${i + 1}. ${r.name}: ${r.snippet}`)
      .join('\n')

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a Shopee price analyst. Analyze prices for the given products and return a JSON object: {products:[{name, currentPrice (number), lowestPrice (number), highestPrice (number), trend ("up"|"down"|"stable"), change (number %), recommendation ("Buy Now"|"Wait"|"Monitor")}], marketInsight (string)}. Reply ONLY with valid JSON.' },
        { role: 'user', content: `Track prices for these Shopee products: ${productNames.join(', ')}.\n\nWeb search results:\n${contextText}\n\nProvide price analysis as JSON.` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = completion.choices[0]?.message?.content || '{}'
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return NextResponse.json({ success: true, ...data, trackedCount: data.products?.length || 0, source: 'ai_web_search' })
  } catch (error) {
    console.error('Price track error:', error)
    return NextResponse.json({ success: false, error: 'Price tracking failed' }, { status: 500 })
  }
}
