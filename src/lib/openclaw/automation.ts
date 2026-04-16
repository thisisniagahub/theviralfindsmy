import { env } from '@/lib/env'
import { gatewayFetch, getGatewayUrl } from './gateway-client'
import { invokeGatewayTool } from './tools'

export interface AgentHookOptions {
  message: string
  name?: string
  agentId?: string
  model?: string
  thinking?: string
  wakeMode?: 'now' | 'next-heartbeat'
  deliver?: boolean
  channel?: string
  to?: string
}

const KNOWN_WEBHOOK_ROUTES = [
  {
    id: 'shopee-lead',
    path: '/webhook/shopee',
    sessionKey: 'shopee-automation',
    description: 'Inbound leads from Shopee Affiliate system',
  },
]

function normalizeHooksBasePath(path: string): string {
  if (!path) {
    return '/hooks'
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path.replace(/\/$/, '')
  }

  return path.startsWith('/') ? path : `/${path}`
}

function resolveHooksPath(path: string): string {
  const hooksBasePath = normalizeHooksBasePath(env.OPENCLAW_HOOKS_PATH)
  if (hooksBasePath.startsWith('http://') || hooksBasePath.startsWith('https://')) {
    const url = new URL(hooksBasePath)
    url.pathname = `${url.pathname.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
    return url.toString()
  }

  return `${hooksBasePath}${path.startsWith('/') ? path : `/${path}`}`
}

async function invokeHook(path: string, payload: Record<string, unknown>) {
  const response = await gatewayFetch(resolveHooksPath(path), {
    method: 'POST',
    body: JSON.stringify(payload),
  }, {
    sessionKey: typeof payload.sessionKey === 'string' ? payload.sessionKey : undefined,
  })

  return response.json()
}

export async function triggerWakeHook(text: string, mode: 'now' | 'next-heartbeat' = 'now') {
  return invokeHook('/wake', { text, mode })
}

export async function triggerAgentHook(options: AgentHookOptions) {
  return invokeHook('/agent', options as unknown as Record<string, unknown>)
}

export async function listCronJobs() {
  return invokeGatewayTool('cron', { action: 'list' }, 'main')
}

export async function addCronJob(options: {
  name: string
  schedule: string
  message: string
  session?: 'main' | 'isolated'
  tz?: string
  announce?: boolean
}) {
  return invokeGatewayTool('cron', {
    action: 'add',
    ...options,
    session: options.session || 'main',
    tz: options.tz || 'Asia/Kuala_Lumpur',
    announce: options.announce ?? false,
  }, 'main')
}

export async function removeCronJob(jobId: string) {
  return invokeGatewayTool('cron', {
    action: 'remove',
    id: jobId,
  }, 'main')
}

export function getWebhookRoutes() {
  return KNOWN_WEBHOOK_ROUTES
}

export function getHooksBaseUrl() {
  const hooksBasePath = normalizeHooksBasePath(env.OPENCLAW_HOOKS_PATH)
  if (hooksBasePath.startsWith('http://') || hooksBasePath.startsWith('https://')) {
    return hooksBasePath
  }

  return `${getGatewayUrl()}${hooksBasePath}`
}
