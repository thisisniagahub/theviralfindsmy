import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.email === 'admin@theviralfinds.my' && credentials?.password === process.env.ADMIN_PASSWORD) {
          return { id: '1', name: 'Ahmad Ali', email: 'admin@theviralfinds.my' }
        }
        return null
      },
    }),
  ],
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
})

export { handler as GET, handler as POST }
