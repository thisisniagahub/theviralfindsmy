const DEFAULT_OPENCLAW_GATEWAY = 'https://operator.gangniaga.my'
const OPENCLAW_GATEWAY = resolveGatewayUrl()
const OPENCLAW_API_KEY = resolveGatewayToken()
const GATEWAY_TIMEOUT = 15_000
const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000
const DEFAULT_OPENCLAW_MODEL = 'openclaw/default'

type OpenClawMessageRole = 'system' | 'user' | 'assistant'

interface CompletionChoiceMessage {
  content?: string
}

interface CompletionChoice {
  message?: CompletionChoiceMessage
}

interface CompletionLikeResponse {
  choices?: CompletionChoice[]
}

interface GatewayHealthPayload {
  uptime?: string
  version?: string
  server?: {
    uptime?: string
    version?: string
  }
}

interface GatewayModelsPayload {
  data?: unknown[]
  models?: unknown[]
}

interface OpenClawSDK {
  functions: {
    invoke(name: string, args?: Record<string, unknown>): Promise<unknown>
  }
  chat: {
    completions: {
      create(request: OpenClawCompletionRequest & { stream?: boolean }): Promise<unknown>
    }
  }
  images: {
    generations: {
      create(request: { prompt: string; size?: string }): Promise<unknown>
    }
  }
}

export interface GatewayState {
  isHealthy: boolean
  consecutiveFailures: number
  lastError: string | null
  breakerOpenUntil: number | null
  wsConnected: boolean
}

export interface OpenClawHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  gateway: string
  uptime?: string
  version?: string
  timestamp: string
  latencyMs?: number
}

export interface OpenClawCompletionRequest {
  model?: string
  messages: Array<{ role: OpenClawMessageRole; content: string }>
  temperature?: number
  max_tokens?: number
  thinking?: { type: 'enabled' | 'disabled' }
  sessionKey?: string
}

export interface OpenClawModel {
  id: string
  name: string
  provider: string
  category: string
}

interface GatewayFetchMeta {
  model?: string
  sessionKey?: string
}

const gatewayState: GatewayState = {
  isHealthy: true,
  consecutiveFailures: 0,
  lastError: null,
  breakerOpenUntil: null,
  wsConnected: false,
}

