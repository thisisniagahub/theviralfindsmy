import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that don't require authentication
const publicRoutes = ['/login', '/pricing']
const publicPrefixRoutes = ['/profile/']
const publicApiRoutes = ['/api/auth', '/api/redirect', '/api/products/search', '/api/route', '/api/health', '/api/profile']

// Request size limit (1MB)
const MAX_REQUEST_SIZE = 1024 * 1024

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check request size limit (prevent large payload attacks)
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    const contentLength = parseInt(request.headers.get('content-length') || '0')
    if (contentLength > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large. Maximum size is 1MB.' },
        { status: 413 }
      )
    }
  }

  // Development bypass with warning
  if (process.env.SKIP_AUTH === 'true') {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ [SECURITY] SKIP_AUTH is enabled in PRODUCTION - this should only be used in development!')
    }
    return NextResponse.next()
  }

  // Allow public routes (exact match)
  if (publicRoutes.some((route) => pathname === route)) {
    return NextResponse.next()
  }

  // Allow public prefix routes (e.g. /profile/{slug} — shareable profiles)
  if (publicPrefixRoutes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Allow public API routes
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  // FIX: Use specific extensions instead of pathname.includes('.')
  // This prevents bypassing auth for /api/somefile.json
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|css|js|woff2?|ttf|eot|webp|avif)$/i)
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    // For API routes, return 401 JSON (not redirect)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and _next
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
