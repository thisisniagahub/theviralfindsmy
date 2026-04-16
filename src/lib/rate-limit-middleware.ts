/**
 * Rate Limit API Helper
 * Use this in API route handlers to enforce rate limits.
 * Returns a 429 Response if limit exceeded, null if allowed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimitByIP } from './rate-limit'

export async function applyRateLimit(request: NextRequest, routeName?: string): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const result = await rateLimitByIP(ip)

  if (!result.allowed) {
    console.warn(`[RateLimit] ${routeName || 'API'} — IP ${ip} exceeded rate limit (${result.retryAfter}s remaining)`)
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + result.retryAfter * 1000),
        },
      }
    )
  }

  // Return headers with remaining info
  return null
}