const FALLBACK_OPENCLAW_MODELS: OpenClawModel[] = [
  { id: 'openclaw/main', name: 'NiagaBot', provider: 'openclaw', category: 'general' },
  { id: 'openclaw/niagamarketing', name: 'NiagaMarketingBot', provider: 'openclaw', category: 'marketing' },
  { id: 'openclaw/niagaresearch', name: 'NiagaResearchBot', provider: 'openclaw', category: 'research' },
  { id: 'openclaw/niagaops', name: 'NiagaOpsBot', provider: 'openclaw', category: 'operations' },
  { id: 'openclaw/niagahubbot', name: 'NiagaStrategistBot', provider: 'openclaw', category: 'strategy' },
  { id: 'openclaw/niagacomputer', name: 'NiagaComputerBot', provider: 'openclaw', category: 'computation' },
  { id: 'openclaw/niagareporter', name: 'NiagaReporterBot', provider: 'openclaw', category: 'reporting' },
  { id: 'openclaw/niagaaggregator', name: 'NiagaAggregatorBot', provider: 'openclaw', category: 'aggregation' },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function normalizeGatewayUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function resolveGatewayUrl(): string {
  const publicGatewayUrl = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL?.trim()

  if (typeof window !== 'undefined') {
    return publicGatewayUrl || DEFAULT_OPENCLAW_GATEWAY
  }

  return process.env.OPENCLAW_GATEWAY_URL?.trim() || publicGatewayUrl || DEFAULT_OPENCLAW_GATEWAY
}

function resolveGatewayToken(): string {
  if (typeof window !== 'undefined') {
    return ''
  }

  return process.env.OPENCLAW_GATEWAY_TOKEN?.trim() || ''
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

function inferModelName(modelId: string): string {
  const slug = modelId.includes('/') ? modelId.split('/').pop() || modelId : modelId
  const fallback = FALLBACK_OPENCLAW_MODELS.find((model) => model.id === modelId || model.id.endsWith(`/${slug}`))
  if (fallback) {
    return fallback.name
  }

  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

function inferModelCategory(modelId: string): string {
  const slug = modelId.includes('/') ? modelId.split('/').pop() || modelId : modelId
  const fallback = FALLBACK_OPENCLAW_MODELS.find((model) => model.id === modelId || model.id.endsWith(`/${slug}`))
  return fallback?.category || 'general'
}

function mapModel(rawModel: unknown): OpenClawModel | null {
  if (!isRecord(rawModel)) {
    return null
  }

  const rawId = typeof rawModel.id === 'string'
    ? rawModel.id
    : typeof rawModel.name === 'string'
      ? rawModel.name
      : null

  if (!rawId) {
    return null
  }

  const provider = typeof rawModel.provider === 'string'
    ? rawModel.provider
    : rawId.includes('/')
      ? rawId.split('/')[0] || 'openclaw'
      : 'openclaw'

  return {
    id: rawId,
    name: typeof rawModel.name === 'string' ? rawModel.name : inferModelName(rawId),
    provider,
    category: typeof rawModel.category === 'string' ? rawModel.category : inferModelCategory(rawId),
  }
}

function extractChoiceContent(choice: unknown): string | null {
  if (!isRecord(choice)) {
    return null
  }

  const message = choice.message
  if (isRecord(message) && typeof message.content === 'string') {
    return message.content
  }

  return null
}

export function extractMessageContent(data: unknown): string {
  if (typeof data === 'string') {
    return data
  }

  if (!isRecord(data)) {
    return safeStringify(data)
  }

  if (typeof data.response === 'string') {
    return data.response
  }

  if (typeof data.output === 'string') {
    return data.output
  }

  if (typeof data.text === 'string') {
    return data.text
  }

  if (Array.isArray(data.choices)) {
    const firstContent = extractChoiceContent(data.choices[0])
    if (firstContent) {
      return firstContent
    }
  }

  if (isRecord(data.payload)) {
    return extractMessageContent(data.payload)
  }

  if (isRecord(data.result)) {
    return extractMessageContent(data.result)
  }

  return safeStringify(data)
}


export function getGatewayState(): GatewayState {
  return gatewayState
}

export function getGatewayUrl(): string {
  return OPENCLAW_GATEWAY
}

export function getGatewayWsUrl(): string {
  const gatewayUrl = new URL(OPENCLAW_GATEWAY)
  gatewayUrl.protocol = gatewayUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  return gatewayUrl.toString()
}

export function setGatewayWsConnected(connected: boolean) {
  gatewayState.wsConnected = connected
}

export async function gatewayFetch(
  path: string,
  options: RequestInit = {},
  meta: GatewayFetchMeta = {}
): Promise<Response> {
  if (gatewayState.breakerOpenUntil && Date.now() < gatewayState.breakerOpenUntil) {
    throw new Error('Circuit breaker open. Gateway is temporarily unavailable.')
  }

  const url = `${normalizeGatewayUrl(OPENCLAW_GATEWAY)}${normalizePath(path)}`
  const headers = new Headers(options.headers)

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (OPENCLAW_API_KEY && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${OPENCLAW_API_KEY}`)
  }

  if (meta.sessionKey) {
    headers.set('x-openclaw-session-key', meta.sessionKey)
  }

  if (meta.model) {
    headers.set('x-openclaw-model', meta.model)
  }

  let attempt = 0
  const maxRetries = 2

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || AbortSignal.timeout(GATEWAY_TIMEOUT),
        cache: 'no-store',
      })

      if (response.ok) {
        gatewayState.isHealthy = true
        gatewayState.consecutiveFailures = 0
        gatewayState.lastError = null
        gatewayState.breakerOpenUntil = null
      }

      return response
    } catch (error) {
      attempt += 1

      if (attempt > maxRetries) {
        gatewayState.consecutiveFailures += 1
        gatewayState.lastError = toErrorMessage(error)

        if (gatewayState.consecutiveFailures >= 5) {
          gatewayState.isHealthy = false
          gatewayState.breakerOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS
          console.warn('[OpenClaw] Circuit breaker opened after repeated gateway failures')
        }

        throw error
      }

      await sleep(attempt === 1 ? 1_000 : 2_000)
    }
  }

  throw new Error('Gateway request failed after retries')
}

export async function checkOpenClawHealth(): Promise<OpenClawHealthStatus> {
  const start = Date.now()

  try {
    const response = await gatewayFetch('/health', {
      signal: AbortSignal.timeout(5_000),
    })
    const latencyMs = Date.now() - start

    if (!response.ok) {
      return {
        status: 'degraded',
        gateway: OPENCLAW_GATEWAY,
        timestamp: new Date().toISOString(),
        latencyMs,
      }
    }

    const payload = await readJson<GatewayHealthPayload>(response)

    return {
      status: 'healthy',
      gateway: OPENCLAW_GATEWAY,
      uptime: payload?.uptime || payload?.server?.uptime,
      version: payload?.version || payload?.server?.version,
      timestamp: new Date().toISOString(),
      latencyMs,
    }
  } catch {
    return {
      status: 'unhealthy',
      gateway: OPENCLAW_GATEWAY,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    }
  }
}

export async function openClawCompletion(request: OpenClawCompletionRequest): Promise<unknown> {
  const model = request.model || DEFAULT_OPENCLAW_MODEL

  const response = await gatewayFetch('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      thinking: request.thinking,
    }),
  }, {
    model,
    sessionKey: request.sessionKey,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`OpenClaw gateway error (${response.status}): ${errorText}`)
  }

  const data = await readJson<Record<string, unknown>>(response)
  return {
    ...(data || {}),
    _source: 'gateway',
  }
}

function parseSseBlock(block: string): string[] {
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice(6))
}

function extractStreamDelta(payload: unknown): string {
  if (!isRecord(payload)) {
    return ''
  }

  const choices = payload.choices
  if (!Array.isArray(choices) || !isRecord(choices[0])) {
    return ''
  }

  const delta = choices[0].delta
  return isRecord(delta) && typeof delta.content === 'string' ? delta.content : ''
}

export async function streamOpenClawCompletion(
  request: OpenClawCompletionRequest,
  onChunk: (chunk: string) => void
): Promise<string> {
  const model = request.model || DEFAULT_OPENCLAW_MODEL

  try {
    const response = await gatewayFetch('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        thinking: request.thinking,
        stream: true,
      }),
    }, {
      model,
      sessionKey: request.sessionKey,
    })

    if (!response.ok || !response.body) {
      const fallback = await openClawCompletion(request)
      const content = extractMessageContent(fallback)
      onChunk(content)
      return content
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() || ''

      for (const block of blocks) {
        for (const line of parseSseBlock(block)) {
          if (line === '[DONE]') {
            continue
          }

          try {
            const delta = extractStreamDelta(JSON.parse(line) as unknown)
            if (delta) {
              fullText += delta
              onChunk(delta)
            }
          } catch {
            // Ignore malformed stream chunks.
          }
        }
      }
    }

    if (buffer.trim()) {
      for (const line of parseSseBlock(buffer)) {
        if (line === '[DONE]') {
          continue
        }

        try {
          const delta = extractStreamDelta(JSON.parse(line) as unknown)
          if (delta) {
            fullText += delta
            onChunk(delta)
          }
        } catch {
          // Ignore malformed trailing chunk.
        }
      }
    }

    return fullText
  } catch {
    const fallback = await openClawCompletion(request)
    const content = extractMessageContent(fallback)
    onChunk(content)
    return content
  }
}

export async function getOpenClawModels(): Promise<OpenClawModel[]> {
  try {
    const response = await gatewayFetch('/v1/models')
    if (response.ok) {
      const payload = await readJson<GatewayModelsPayload>(response)
      const rawModels = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.models)
          ? payload.models
          : []

      const models = rawModels
        .map((rawModel) => mapModel(rawModel))
        .filter((model): model is OpenClawModel => Boolean(model))

      if (models.length > 0) {
        return models
      }
    }
  } catch {
    // Fall back to the known agent catalog when the gateway is unreachable.
  }

  return FALLBACK_OPENCLAW_MODELS
}

export async function getSDK(): Promise<OpenClawSDK> {
  return {
    functions: {
      async invoke(name: string, args: Record<string, unknown> = {}) {
        const payloadArgs = { ...args }
        const action = typeof payloadArgs.action === 'string' ? payloadArgs.action : undefined
        const sessionKey = typeof payloadArgs.sessionKey === 'string' ? payloadArgs.sessionKey : undefined

        if ('action' in payloadArgs) {
          delete payloadArgs.action
        }

        if ('sessionKey' in payloadArgs) {
          delete payloadArgs.sessionKey
        }

        const response = await gatewayFetch('/tools/invoke', {
          method: 'POST',
          body: JSON.stringify({
            tool: name,
            ...(action ? { action } : {}),
            args: payloadArgs,
            ...(sessionKey ? { sessionKey } : {}),
            dryRun: false,
          }),
        }, {
          sessionKey,
        })

        const payload = await readJson<Record<string, unknown>>(response)
        if (!response.ok) {
          throw new Error(`OpenClaw SDK fallback tool invoke failed (${response.status}): ${response.statusText}`)
        }

        return payload?.result ?? payload?.payload ?? payload
      },
    },
    chat: {
      completions: {
        async create(request: OpenClawCompletionRequest & { stream?: boolean }) {
          const completion = await openClawCompletion(request)
          const completionPayload = isRecord(completion) ? completion : {}

          return {
            ...completionPayload,
            choices: [{
              message: {
                content: extractMessageContent(completion),
              },
            }],
            model: request.model || DEFAULT_OPENCLAW_MODEL,
            _source: 'gateway-shim',
          }
        },
      },
    },
    images: {
      generations: {
        async create(request: { prompt: string; size?: string }) {
          const response = await gatewayFetch('/v1/images/generations', {
            method: 'POST',
            body: JSON.stringify(request),
          })

          const payload = await readJson<Record<string, unknown>>(response)
          if (!response.ok) {
            throw new Error(`OpenClaw SDK fallback image generation failed (${response.status}): ${response.statusText}`)
          }

          return payload || { data: [] }
        },
      },
    },
  }
}
