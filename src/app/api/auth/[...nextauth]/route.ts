import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import bcrypt from 'bcryptjs'
import { getDbServiceUrl } from '@/lib/db-safe'
import { redisRateLimiter } from '@/lib/rate-limit-redis'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Account Lockout ──────────────────────────────────────────────
// Track failed login attempts per IP to prevent brute force attacks
const failedAttempts = new Map<string, { count: number; lockedUntil: number | null }>()
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

function checkAccountLockout(ip: string): { locked: boolean; retryAfter?: number } {
  const attempt = failedAttempts.get(ip)
  if (!attempt) return { locked: false }

  if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
    const retryAfter = Math.ceil((attempt.lockedUntil - Date.now()) / 1000)
    return { locked: true, retryAfter }
  }

  // Lockout expired, reset
  if (attempt.lockedUntil && Date.now() >= attempt.lockedUntil) {
    failedAttempts.delete(ip)
  }

  return { locked: false }
}

function recordFailedAttempt(ip: string) {
  const attempt = failedAttempts.get(ip) || { count: 0, lockedUntil: null }
  attempt.count += 1

  if (attempt.count >= MAX_FAILED_ATTEMPTS) {
    attempt.lockedUntil = Date.now() + LOCKOUT_DURATION_MS
    console.warn(`[Auth] Account locked for IP: ${ip} after ${attempt.count} failed attempts`)
  }

  failedAttempts.set(ip, attempt)
}

function clearFailedAttempts(ip: string) {
  failedAttempts.delete(ip)
}

function isLocalDemoPasswordEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.DEMO_MODE === 'true'
}

// Cleanup expired lockouts every 5 minutes
let lockoutCleanup: ReturnType<typeof setInterval> | null = null
function ensureLockoutCleanup() {
  if (lockoutCleanup) return
  lockoutCleanup = setInterval(() => {
    const now = Date.now()
    for (const [ip, attempt] of failedAttempts) {
      if (attempt.lockedUntil && now >= attempt.lockedUntil) {
        failedAttempts.delete(ip)
      }
    }
  }, 5 * 60_000)
  if (lockoutCleanup.unref) lockoutCleanup.unref()
}

// ─── OAuth Allowlist ──────────────────────────────────────────────
// Only emails listed here (or matching the allowed domain) can sign
// in via Google / Facebook.  Add real user emails before going live.
const ALLOWED_OAUTH_EMAILS = new Set<string>([
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.toLowerCase()] : []),
  // Add allowed OAuth emails here
])

const ALLOWED_OAUTH_DOMAINS = new Set([
  'theviralfinds.my',
  // Add allowed OAuth domains here
])

function isOAuthEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false
  const lower = email.toLowerCase()
  if (ALLOWED_OAUTH_EMAILS.has(lower)) return true
  const domain = lower.split('@')[1]
  if (domain && ALLOWED_OAUTH_DOMAINS.has(domain)) return true
  return false
}

type ResolvedAuthUser = {
  id: string
  email: string
  name: string | null
  image: string | null
  role: 'USER' | 'ADMIN'
}

function createLocalDemoUser(email: string): ResolvedAuthUser {
  return {
    id: 'local-demo-admin',
    email,
    name: 'Admin User',
    image: null,
    role: 'ADMIN',
  }
}

