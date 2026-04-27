import { NextRequest, NextResponse } from 'next/server'
import { executeMCPTool } from '@/lib/openclaw'

async function getSDK() {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  return ZAI.create()
}

export async function POST(request: NextRequest) {
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
        // Gateway failed, fall through to SDK
      }
    }

    // SDK fallback
    const zai = await getSDK()

    const searchResults = await zai.functions.invoke('web_search', {
      query: `shopee ${seedKeyword} keyword SEO Malaysia trending search 2025`,
      num: 5,
    })

    const contextText = searchResults
      .map((r: { name?: string; snippet?: string }, i: number) => `${i + 1}. ${r.name}: ${r.snippet}`)
      .join('\n')

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a Shopee SEO expert. Generate keyword suggestions in JSON array format only. No explanations. Each keyword: {keyword, volume (number), competition ("low"|"medium"|"high"), relevance (number 1-100)}. Generate 10 keywords.' },
        { role: 'user', content: `Seed keyword: "${seedKeyword}"\n\nWeb search context:\n${contextText}\n\nGenerate 10 relevant Shopee SEO keywords as a JSON array.` },
      ],
      thinking: { type: 'disabled' },
    })

    const rawContent = completion.choices[0]?.message?.content || '[]'
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/)
    const keywords = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    return NextResponse.json({ success: true, keywords, seedKeyword, source: 'ai_web_search' })
  } catch (error) {
    console.error('AI keywords error:', error)
    return NextResponse.json({ success: false, error: 'Keyword research failed' }, { status: 500 })
  }
}
