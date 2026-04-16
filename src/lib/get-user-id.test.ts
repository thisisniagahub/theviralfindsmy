import { describe, it, expect } from 'vitest'
import { getUserIdFromSession } from './get-user-id'
import type { Session } from 'next-auth'

describe('getUserIdFromSession', () => {
  it('should return userId when session exists with user.id', () => {
    const session = {
      user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      expires: '2026-12-31T23:59:59Z',
    } as Session
    expect(getUserIdFromSession(session)).toBe('user-123')
  })

  it('should throw when session is null', () => {
    expect(() => getUserIdFromSession(null)).toThrow('Unauthorized')
  })

  it('should throw when session.user.id is missing', () => {
    const session = {
      user: { email: 'test@example.com', name: 'Test User' },
      expires: '2026-12-31T23:59:59Z',
    } as Session
    expect(() => getUserIdFromSession(session)).toThrow('Unauthorized')
  })
})
