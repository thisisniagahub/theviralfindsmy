/**
 * API Route Tests — Critical Routes
 * Tests health, validations, and core API behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env module
vi.mock('@/lib/env', () => ({
  env: {
    DEMO_MODE: 'true',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    NEXTAUTH_SECRET: 'test-secret',
    OPENCLAW_GATEWAY_URL: 'https://operator.gangniaga.my',
    OPENCLAW_GATEWAY_TOKEN: 'test-token',
    OPENCLAW_WS_ENABLED: 'true',
    DB_SERVICE_URL: 'http://127.0.0.1:3005',
    DB_SERVICE_SECRET: 'test-secret',
    NOTIFICATION_SERVICE_URL: 'http://127.0.0.1:3004',
  },
}))

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({ handlers: {} })),
  getServerSession: vi.fn(() => Promise.resolve(null)),
}))

// Mock api-utils
vi.mock('@/lib/api-utils', () => ({
  withRateLimit: vi.fn(() => null),
  RATE_LIMITS: {
    api: { windowMs: 60000, maxRequests: 60 },
    ai: { windowMs: 60000, maxRequests: 10 },
    auth: { windowMs: 300000, maxRequests: 5 },
    mutation: { windowMs: 60000, maxRequests: 30 },
  },
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

// Mock api-auth
vi.mock('@/lib/api-auth', () => ({
  requireAuth: vi.fn(() => ({ auth: null, error: null })),
  authenticatedDbFetch: vi.fn(),
}))

describe('Health API Route', () => {
  let GET: (typeof import('../../app/api/health/route'))['GET']

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../../app/api/health/route')
    GET = mod.GET
  })

  it('should return healthy status in demo mode', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.status).toBe('healthy')
    expect(body.version).toBe('8.0.0')
    expect(body.services).toBeDefined()
    expect(body._demo).toBe(true)
  })

  it('should include all required services', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.services.database).toBeDefined()
    expect(body.services.openclaw).toBeDefined()
    expect(body.services.notification).toBeDefined()
  })

  it('should include response time', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.responseTimeMs).toBeDefined()
    expect(typeof body.responseTimeMs).toBe('number')
  })

  it('should include timestamp', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.timestamp).toBeDefined()
    expect(new Date(body.timestamp).getTime()).toBeGreaterThan(0)
  })
})

describe('Dashboard API Route', () => {
  let GET: (typeof import('../../app/api/dashboard/route'))['GET']

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../../app/api/dashboard/route')
    GET = mod.GET
  })

  it('should return dashboard data in demo mode', async () => {
    const request = new Request('http://localhost:3000/api/dashboard') as any
    const response = await GET(request)
    const body = await response.json()

    expect(body.totalLinks).toBeDefined()
    expect(body.totalClicks).toBeDefined()
    expect(body.totalEarnings).toBeDefined()
    expect(body.earningsData).toBeDefined()
  })

  it('should include performance metrics', async () => {
    const request = new Request('http://localhost:3000/api/dashboard') as any
    const response = await GET(request)
    const body = await response.json()

    expect(body.performanceScore).toBeDefined()
    expect(body.performanceGrade).toBeDefined()
    expect(body.scoreBreakdown).toBeDefined()
    expect(Array.isArray(body.scoreBreakdown)).toBe(true)
  })

  it('should include top links', async () => {
    const request = new Request('http://localhost:3000/api/dashboard') as any
    const response = await GET(request)
    const body = await response.json()

    expect(body.topLinks).toBeDefined()
    expect(Array.isArray(body.topLinks)).toBe(true)
    expect(body.topLinks.length).toBeGreaterThan(0)
  })

  it('should support period parameter', async () => {
    const request = new Request('http://localhost:3000/api/dashboard?period=7d') as any
    const response = await GET(request)
    const body = await response.json()

    expect(body.earningsData).toBeDefined()
  })
})

describe('Links API Route', () => {
  let GET: (typeof import('../../app/api/links/route'))['GET']

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../../app/api/links/route')
    GET = mod.GET
  })

  it('should return links in demo mode', async () => {
    const request = new Request('http://localhost:3000/api/links') as any
    const response = await GET(request)
    const body = await response.json()

    expect(body.links).toBeDefined()
    expect(Array.isArray(body.links)).toBe(true)
    expect(body.pagination).toBeDefined()
  })

  it('should include pagination info', async () => {
    const request = new Request('http://localhost:3000/api/links') as any
    const response = await GET(request)
    const body = await response.json()

    expect(body.pagination.page).toBeDefined()
    expect(body.pagination.limit).toBeDefined()
    expect(body.pagination.total).toBeDefined()
    expect(body.pagination.totalPages).toBeDefined()
  })

  it('should include campaigns list', async () => {
    const request = new Request('http://localhost:3000/api/links') as any
    const response = await GET(request)
    const body = await response.json()

    expect(body.campaigns).toBeDefined()
    expect(Array.isArray(body.campaigns)).toBe(true)
  })
})
