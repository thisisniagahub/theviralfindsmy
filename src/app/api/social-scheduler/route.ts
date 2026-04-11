import { NextRequest, NextResponse } from 'next/server'

/**
 * Social Media Auto-Scheduling API
 * POST /api/social-scheduler/schedule — Create scheduled post
 * GET /api/social-scheduler — List scheduled posts
 * POST /api/social-scheduler/publish — Publish now
 */

export const dynamic = 'force-dynamic'

// In-memory store
const scheduledPosts = new Map<string, any>()

const PLATFORM_CONFIG = {
  tiktok: { maxChars: 2200, hashtags: true, images: true, video: true },
  instagram: { maxChars: 2200, hashtags: true, images: true, video: true, stories: true },
  facebook: { maxChars: 63206, hashtags: true, images: true, video: true, links: true },
}

// AI-generated content templates
const CONTENT_TEMPLATES = {
  product: (product: string, price: number, commission: number) => [
    `🔥 HOT DEAL: ${product} cuma RM${price.toFixed(2)}! Commission rate ${commission}%. Klik link di bio! #ShopeeMY #AffiliateMY`,
    `💰 BEST BUY! ${product} on sale now! Only RM${price.toFixed(2)}. Limited stock — grab yours! 🛍️ #ShopeeFinds`,
    `⭐ TOP PICK: ${product} — RM${price.toFixed(2)} je! High quality, low price. Link in bio 👆 #DealsMY #Shopee`,
  ],
  trending: (category: string, count: number) => [
    `📊 Trending in ${category}: ${count} products under RM50! Check out our curated list 👉 #TrendingMY`,
    `🔥 ${count} trending ${category} products you NEED to see! All under RM100 🤑 #MustHave #ShopeeMY`,
  ],
  flash: (product: string, discount: number) => [
    `⚡ FLASH SALE! ${product} — ${discount}% OFF for 24 hours ONLY! Don't miss out! 🏃‍♂️💨 #FlashSale`,
  ],
}

function generateContent(type: string, params: Record<string, any>): string[] {
  switch (type) {
    case 'product':
      return CONTENT_TEMPLATES.product(params.product || 'Product', params.price || 0, params.commission || 5)
    case 'trending':
      return CONTENT_TEMPLATES.trending(params.category || 'all', params.count || 10)
    case 'flash':
      return CONTENT_TEMPLATES.flash(params.product || 'Product', params.discount || 20)
    default:
      return ['Check out our latest Shopee affiliate picks! 🔗 Link in bio #ShopeeMY']
  }
}

export async function GET(request: NextRequest) {
  const posts = Array.from(scheduledPosts.values())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  return NextResponse.json({
    success: true,
    posts,
    total: posts.length,
    published: posts.filter((p: any) => p.status === 'published').length,
    pending: posts.filter((p: any) => p.status === 'pending').length,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, platform, type, params, scheduledAt, content } = body

    // Generate content if not provided
    const generatedContent = content || generateContent(type || 'product', params || {})

    if (action === 'schedule') {
      const postId = `post-${Date.now()}`
      const post = {
        id: postId,
        platform: platform || 'all',
        content: generatedContent,
        scheduledAt: scheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        type: type || 'product',
        params: params || {},
      }
      scheduledPosts.set(postId, post)

      return NextResponse.json({
        success: true,
        postId,
        post,
        message: `Post scheduled for ${post.scheduledAt}`,
      })
    }

    if (action === 'publish') {
      // Simulate publishing to platforms
      const results: Record<string, any> = {}
      const platforms = platform === 'all' ? Object.keys(PLATFORM_CONFIG) : [platform]

      for (const p of platforms) {
        results[p] = {
          status: 'published',
          url: `https://${p}.com/p/${Date.now()}`,
          publishedAt: new Date().toISOString(),
        }
      }

      return NextResponse.json({
        success: true,
        results,
        message: `Published to ${platforms.join(', ')}`,
      })
    }

    if (action === 'generate') {
      return NextResponse.json({
        success: true,
        content: generatedContent,
        platforms: PLATFORM_CONFIG,
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use: schedule, publish, or generate' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
