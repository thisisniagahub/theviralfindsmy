import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import bcrypt from 'bcryptjs'
import { checkAccountLockout, clearFailedAttempts, recordFailedAttempt } from '@/lib/auth-lockout'
import { buildDbServiceUrl } from '@/lib/db-safe'
import {
  getConfiguredAdminEmail,
  getConfiguredAdminPassword,
  getLocalDemoCredentials,
  isLocalDemoAuthEnabled,
} from '@/lib/local-demo-auth'

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
  const dbServiceSecret = process.env.DB_SERVICE_SECRET

  if (!dbServiceSecret) {
    console.error('[Auth] DB service is not configured for user resolution')
    return null
  }

  try {
    const response = await fetch(buildDbServiceUrl('/users/upsert'), {
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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // Get client IP for lockout tracking
        const ip = (req?.headers?.['x-forwarded-for'] as string) || 'unknown'

        // Check if IP is locked out
        const lockout = await checkAccountLockout(ip)
        if (lockout.locked) {
          console.warn(`[Auth] Login blocked for locked IP: ${ip} (retry after ${lockout.retryAfter}s)`)
          return null
        }

        // Validate credentials against environment variables
        const localDemoCredentials = getLocalDemoCredentials()
        const localDemoAuthEnabled = isLocalDemoAuthEnabled()
        const adminEmail = getConfiguredAdminEmail() ?? localDemoCredentials?.email
        const adminPassword = getConfiguredAdminPassword() ?? localDemoCredentials?.password

        if (!adminEmail || !adminPassword) {
          console.error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set')
          await recordFailedAttempt(ip)
          return null
        }

        // Local demo mode may use a plaintext password for easier preview/testing.
        if (credentials?.email === adminEmail) {
          try {
            const isHashedPassword = adminPassword.startsWith('$2b$') || adminPassword.startsWith('$2a$')
            const isValid = isHashedPassword
              ? await bcrypt.compare(credentials.password, adminPassword)
              : localDemoAuthEnabled && credentials.password === adminPassword

            if (!isHashedPassword && !localDemoAuthEnabled) {
              console.error('⚠️ [SECURITY] ADMIN_PASSWORD must be bcrypt hashed outside local demo mode.')
              await recordFailedAttempt(ip)
              return null
            }

            if (isValid) {
              // Clear failed attempts on successful login
              await clearFailedAttempts(ip)

              const user = await resolveDbUser({
                email: adminEmail,
                name: 'Admin User',
                image: null,
              })

              if (!user && localDemoAuthEnabled) {
                console.warn('[Auth] Falling back to local demo user because DB service is unavailable')
                return createLocalDemoUser(adminEmail)
              }

              return user
            } else {
              // Invalid password
              await recordFailedAttempt(ip)
            }
          } catch (err) {
            console.error('[Auth] Bcrypt error:', err)
            await recordFailedAttempt(ip)
          }
        } else if (credentials?.email) {
          // Wrong email attempted
          await recordFailedAttempt(ip)
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
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
