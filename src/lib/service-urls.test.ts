import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getDbServiceUrl, getNotificationServiceUrl, isServiceConfigured } from './service-urls'

describe('service-urls', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should return default URLs when env vars not set', () => {
    const dbUrl = getDbServiceUrl()
    const notifUrl = getNotificationServiceUrl()

    expect(dbUrl).toBe('http://127.0.0.1:3005')
    expect(notifUrl).toBe('http://127.0.0.1:3004')
  })

  it('should use env vars when set', () => {
    vi.stubEnv('DB_SERVICE_URL', 'http://custom-db:3005')
    vi.stubEnv('NOTIFICATION_SERVICE_URL', 'http://custom-notif:3004')

    const dbUrl = getDbServiceUrl()
    const notifUrl = getNotificationServiceUrl()

    expect(dbUrl).toBe('http://custom-db:3005')
    expect(notifUrl).toBe('http://custom-notif:3004')
  })

  it('should detect when services are configured', () => {
    vi.stubEnv('DB_SERVICE_URL', 'http://db:3005')
    vi.stubEnv('NOTIFICATION_SERVICE_URL', 'http://notif:3004')

    expect(isServiceConfigured('db')).toBe(true)
    expect(isServiceConfigured('notification')).toBe(true)
  })

  it('should detect when services are not configured', () => {
    vi.stubEnv('DB_SERVICE_URL', '')
    vi.stubEnv('NOTIFICATION_SERVICE_URL', '')

    expect(isServiceConfigured('db')).toBe(false)
    expect(isServiceConfigured('notification')).toBe(false)
  })
})
