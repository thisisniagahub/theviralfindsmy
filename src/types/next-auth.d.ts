/** Extended NextAuth session types for type-safe user data */

// Extend the built-in session type to include user.id
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image: string | null
      role: 'USER' | 'ADMIN'
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: 'USER' | 'ADMIN'
  }
}

// Extend JWT token type
declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    role?: 'USER' | 'ADMIN'
    email?: string
    provider?: string
  }
}

// Type-safe session helper
export interface TypedSession {
  user: {
    id: string
    email: string
    name: string
    image?: string | null
    role: 'USER' | 'ADMIN'
  }
}

// Type-safe API auth result
export interface AuthResult {
  userId: string
  userEmail: string
  userRole: 'USER' | 'ADMIN'
}
