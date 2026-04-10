import { NextRequest, NextResponse } from 'next/server'
import { executeMCPTool } from '@/lib/openclaw'

async function getSDK() {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  return ZAI.create()
}

export async function POST(request: NextRequest) {
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
        // Gateway failed, fall through to SDK
      }
    }

    // SDK fallback
    const zai = await getSDK()

    // Use web reader to extract content
    const webContent = await zai.functions.invoke('page_reader', { url })

    let analysis = ''
    const contentText = typeof webContent === 'string' ? webContent : JSON.stringify(webContent)
    const truncatedContent = contentText.substring(0, 3000)

    const extractPrompts: Record<string, string> = {
      summary: `Summarize this webpage content in 3-5 bullet points. Focus on key information.`,
      keywords: `Extract the most important keywords and topics from this content. Return as a comma-separated list.`,
      products: `Extract all product information mentioned: names, prices, features, ratings. Format as structured data.`,
      sentiment: `Analyze the sentiment of this content. Rate overall sentiment (positive/negative/neutral) with confidence score.`,
      affiliate: `Analyze this content for affiliate marketing potential. Identify: target audience, monetization opportunities, recommended platforms, and content strategy.`,
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a web content analyst. Provide clear, actionable analysis based on the content provided.' },
        { role: 'user', content: `URL: ${url}\nExtract type: ${extractType}\n\nContent:\n${truncatedContent}\n\n${extractPrompts[extractType] || extractPrompts['summary']}` },
      ],
      thinking: { type: 'disabled' },
    })

    analysis = completion.choices[0]?.message?.content || 'Analysis failed.'

    return NextResponse.json({
      success: true,
      url,
      extractType,
      analysis,
      contentLength: contentText.length,
      source: 'ai_web_reader',
    })
  } catch (error) {
    console.error('Web reader error:', error)
    return NextResponse.json({ success: false, error: 'Web content extraction failed' }, { status: 500 })
  }
}
