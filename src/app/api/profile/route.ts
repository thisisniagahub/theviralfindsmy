import { NextRequest, NextResponse } from 'next/server'

/**
 * Affiliate Profile API
 * GET: Get current user's profile
 * POST: Create/update profile
 */

export const dynamic = 'force-dynamic'

// In-memory store (replace with Prisma when DB migration done)
const profiles = new Map<string, unknown>()

export async function GET(request: NextRequest) {
  // Check for public slug lookup
  const slug = request.nextUrl.searchParams.get('slug')
  if (slug) {
    const profile = profiles.get(slug)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    return NextResponse.json(profile)
  }

  // Return mock profile for demo
  return NextResponse.json({
    id: '1',
    displayName: 'Ahmad Ali',
    bio: 'Shopee affiliate marketer specializing in tech gadgets and lifestyle products. Helping Malaysians find the best deals since 2023.',
    avatar: null,
    socialLinks: {
      twitter: '@ahmadaffiliate',
      instagram: '@ahmad.deals',
      youtube: 'AhmadAffiliateMY',
      website: 'https://ahmadaffiliate.my',
    },
    publicSlug: 'ahmad-ali',
    isPublic: true,
    stats: {
      totalLinks: 42,
      totalClicks: 12500,
      totalConversions: 380,
      totalEarnings: 3250.50,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const profile = {
      id: '1',
      ...body,
      updatedAt: new Date().toISOString(),
    }

    // Store by slug
    if (body.publicSlug) {
      profiles.set(body.publicSlug, profile)
    }

    return NextResponse.json({ success: true, profile })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
