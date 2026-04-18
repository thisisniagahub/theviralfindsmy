import { gatewayFetch } from './gateway-client'

export interface LLMTaskOptions {
  prompt: string
  input?: unknown
  schema?: Record<string, unknown>
  provider?: string
  model?: string
  thinking?: string
  authProfileId?: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

export interface LLMTaskResult<T> {
  data: T
  model?: string
  raw: unknown
}

export async function llmTaskJSON<T>(options: LLMTaskOptions): Promise<LLMTaskResult<T>> {
  const response = await gatewayFetch('/tools/invoke', {
    method: 'POST',
    body: JSON.stringify({
      tool: 'llm-task',
      action: 'json',
      args: {
        prompt: options.prompt,
        ...(options.input !== undefined ? { input: options.input } : {}),
        ...(options.schema ? { schema: options.schema } : {}),
        ...(options.provider ? { provider: options.provider } : {}),
        ...(options.model ? { model: options.model } : {}),
        ...(options.thinking ? { thinking: options.thinking } : {}),
        ...(options.authProfileId ? { authProfileId: options.authProfileId } : {}),
        ...(typeof options.temperature === 'number' ? { temperature: options.temperature } : {}),
        ...(typeof options.maxTokens === 'number' ? { maxTokens: options.maxTokens } : {}),
        ...(typeof options.timeoutMs === 'number' ? { timeoutMs: options.timeoutMs } : {}),
      },
      sessionKey: 'main',
      dryRun: false,
    }),
  }, {
    sessionKey: 'main',
  })

  const body = await response.json() as {
    ok?: boolean
    error?: {
      type?: string
      message?: string
    }
    result?: unknown
    payload?: unknown
  }

  if (!response.ok || body.ok === false) {
    throw new Error(body.error?.message || 'OpenClaw llm-task invocation failed')
  }

  const result = body.result ?? body.payload ?? body

  const parsed = result as {
    details?: { json?: T }
    model?: string
  }

  if (parsed?.details?.json === undefined) {
    throw new Error('OpenClaw llm-task did not return details.json')
  }

  return {
    data: parsed.details.json,
    model: parsed.model,
    raw: result,
  }
}