async function resolveDbUser(input: {
  email: string
  name?: string | null
  image?: string | null
}): Promise<ResolvedAuthUser | null> {
  const dbServiceUrl = getDbServiceUrl()
  const dbServiceSecret = process.env.DB_SERVICE_SECRET

  if (!dbServiceUrl || !dbServiceSecret) {
    console.error('[Auth] DB service is not configured for user resolution')
    return null
  }

  try {
    const response = await fetch(`${dbServiceUrl.replace(/\/$/, '')}/users/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dbServiceSecret}`,
      },
      cache: 'no-store',
      body: JSON.stringify({
        email: input.email,
        name: input.name ?? null,
        image: input.image ?? null,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error')
      console.error(`[Auth] Failed to resolve DB user (${response.status}): ${errorBody}`)
      return null
    }

    const user = await response.json().catch(() => null) as Partial<ResolvedAuthUser> | null
    if (!user?.id || !user.email || !user.role) {
      console.error('[Auth] DB user response is incomplete')
      return null
    }

    if (user.email.toLowerCase() !== input.email.toLowerCase()) {
      console.error('[Auth] DB user email mismatch')
      return null
    }

    if (user.role !== 'USER' && user.role !== 'ADMIN') {
      console.error('[Auth] DB user role is invalid')
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? input.name ?? null,
      image: user.image ?? input.image ?? null,
      role: user.role,
    }
  } catch (err) {
    console.error('[Auth] Failed to resolve DB user:', err)
    return null
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // Ensure lockout cleanup is running
        ensureLockoutCleanup()

        // Get client IP for lockout tracking
        const ip = (req?.headers?.['x-forwarded-for'] as string) || 'unknown'

        // Check if IP is locked out
        const lockout = checkAccountLockout(ip)
        if (lockout.locked) {
          console.warn(`[Auth] Login blocked for locked IP: ${ip} (retry after ${lockout.retryAfter}s)`)
          return null
        }

        // Validate credentials against environment variables
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD

        if (!adminEmail || !adminPassword) {
          console.error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set')
          recordFailedAttempt(ip)
          return null
        }

        // Local demo mode may use a plaintext password for easier preview/testing.
        if (credentials?.email === adminEmail) {
          try {
            const isHashedPassword = adminPassword.startsWith('$2b$') || adminPassword.startsWith('$2a$')
            const isValid = isHashedPassword
              ? await bcrypt.compare(credentials.password, adminPassword)
              : isLocalDemoPasswordEnabled() && credentials.password === adminPassword

            if (!isHashedPassword && !isLocalDemoPasswordEnabled()) {
              console.error('⚠️ [SECURITY] ADMIN_PASSWORD must be bcrypt hashed outside local demo mode.')
              recordFailedAttempt(ip)
              return null
            }

            if (isValid) {
              // Clear failed attempts on successful login
              clearFailedAttempts(ip)

              const user = await resolveDbUser({
                email: adminEmail,
                name: 'Admin User',
                image: null,
              })

              if (!user && isLocalDemoPasswordEnabled()) {
                console.warn('[Auth] Falling back to local demo user because DB service is unavailable')
                return createLocalDemoUser(adminEmail)
              }

              return user
            } else {
              // Invalid password
              recordFailedAttempt(ip)
            }
          } catch (err) {
            console.error('[Auth] Bcrypt error:', err)
            recordFailedAttempt(ip)
          }
        } else if (credentials?.email) {
          // Wrong email attempted
          recordFailedAttempt(ip)
        }

        // Return null for invalid credentials
        return null
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
        FacebookProvider({
          clientId: process.env.FACEBOOK_CLIENT_ID,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        }),
      ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Credentials provider handles its own validation in authorize()
      if (account?.provider === 'credentials') {
        return Boolean(user?.id && user?.email && user?.role)
      }

      // OAuth providers: enforce email allowlist
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        if (!isOAuthEmailAllowed(user?.email)) {
          console.warn(`[Auth] OAuth sign-in blocked for: ${user?.email} (not in allowlist)`)
          return false
        }

        const resolvedUser = await resolveDbUser({
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        })

        if (!resolvedUser) {
          return false
        }

        user.id = resolvedUser.id
        user.email = resolvedUser.email
        user.name = resolvedUser.name
        user.image = resolvedUser.image
        user.role = resolvedUser.role

        return true
      }

      return false
    },
    async jwt({ token, user, account }) {
      // Persist OAuth provider info
      if (account) {
        token.provider = account.provider
      }

      if (user) {
        const userId = user.id
        const userEmail = user.email
        const userRole = user.role

        if (!userId || !userEmail || (userRole !== 'USER' && userRole !== 'ADMIN')) {
          throw new Error('[Auth] Incomplete user identity in JWT callback')
        }

        token.userId = userId
        token.email = userEmail
        token.role = userRole
        token.name = user.name ?? token.name
        token.picture = user.image ?? token.picture
      }

      if (!token.userId || !token.email || (token.role !== 'USER' && token.role !== 'ADMIN')) {
        throw new Error('[Auth] Incomplete token identity')
      }

      return token
    },
    async session({ session, token }) {
      const userId = typeof token.userId === 'string' ? token.userId : null
      const email = typeof token.email === 'string' ? token.email : null
      const role = token.role === 'USER' || token.role === 'ADMIN' ? token.role : null

      if (!session.user || !userId || !email || !role) {
        throw new Error('[Auth] Incomplete session identity')
      }

      session.user.id = userId
      session.user.email = email
      session.user.role = role
      session.user.name = session.user.name ?? null
      session.user.image = typeof token.picture === 'string' ? token.picture : session.user.image ?? null

      return session
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
})

export const authOptions = {
  providers: handler.providers,
  callbacks: handler.callbacks,
  pages: handler.pages,
  secret: handler.secret,
  session: handler.session,
}

export { handler as GET, handler as POST }
