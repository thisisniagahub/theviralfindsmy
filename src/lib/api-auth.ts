import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import type { TypedSession } from '@/types/next-auth'

export interface AuthenticatedRequest {
  userId: string
  userEmail: string
  userRole: 'USER' | 'ADMIN'
}

/**
 * Require a valid authenticated session.
 * Returns the authenticated user info or a 401 error response.
 */
export async function requireAuth(): Promise<{
  auth: AuthenticatedRequest | null
  error: NextResponse | null
}> {
  const session = await getServerSession(authOptions) as TypedSession

  if (!session?.user?.id) {
    return {
      auth: null,
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'Valid session required' },
        { status: 401 }
      )
    }
  }

  return {
    auth: {
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
    },
    error: null,
  }
}

/**
 * Require admin role. Returns 403 if user is not admin.
 */
export async function requireAdmin(): Promise<{
  auth: AuthenticatedRequest | null
  error: NextResponse | null
}> {
  const result = await requireAuth()

  if (result.error) return result

  if (result.auth?.userRole !== 'ADMIN') {
    return {
      auth: null,
      error: NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      )
    }
  }

  return result
}

/**
 * Build fetch options that include authentication headers for the DB service.
 * Pass these to fetch() when calling the DB service from authenticated routes.
 */
export function dbServiceFetchOptions(
  auth: AuthenticatedRequest,
  extraOptions?: RequestInit
): RequestInit {
  return {
    ...extraOptions,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DB_SERVICE_SECRET || ''}`,
      'x-user-id': auth.userId,
      ...((extraOptions?.headers as Record<string, string>) || {}),
    },
  }
}

/**
 * Fetch from the DB service with authentication headers.
 */
export async function authenticatedDbFetch(
  dbServiceUrl: string,
  path: string,
  auth: AuthenticatedRequest,
  options?: RequestInit
): Promise<Response> {
  const url = `${dbServiceUrl}${path}`
  return fetch(url, dbServiceFetchOptions(auth, options))
}
