import type { Session } from 'next-auth'

/**
 * Extract the user ID from a NextAuth session.
 * Throws if the session is missing or the user ID is not present.
 */
export function getUserIdFromSession(session: Session | null): string {
  const userId = session?.user?.id
  if (!userId) {
    throw new Error('Unauthorized')
  }
  return userId
}
