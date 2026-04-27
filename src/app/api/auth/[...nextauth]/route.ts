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

        // 1. Check if email matches ADMIN_EMAIL env var → compare with ADMIN_PASSWORD (bcrypt)
        if (credentials.email === process.env.ADMIN_EMAIL) {
          const adminPassword = process.env.ADMIN_PASSWORD
          if (!adminPassword) return null

          const isValid = await bcrypt.compare(credentials.password, adminPassword)
          if (isValid) {
            // Try to find or create admin user in DB for consistency
            let adminUser = await db.user.findUnique({ where: { email: credentials.email } })
            if (!adminUser) {
              adminUser = await db.user.create({
                data: {
                  email: credentials.email,
                  name: 'Admin',
                  passwordHash: adminPassword,
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
          }
          return null
        }

        // 2. If not admin, query User table by email → compare passwordHash with bcrypt
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

        // 3. Return user object with role information
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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
