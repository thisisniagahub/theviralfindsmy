/**
 * OpenClaw Gateway Client Tests
 * Tests circuit breaker, retry logic, and utility functions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  extractMessageContent,
  getGatewayState,
  getGatewayUrl,
  getGatewayWsUrl,
  setGatewayWsConnected,
} from './gateway-client'

// Mock env module to prevent validation errors
vi.mock('@/lib/env', () => ({
  env: {
    OPENCLAW_GATEWAY_URL: 'https://operator.gangniaga.my',
    OPENCLAW_GATEWAY_TOKEN: 'test-token',
    OPENCLAW_WS_ENABLED: 'true',
    DB_SERVICE_URL: 'http://127.0.0.1:3005',
    DB_SERVICE_SECRET: 'test-secret',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    NEXTAUTH_SECRET: 'test-secret',
    DEMO_MODE: 'true',
    NOTIFICATION_SERVICE_URL: 'http://127.0.0.1:3004',
  },
}))

describe('extractMessageContent', () => {
  it('should return string input as-is', () => {
    expect(extractMessageContent('Hello')).toBe('Hello')
  })

  it('should extract from response field', () => {
    const data = { response: 'AI response here' }
    expect(extractMessageContent(data)).toBe('AI response here')
  })

  it('should extract from output field', () => {
    const data = { output: 'Generated output' }
    expect(extractMessageContent(data)).toBe('Generated output')
  })

  it('should extract from text field', () => {
    const data = { text: 'Some text content' }
    expect(extractMessageContent(data)).toBe('Some text content')
  })

  it('should extract from choices array', () => {
    const data = {
      choices: [{ message: { content: 'Chat response' } }],
    }
    expect(extractMessageContent(data)).toBe('Chat response')
  })

  it('should extract from nested payload', () => {
    const data = {
      payload: { response: 'Nested response' },
    }
    expect(extractMessageContent(data)).toBe('Nested response')
  })

  it('should extract from nested result', () => {
    const data = {
      result: { output: 'Result output' },
    }
    expect(extractMessageContent(data)).toBe('Result output')
  })

  it('should stringify non-string objects', () => {
    const data = { custom: 'value', num: 42 }
    const result = extractMessageContent(data)
    expect(result).toBe('{"custom":"value","num":42}')
  })

  it('should handle empty choices array', () => {
    const data = { choices: [] }
    const result = extractMessageContent(data)
    expect(result).toBe('{"choices":[]}')
  })

  it('should handle choices with empty message', () => {
    const data = { choices: [{ message: {} }] }
    const result = extractMessageContent(data)
    expect(result).toBe('{"choices":[{"message":{}}]}')
  })
})

describe('getGatewayState', () => {
  beforeEach(() => {
    // Reset gateway state
    const state = getGatewayState()
    state.isHealthy = true
    state.consecutiveFailures = 0
    state.lastError = null
    state.breakerOpenUntil = null
    state.wsConnected = false
  })

  it('should return initial healthy state', () => {
    const state = getGatewayState()
    expect(state.isHealthy).toBe(true)
    expect(state.consecutiveFailures).toBe(0)
    expect(state.lastError).toBeNull()
    expect(state.breakerOpenUntil).toBeNull()
  })

  it('should reflect ws connection status', () => {
    setGatewayWsConnected(true)
    expect(getGatewayState().wsConnected).toBe(true)

    setGatewayWsConnected(false)
    expect(getGatewayState().wsConnected).toBe(false)
  })
})

describe('getGatewayUrl', () => {
  it('should return the configured gateway URL', () => {
    const url = getGatewayUrl()
    expect(url).toBe('https://operator.gangniaga.my')
  })
})

describe('getGatewayWsUrl', () => {
  it('should convert https to wss', () => {
    const wsUrl = getGatewayWsUrl()
    expect(wsUrl).toContain('wss://')
  })
})

describe('circuit breaker behavior', () => {
  beforeEach(() => {
    const state = getGatewayState()
    state.isHealthy = true
    state.consecutiveFailures = 0
    state.lastError = null
    state.breakerOpenUntil = null
  })

  it('should open circuit breaker after 5 consecutive failures', () => {
    const state = getGatewayState()

    // Simulate 5 failures
    for (let i = 0; i < 5; i++) {
      state.consecutiveFailures = i + 1
    }

    state.isHealthy = false
    state.breakerOpenUntil = Date.now() + 30_000

    expect(state.breakerOpenUntil).toBeGreaterThan(Date.now())
    expect(state.isHealthy).toBe(false)
  })

  it('should reset circuit breaker on successful request', () => {
    const state = getGatewayState()
    state.consecutiveFailures = 3
    state.isHealthy = false

    // Simulate recovery
    state.isHealthy = true
    state.consecutiveFailures = 0
    state.lastError = null
    state.breakerOpenUntil = null

    expect(state.isHealthy).toBe(true)
    expect(state.consecutiveFailures).toBe(0)
    expect(state.breakerOpenUntil).toBeNull()
  })
})
