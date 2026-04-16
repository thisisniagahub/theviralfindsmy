import {
  getGatewayWsUrl,
  getGatewayUrl,
  setGatewayWsConnected,
} from './gateway-client'

type EventCallback = (payload: unknown) => void

interface WsConnectResponsePayload {
  protocol?: number
  policy?: {
    tickIntervalMs?: number
  }
}

interface WsResponseEnvelope {
  type?: string
  id?: string
  ok?: boolean
  payload?: unknown
  error?: unknown
}

interface WsEventEnvelope {
  type?: string
  event?: string
  payload?: unknown
}

export interface WsHealthState {
  enabled: boolean
  connected: boolean
  state: 'disabled' | 'idle' | 'connecting' | 'connected'
  gateway: string
  url: string
  lastError: string | null
  connectedAt: string | null
  lastEventAt: string | null
  tickIntervalMs: number
  reconnectDelayMs: number
  uptimeMs: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (isRecord(error) && typeof error.message === 'string') {
    return error.message
  }

  return String(error)
}

function isGatewayWsEnabled(): boolean {
  const publicFlag = process.env.NEXT_PUBLIC_OPENCLAW_WS_ENABLED

  if (typeof window !== 'undefined') {
    return publicFlag === 'true'
  }

  return (process.env.OPENCLAW_WS_ENABLED || publicFlag || 'false') === 'true'
}

function getGatewayToken(): string {
  if (typeof window !== 'undefined') {
    return ''
  }

  return process.env.OPENCLAW_GATEWAY_TOKEN?.trim() || ''
}

const OPENCLAW_GATEWAY_TOKEN = getGatewayToken()

class GatewayWSClient {
  private readonly enabled = isGatewayWsEnabled()
  private readonly url = getGatewayWsUrl()
  private ws: WebSocket | null = null
  private state: WsHealthState['state'] = this.enabled ? 'idle' : 'disabled'
  private connectPromise: Promise<void> | null = null
  private connectRequestId: string | null = null
  private requestCounter = 0
  private reconnectDelayMs = 1_000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private pending = new Map<string, {
    resolve: (value: unknown) => void
    reject: (reason?: unknown) => void
    timeout: ReturnType<typeof setTimeout>
  }>()
  private eventHandlers = new Map<string, Set<EventCallback>>()
  private presenceCache: unknown = null
  private healthCache: unknown = null
  private lastError: string | null = null
  private tickIntervalMs = 15_000
  private connectedAtMs: number | null = null
  private lastEventAtMs: number | null = null

  async ensureConnected(): Promise<boolean> {
    if (!this.enabled) {
      return false
    }

    if (typeof WebSocket === 'undefined') {
      this.lastError = 'WebSocket is not available in this runtime.'
      return false
    }

    if (this.ws?.readyState === WebSocket.OPEN && this.state === 'connected') {
      return true
    }

    if (this.connectPromise) {
      try {
        await this.connectPromise
        return this.state === 'connected'
      } catch {
        return false
      }
    }

    this.state = 'connecting'
    this.connectRequestId = this.nextId('connect')

    this.connectPromise = new Promise<void>((resolve, reject) => {
      try {
        const socket = new WebSocket(this.url)
        this.ws = socket
        let resolved = false

        socket.addEventListener('message', (event) => {
          this.handleIncomingMessage(event.data)

          if (this.state === 'connected' && !resolved) {
            resolved = true
            resolve()
          }
        })

        socket.addEventListener('error', () => {
          this.lastError = 'OpenClaw WebSocket connection failed.'
        })

        socket.addEventListener('close', (event) => {
          this.state = this.enabled ? 'idle' : 'disabled'
          this.connectedAtMs = null
          this.stopHeartbeat()
          setGatewayWsConnected(false)
          this.ws = null
          this.rejectPending(`Gateway WS closed (${event.code})`)

          if (!resolved) {
            reject(new Error(this.lastError || `Gateway WS closed (${event.code})`))
          }

          this.connectPromise = null
          this.connectRequestId = null

          if (this.enabled) {
            this.scheduleReconnect()
          }
        })
      } catch (error) {
        this.lastError = toErrorMessage(error)
        this.connectPromise = null
        this.state = this.enabled ? 'idle' : 'disabled'
        reject(error)
      }
    })

    try {
      await this.connectPromise
      return true
    } catch {
      return false
    }
  }

  async rpc<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const connected = await this.ensureConnected()
    if (!connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error(this.lastError || 'OpenClaw WebSocket is not connected.')
    }

    const id = this.nextId(method.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'rpc')

