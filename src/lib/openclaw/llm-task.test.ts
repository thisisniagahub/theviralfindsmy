import { beforeEach, describe, expect, it, vi } from 'vitest'

const gatewayFetchMock = vi.fn()

vi.mock('./gateway-client', () => ({
  gatewayFetch: gatewayFetchMock,
}))

async function loadModule() {
  vi.resetModules()
  return await import('./llm-task')
}

describe('llmTaskJSON', () => {
  beforeEach(() => {
    gatewayFetchMock.mockReset()
  })

  it('returns details.json payloads', async () => {
    const { llmTaskJSON } = await loadModule()

    gatewayFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          details: {
            json: { status: 'ok' },
          },
          model: 'openai-codex/gpt-5.4',
        },
      }),
    })

    const result = await llmTaskJSON<{ status: string }>({
      prompt: 'Return a small object',
    })

    expect(result.data).toEqual({ status: 'ok' })
    expect(result.model).toBe('openai-codex/gpt-5.4')
  })

  it('throws when details.json is missing', async () => {
    const { llmTaskJSON } = await loadModule()

    gatewayFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          details: {},
        },
      }),
    })

    await expect(
      llmTaskJSON<{ status: string }>({ prompt: 'Return a small object' })
    ).rejects.toThrow('OpenClaw llm-task did not return details.json')
  })
})
