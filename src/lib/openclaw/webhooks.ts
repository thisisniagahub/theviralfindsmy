import { env } from '@/lib/env'
import { gatewayFetch } from './gateway-client'

type SecretRef = {
  source: 'env' | 'file' | 'exec'
  provider?: string
  id: string
}

export interface WebhookRoute {
  id: string
  path: string
  sessionKey: string
  secret: string | SecretRef
  controllerId?: string
  description: string
}

export interface WebhookPluginResponse<T = unknown> {
  ok: boolean
  routeId: string
  code?: string
  error?: string
  result: T
}

export const WEBHOOK_ROUTES: WebhookRoute[] = [
  {
    id: 'shopee-lead',
    path: '/plugins/webhooks/shopee-lead',
    sessionKey: 'agent:niagaresearch:shopee-automation',
    secret: { source: 'env', provider: 'default', id: 'OPENCLAW_WEBHOOK_SECRET' },
    controllerId: 'webhooks/shopee-lead',
    description: 'Inbound Shopee lead automation route',
  },
  {
    id: 'link-health',
    path: '/plugins/webhooks/link-health',
    sessionKey: 'agent:niagaops:link-health',
    secret: { source: 'env', provider: 'default', id: 'OPENCLAW_WEBHOOK_SECRET' },
    controllerId: 'webhooks/link-health',
    description: 'Affiliate link health route',
  },
]

function resolveRoute(routeId: string): WebhookRoute {
  const route = WEBHOOK_ROUTES.find((item) => item.id === routeId)
  if (!route) {
    throw new Error(`Unknown OpenClaw webhook route: ${routeId}`)
  }
  return route
}

function resolveWebhookSecret(secret?: string): string {
  const resolvedSecret = secret || env.OPENCLAW_WEBHOOK_SECRET
  if (!resolvedSecret) {
    throw new Error('OPENCLAW_WEBHOOK_SECRET is required for webhook calls.')
  }
  return resolvedSecret
}

export async function invokeWebhookRoute<T = unknown>(
  routeId: string,
  payload: Record<string, unknown>,
  secret?: string
): Promise<WebhookPluginResponse<T>> {
  const route = resolveRoute(routeId)
  const response = await gatewayFetch(route.path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resolveWebhookSecret(secret)}`,
    },
    body: JSON.stringify(payload),
  }, {
    sessionKey: route.sessionKey,
  })

  const body = await response.json() as WebhookPluginResponse<T>
  if (!response.ok || body.ok === false) {
    throw new Error(body.error || `Webhook route "${routeId}" failed`)
  }

  return body
}

export function generateWebhookConfig(): Record<string, unknown> {
  const routes = Object.fromEntries(
    WEBHOOK_ROUTES.map((route) => [
      route.id,
      {
        path: route.path,
        sessionKey: route.sessionKey,
        secret: route.secret,
        ...(route.controllerId ? { controllerId: route.controllerId } : {}),
        description: route.description,
      },
    ])
  )

  return {
    plugins: {
      entries: {
        webhooks: {
          enabled: true,
          config: {
            routes,
          },
        },
      },
    },
  }
}

export async function triggerWebhookFlow(
  routeId: string,
  goal: string,
  secret?: string
): Promise<unknown> {
  const response = await invokeWebhookRoute(routeId, {
    action: 'create_flow',
    goal,
    status: 'queued',
    notifyPolicy: 'done_only',
  }, secret)

  return response.result
}

