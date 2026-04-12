import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate credentials against environment variables
        const adminEmail = 'admin@theviralfinds.my'
        const adminPassword = process.env.ADMIN_PASSWORD

        if (!adminPassword) {
          console.error('ADMIN_PASSWORD environment variable is not set')
          return null
        }

        if (
          credentials?.email === adminEmail &&
          credentials?.password === adminPassword
        ) {
          return { id: '1', name: 'Ahmad Ali', email: adminEmail, image: null }
        }

        // Return null for invalid credentials
        return null
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        return true
      }
      return true
    },
    async jwt({ token, user, account, profile }) {
      // Persist OAuth provider info
      if (account) {
        token.provider = account.provider
      }
      if (user?.image) {
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.image = token.picture as string | null | undefined
        session.user.provider = token.provider as string | undefined
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
})

export { handler as GET, handler as POST }
