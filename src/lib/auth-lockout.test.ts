import { beforeEach, describe, expect, it, vi } from 'vitest'

const redisStore = new Map<string, string>()

vi.mock('./redis', () => ({
  get: vi.fn(async (key: string) => redisStore.get(key) ?? null),
  set: vi.fn(async (key: string, value: string) => {
    redisStore.set(key, value)
  }),
  del: vi.fn(async (key: string) => {
    redisStore.delete(key)
  }),
  incr: vi.fn(async (key: string) => {
    const next = (Number(redisStore.get(key) ?? '0') || 0) + 1
    redisStore.set(key, String(next))
    return next
  }),
  expire: vi.fn(async () => {}),
}))

async function loadModule() {
  vi.resetModules()
  return await import('./auth-lockout')
}

describe('auth lockout', () => {
  beforeEach(() => {
    redisStore.clear()
  })

  it('locks an IP after five failed attempts', async () => {
    const { checkAccountLockout, recordFailedAttempt } = await loadModule()

    for (let index = 0; index < 5; index += 1) {
      await recordFailedAttempt('203.0.113.10')
    }

    const status = await checkAccountLockout('203.0.113.10')
    expect(status.locked).toBe(true)
    expect(status.retryAfter).toBeGreaterThan(0)
  })

  it('clears lockout state after a successful login', async () => {
    const { checkAccountLockout, clearFailedAttempts, recordFailedAttempt } = await loadModule()

    for (let index = 0; index < 5; index += 1) {
      await recordFailedAttempt('198.51.100.20')
    }

    await clearFailedAttempts('198.51.100.20')

    const status = await checkAccountLockout('198.51.100.20')
    expect(status).toEqual({ locked: false })
  })
})