    const responsePromise = new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Gateway WS RPC timed out for ${method}`))
      }, 15_000)

      this.pending.set(id, {
        resolve: (payload) => resolve(payload as T),
        reject,
        timeout,
      })
    })

    this.ws.send(JSON.stringify({
      type: 'req',
      id,
      method,
      params,
    }))

    return responsePromise
  }

  onEvent(eventName: string, callback: EventCallback): () => void {
    const callbacks = this.eventHandlers.get(eventName) || new Set<EventCallback>()
    callbacks.add(callback)
    this.eventHandlers.set(eventName, callbacks)

    return () => {
      const existing = this.eventHandlers.get(eventName)
      if (!existing) {
        return
      }

      existing.delete(callback)
      if (existing.size === 0) {
        this.eventHandlers.delete(eventName)
      }
    }
  }

  async getPresence(): Promise<unknown> {
    if (this.presenceCache) {
      return this.presenceCache
    }

    try {
      const presence = await this.rpc('system-presence')
      this.presenceCache = presence
      return presence
    } catch {
      return this.presenceCache || { devices: [] }
    }
  }

  getWsHealth(): WsHealthState {
    const connected = this.state === 'connected'

    return {
      enabled: this.enabled,
      connected,
      state: this.state,
      gateway: getGatewayUrl(),
      url: this.url,
      lastError: this.lastError,
      connectedAt: this.connectedAtMs ? new Date(this.connectedAtMs).toISOString() : null,
      lastEventAt: this.lastEventAtMs ? new Date(this.lastEventAtMs).toISOString() : null,
      tickIntervalMs: this.tickIntervalMs,
      reconnectDelayMs: this.reconnectDelayMs,
      uptimeMs: connected && this.connectedAtMs ? Date.now() - this.connectedAtMs : 0,
    }
  }

  private handleIncomingMessage(rawData: unknown) {
    const parsed = this.parsePayload(rawData)
    if (!parsed || !isRecord(parsed) || typeof parsed.type !== 'string') {
      return
    }

    this.lastEventAtMs = Date.now()

    if (parsed.type === 'event') {
      this.handleEvent(parsed as WsEventEnvelope)
      return
    }

    if (parsed.type === 'res') {
      this.handleResponse(parsed as WsResponseEnvelope)
    }
  }

  private handleEvent(envelope: WsEventEnvelope) {
    if (!envelope.event) {
      return
    }

    if (envelope.event === 'connect.challenge') {
      this.sendConnectRequest()
      return
    }

    if (envelope.event === 'presence') {
      this.presenceCache = envelope.payload
    }

    if (envelope.event === 'health' || envelope.event === 'heartbeat') {
      this.healthCache = envelope.payload
    }

    const callbacks = this.eventHandlers.get(envelope.event)
    if (callbacks) {
      for (const callback of callbacks) {
        callback(envelope.payload)
      }
    }
  }

  private handleResponse(envelope: WsResponseEnvelope) {
    if (envelope.id && envelope.id === this.connectRequestId) {
      if (!envelope.ok) {
        this.lastError = toErrorMessage(envelope.error)
        return
      }

      const payload = envelope.payload
      const connectPayload = isRecord(payload) ? payload as WsConnectResponsePayload : {}
      const policy = isRecord(connectPayload.policy) ? connectPayload.policy : {}
      const tickInterval = typeof policy.tickIntervalMs === 'number' ? policy.tickIntervalMs : null

      if (tickInterval) {
        this.tickIntervalMs = tickInterval
      }

      this.lastError = null
      this.state = 'connected'
      this.connectedAtMs = Date.now()
      this.reconnectDelayMs = 1_000
      setGatewayWsConnected(true)
      this.startHeartbeat()
      return
    }

    if (!envelope.id) {
      return
    }

    const pending = this.pending.get(envelope.id)
    if (!pending) {
      return
    }

    clearTimeout(pending.timeout)
    this.pending.delete(envelope.id)

    if (envelope.ok) {
      pending.resolve(envelope.payload)
    } else {
      pending.reject(new Error(toErrorMessage(envelope.error)))
    }
  }

  private sendConnectRequest() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.connectRequestId) {
      return
    }

    this.ws.send(JSON.stringify({
      type: 'req',
      id: this.connectRequestId,
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'theviralfinds',
          version: '8.0.0',
          platform: 'web',
          mode: 'operator',
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.write'],
        auth: OPENCLAW_GATEWAY_TOKEN ? { token: OPENCLAW_GATEWAY_TOKEN } : {},
        locale: 'ms-MY',
        userAgent: 'theviralfinds/8.0.0',
      },
    }))
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    const intervalMs = Math.max(this.tickIntervalMs, 5_000)

    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return
      }

      void this.rpc('health')
        .then((health) => {
          this.healthCache = health
        })
        .catch((error) => {
          this.lastError = toErrorMessage(error)
        })
    }, intervalMs)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private rejectPending(message: string) {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timeout)
      pending.reject(new Error(message))
      this.pending.delete(id)
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return
    }

    const delayMs = this.reconnectDelayMs
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 8_000)
      void this.ensureConnected()
    }, delayMs)
  }

  private nextId(prefix: string): string {
    this.requestCounter += 1
    return `${prefix}-${Date.now()}-${this.requestCounter}`
  }

  private parsePayload(rawData: unknown): unknown {
    if (typeof rawData === 'string') {
      try {
        return JSON.parse(rawData) as unknown
      } catch {
        return null
      }
    }

    return null
  }
}

// Lazy initialization - don't connect on import
let wsInstance: GatewayWSClient | null = null

export function getGatewayWS() {
  if (!wsInstance) {
    wsInstance = new GatewayWSClient()
  }
  return wsInstance
}

export async function getPresence() {
  return getGatewayWS().getPresence()
}

export function getWsHealth() {
  return getGatewayWS().getWsHealth()
}
