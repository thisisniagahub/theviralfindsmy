import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS, type RateLimitConfig } from './rate-limit'

export { RATE_LIMITS, type RateLimitConfig }

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

export function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.api
): NextResponse | null {
  const ip = getClientIp(request)
  const result = rateLimit(ip, config)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: Math.ceil(result.resetIn / 1000) },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(result.resetIn / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  return null
}
