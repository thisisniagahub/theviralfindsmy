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
    const { contentType = 'social-post', productName = '', tone = 'casual', platform = 'shopee', source = 'auto' } = body

    if (!productName) return NextResponse.json({ error: 'Product name required' }, { status: 400 })

    // Try OpenClaw gateway first
    if (source === 'openclaw' || source === 'auto') {
      try {
        const mcpResult = await executeMCPTool('ai_content', { contentType, productName, tone, platform })
        if (!mcpResult.result.isError) {
          const parsed = JSON.parse(mcpResult.result.content[0].text)
          return NextResponse.json({ success: true, ...parsed, source: mcpResult._source })
        }
      } catch {
        // Gateway MCP failed, fall through to completion fallback
      }
    }

    // Gateway completion fallback
    const systemPrompt = `You are an expert Shopee Malaysia affiliate marketer. Write in ${tone} tone for ${platform}. Reply with the generated content only, no explanations. Include relevant hashtags.`

    const contentPrompts: Record<string, string> = {
      'product-description': `Write a compelling Shopee product description for "${productName}". Include features, benefits, and call-to-action. Keep under 200 words.`,
      'social-post': `Write a viral social media post promoting "${productName}" on ${platform}. Make it engaging with emojis. Include call-to-action and hashtags. Keep under 150 words.`,
      'blog-article': `Write a short blog article (300 words) reviewing "${productName}" for affiliate marketing. Include pros, cons, and affiliate CTA.`,
      'email-subject': `Write 5 attention-grabbing email subject lines promoting "${productName}". Make them urgent and curiosity-driven.`,
      'ad-copy': `Write 3 variations of ad copy for "${productName}" targeting Malaysian shoppers. Include headline, description, and CTA for each.`,
    }

    const completion = await openClawCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentPrompts[contentType] || contentPrompts['social-post'] },
      ],
      thinking: { type: 'disabled' },
    })

    const content = extractMessageContent(completion)
    const wordCount = content.split(/\s+/).length
    const hashtags = content.match(/#\w+/g) || []

    return NextResponse.json({ success: true, content, wordCount, hashtags, contentType, productName, tone, platform })
  } catch (error) {
    console.error('AI content error:', error)
    return NextResponse.json({ success: false, error: 'Content generation failed. Please try again.' }, { status: 500 })
  }
}
