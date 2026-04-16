// Centralized service URL configuration (T2.6)
// Keep the resolved URL for callers, but expose whether it came from env or fallback.

type ResolvedServiceUrl = {
  url: string
  configured: boolean
  source: 'env' | 'default'
}

function resolveServiceUrl(envValue: string | undefined, fallback: string): ResolvedServiceUrl {
  const normalized = envValue?.trim()

  if (normalized) {
    return {
      url: normalized,
      configured: true,
      source: 'env',
    }
  }

  return {
    url: fallback,
    configured: false,
    source: 'default',
  }
}

const resolvedServiceUrls = {
  shopeeApi: resolveServiceUrl(process.env.SHOPEE_API_URL, 'https://partner.shopeemobile.com'),
  shopeeAffiliate: resolveServiceUrl(process.env.SHOPEE_AFFILIATE_URL, 'https://affiliate.shopee.com.my'),
  openClawGateway: resolveServiceUrl(process.env.OPENCLAW_GATEWAY_URL, 'https://operator.gangniaga.my'),
  notificationService: resolveServiceUrl(process.env.NOTIFICATION_SERVICE_URL, 'http://127.0.0.1:3004'),
} as const

export const serviceUrls = {
  shopeeApi: resolvedServiceUrls.shopeeApi.url,
  shopeeAffiliate: resolvedServiceUrls.shopeeAffiliate.url,
  openClawGateway: resolvedServiceUrls.openClawGateway.url,
  notificationService: resolvedServiceUrls.notificationService.url,
} as const

export const serviceUrlState = resolvedServiceUrls

export type ServiceKey = keyof typeof serviceUrls

export function getServiceUrl(service: ServiceKey): string {
  return serviceUrls[service]
}

export function isServiceConfiguredByKey(service: ServiceKey): boolean {
  return serviceUrlState[service].configured
}

/**
 * Backward-compatible alias for existing consumers.
 * Maps the new structure to the old naming convention.
 * NOTE: mcp and a2a now point to the OpenClaw Gateway.
 */
export const SERVICE_URLS = {
  mcp: serviceUrls.openClawGateway,
  a2a: serviceUrls.openClawGateway,
  notification: process.env.NEXT_PUBLIC_NOTIFICATION_URL || '',
} as const

/**
 * Extract port number from a service URL for client-side Socket.IO connections.
 * e.g. 'http://127.0.0.1:3004' → '3004'
 */
export function getServicePort(service: ServiceKey): string | null {
  const url = serviceUrls[service]
  const match = url.match(/:(\d+)(?:\/|$)/)
  return match ? match[1] : null
}

/**
 * Get the database service URL.
 * Returns env var if set, otherwise defaults to localhost:3005.
 */
export function getDbServiceUrl(): string {
  return process.env.DB_SERVICE_URL?.trim() || 'http://127.0.0.1:3005'
}

/**
 * Get the notification service URL.
 * Returns env var if set, otherwise defaults to localhost:3004.
 */
export function getNotificationServiceUrl(): string {
  return process.env.NOTIFICATION_SERVICE_URL?.trim() || 'http://127.0.0.1:3004'
}

/**
 * Check if a mini-service is configured via environment variables.
 * Supports 'db' and 'notification' types.
 */
export function isMiniServiceConfigured(type: 'db' | 'notification'): boolean {
  return type === 'db'
    ? Boolean(process.env.DB_SERVICE_URL?.trim())
    : Boolean(process.env.NOTIFICATION_SERVICE_URL?.trim())
}

// Backward-compatible alias for test consumers
export { isMiniServiceConfigured as isServiceConfigured }
