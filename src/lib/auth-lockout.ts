import { createHash } from 'node:crypto'
import { del as redisDel, expire as redisExpire, get as redisGet, incr as redisIncr, set as redisSet } from './redis'

interface LockoutRecord {
  count: number
  lockedUntil: number | null
}

export interface LockoutStatus {
  locked: boolean
  retryAfter?: number
}

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60_000
const LOCKOUT_TTL_SECONDS = Math.ceil(LOCKOUT_DURATION_MS / 1000)

const failedAttempts = new Map<string, LockoutRecord>()
let cleanupTimer: ReturnType<typeof setInterval> | null = null
let redisFallbackWarningShown = false

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

function getCountKey(ip: string): string {
  return `auth:lockout:count:${hashIp(ip)}`
}

function getLockedUntilKey(ip: string): string {
  return `auth:lockout:locked:${hashIp(ip)}`
}

function warnRedisFallback(error: unknown) {
  if (redisFallbackWarningShown) {
    return
  }

  redisFallbackWarningShown = true
  console.warn('[Auth] Redis-backed lockout unavailable, falling back to in-memory lockout state.', error)
}

function ensureMemoryCleanup() {
  if (cleanupTimer) {
    return
  }

  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [ip, record] of failedAttempts) {
      if (record.lockedUntil && record.lockedUntil > now) {
        continue
      }

      if (!record.lockedUntil || record.lockedUntil <= now) {
        failedAttempts.delete(ip)
      }
    }
  }, 5 * 60_000)

  if (cleanupTimer.unref) {
    cleanupTimer.unref()
  }
}

function readMemoryRecord(ip: string): LockoutRecord | null {
  ensureMemoryCleanup()

  const record = failedAttempts.get(ip)
  if (!record) {
    return null
  }

  if (record.lockedUntil && record.lockedUntil <= Date.now()) {
    failedAttempts.delete(ip)
    return null
  }

  return record
}

function writeMemoryRecord(ip: string, record: LockoutRecord) {
  ensureMemoryCleanup()
  failedAttempts.set(ip, record)
}

function clearMemoryRecord(ip: string) {
  failedAttempts.delete(ip)
}

async function checkRedisLockout(ip: string): Promise<LockoutStatus> {
  const lockedUntilRaw = await redisGet(getLockedUntilKey(ip))
  if (!lockedUntilRaw) {
    return { locked: false }
  }

  const lockedUntil = Number(lockedUntilRaw)
  if (!Number.isFinite(lockedUntil)) {
    await Promise.allSettled([
      redisDel(getLockedUntilKey(ip)),
      redisDel(getCountKey(ip)),
    ])
    return { locked: false }
  }

  if (lockedUntil <= Date.now()) {
    await Promise.allSettled([
      redisDel(getLockedUntilKey(ip)),
      redisDel(getCountKey(ip)),
    ])
    return { locked: false }
  }

  return {
    locked: true,
    retryAfter: Math.ceil((lockedUntil - Date.now()) / 1000),
  }
}

async function recordRedisFailedAttempt(ip: string) {
  const countKey = getCountKey(ip)
  const lockedUntilKey = getLockedUntilKey(ip)
  const count = await redisIncr(countKey)

  if (count === 1) {
    await redisExpire(countKey, LOCKOUT_TTL_SECONDS)
  }

  if (count >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_DURATION_MS
    await redisSet(lockedUntilKey, String(lockedUntil), LOCKOUT_TTL_SECONDS)
    console.warn(`[Auth] Account locked for IP: ${ip} after ${count} failed attempts`)
  }
}

async function clearRedisFailedAttempts(ip: string) {
  await Promise.allSettled([
    redisDel(getCountKey(ip)),
    redisDel(getLockedUntilKey(ip)),
  ])
}

export async function checkAccountLockout(ip: string): Promise<LockoutStatus> {
  try {
    return await checkRedisLockout(ip)
  } catch (error) {
    warnRedisFallback(error)
  }

  const record = readMemoryRecord(ip)
  if (!record) {
    return { locked: false }
  }

  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    return {
      locked: true,
      retryAfter: Math.ceil((record.lockedUntil - Date.now()) / 1000),
    }
  }

  return { locked: false }
}

export async function recordFailedAttempt(ip: string): Promise<void> {
  try {
    await recordRedisFailedAttempt(ip)
    return
  } catch (error) {
    warnRedisFallback(error)
  }

  const record = readMemoryRecord(ip) ?? { count: 0, lockedUntil: null }
  record.count += 1

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS
    console.warn(`[Auth] Account locked for IP: ${ip} after ${record.count} failed attempts`)
  }

  writeMemoryRecord(ip, record)
}

export async function clearFailedAttempts(ip: string): Promise<void> {
  try {
    await clearRedisFailedAttempts(ip)
  } catch (error) {
    warnRedisFallback(error)
  }

  clearMemoryRecord(ip)
}
