// Centralized service URL configuration (T2.6)
// All external service endpoints in one place, configurable via environment variables.
// Updated: MCP and A2A now route through OpenClaw Gateway instead of localhost servers.

export const serviceUrls = {
  shopeeApi: process.env.SHOPEE_API_URL || 'https://partner.shopeemobile.com',
  shopeeAffiliate: process.env.SHOPEE_AFFILIATE_URL || 'https://affiliate.shopee.com.my',
  openClawGateway: process.env.OPENCLAW_GATEWAY_URL || 'https://operator.gangniaga.my',
  notificationService: process.env.NOTIFICATION_SERVICE_URL || '',
} as const

export type ServiceKey = keyof typeof serviceUrls

export function getServiceUrl(service: ServiceKey): string {
  return serviceUrls[service]
}

export function isServiceConfigured(service: ServiceKey): boolean {
  const url = serviceUrls[service]
  return !url.includes('127.0.0.1') && !url.includes('localhost')
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
