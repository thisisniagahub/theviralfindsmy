import { NextRequest, NextResponse } from 'next/server'
import { dbFetch, isDemoMode } from '@/lib/db-safe'

// Whitelisted Shopee domains for redirect security
const ALLOWED_DOMAINS = [
  'shopee.com.my',
  'shopee.sg',
  'shopee.co.id',
  'shopee.co.th',
  'shopee.ph',
  'shopee.vn',
]

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_DOMAINS.some((domain) => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain))
  } catch {
    return false
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  if (isDemoMode()) {
    return NextResponse.redirect('https://shopee.com.my', 307)
  }
  try {
    const { shortCode } = await params

    const data = await dbFetch<{ redirectUrl: string; status?: string; expiresAt?: string | null }>(`/redirect/${encodeURIComponent(shortCode)}`)

    const redirectUrl = data.redirectUrl

    if (!isAllowedUrl(redirectUrl)) {
      return NextResponse.json(
        { error: 'Redirect URL is not from an allowed domain' },
        { status: 400 }
      )
    }

    // 307 redirect to affiliate URL
    return NextResponse.redirect(redirectUrl, 307)
  } catch (error) {
    console.error('Redirect error:', error)
    if (error instanceof Error && error.message.includes('404')) {
      const { shortCode } = await params
      return NextResponse.json(
        { error: 'Affiliate link not found', shortCode },
        { status: 404 }
      )
    }
    if (error instanceof Error && error.message.includes('410')) {
      const { shortCode } = await params
      return NextResponse.json(
        { error: 'This affiliate link has expired or been paused', shortCode },
        { status: 410 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to process redirect' },
      { status: 500 }
    )
  }
}
