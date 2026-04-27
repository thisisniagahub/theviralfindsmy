import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD

        // 1. Check if email matches ADMIN_EMAIL env var
        if (adminEmail && credentials.email === adminEmail) {
          if (!adminPassword) return null

          // ADMIN_PASSWORD from env is plaintext — use direct comparison
          // (DB passwords are bcrypt hashed, env var is not)
          let isValid = false
          if (credentials.password === adminPassword) {
            isValid = true
          } else {
            // Also try bcrypt in case admin set a hashed password in env
            try {
              isValid = await bcrypt.compare(credentials.password, adminPassword)
            } catch {
              // Not a valid bcrypt hash, ignore
            }
          }

          if (isValid) {
            try {
              // Find or create admin user in DB for consistency
              let adminUser = await db.user.findUnique({ where: { email: credentials.email } })
              if (!adminUser) {
                // Hash the password before storing in DB
                const hashedPassword = await bcrypt.hash(adminPassword, 12)
                adminUser = await db.user.create({
                  data: {
                    email: credentials.email,
                    name: 'Admin',
                    passwordHash: hashedPassword,
                    role: 'admin',
                    isActive: true,
                    lastLoginAt: new Date(),
                  },
                })
              } else {
                await db.user.update({
                  where: { id: adminUser.id },
                  data: { lastLoginAt: new Date() },
                })
              }

              return {
                id: adminUser.id,
                name: adminUser.name,
                email: adminUser.email,
                role: 'admin',
              }
            } catch (dbError) {
              // If DB is not available, still allow login with env credentials
              console.warn('[auth] DB unavailable, using env-only admin login:', dbError)
              return {
                id: 'admin-env',
                name: 'Admin',
                email: credentials.email,
                role: 'admin',
              }
            }
          }
          return null
        }

        // 2. If not admin, query User table by email → compare passwordHash with bcrypt
        try {
          const user = await db.user.findUnique({ where: { email: credentials.email } })
          if (!user || !user.isActive) {
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!isValid) {
            return null
          }

          // Update last login
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (dbError) {
          console.warn('[auth] DB unavailable for user lookup:', dbError)
          return null
        }
      },
    }),
  ],
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string
        ;(session.user as { id?: string }).id = token.id as string
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
