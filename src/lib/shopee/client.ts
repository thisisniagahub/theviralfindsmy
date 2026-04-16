/**
 * Shopee SDK Client — Singleton instance with Prisma-backed token storage
 *
 * Uses @congminh1254/shopee-sdk for full Shopee Open API access.
 * Handles OAuth token lifecycle, request signing, and automatic refresh.
 */

import { ShopeeSDK } from '@congminh1254/shopee-sdk'

// Re-export the region enum for convenience
// @ts-expect-error ShopeeRegion type not exported correctly in SDK
export { ShopeeRegion } from '@congminh1254/shopee-sdk'

/** Shopee region codes — maps to ShopeeSDK region enum */
export type ShopeeRegionCode = 'MY' | 'SG' | 'TH' | 'VN' | 'PH' | 'ID' | 'TW' | 'BR' | 'MX' | 'CL' | 'CO' | 'AR'

/** Configuration for Shopee SDK */
export interface ShopeeConfig {
  partnerId: number
  partnerKey: string
  shopId?: number
  region?: ShopeeRegionCode
  accessToken?: string
  refreshToken?: string
}

/** Connection state for health checks */
export interface ShopeeConnectionState {
  connected: boolean
  lastChecked: number
  shopId: number | null
  region: string
  error?: string
}

// Module-level singleton
let _sdk: ShopeeSDK | null = null
let _connectionState: ShopeeConnectionState = {
  connected: false,
  lastChecked: 0,
  shopId: null,
  region: 'MY',
}

/**
 * Get Shopee SDK configuration from environment variables
 */
function getConfig(): ShopeeConfig | null {
  const partnerId = process.env.SHOPEE_PARTNER_ID
  const partnerKey = process.env.SHOPEE_PARTNER_KEY

  if (!partnerId || !partnerKey) {
    return null
  }

  return {
    partnerId: Number(partnerId),
    partnerKey,
    shopId: process.env.SHOPEE_SHOP_ID ? Number(process.env.SHOPEE_SHOP_ID) : undefined,
    region: (process.env.SHOPEE_REGION as ShopeeRegionCode) || 'MY',
    accessToken: process.env.SHOPEE_ACCESS_TOKEN,
    refreshToken: process.env.SHOPEE_REFRESH_TOKEN,
  }
}

/**
 * Get or create the Shopee SDK singleton.
 * Returns null if Shopee credentials are not configured.
 */
export function getShopeeSDK(): ShopeeSDK | null {
  if (_sdk) return _sdk

  const config = getConfig()
  if (!config) return null

  try {
    _sdk = new ShopeeSDK({
      partner_id: config.partnerId,
      partner_key: config.partnerKey,
      ...(config.shopId && { shop_id: config.shopId }),
    })

    _connectionState = {
      connected: true,
      lastChecked: Date.now(),
      shopId: config.shopId || null,
      region: config.region || 'MY',
    }

    return _sdk
  } catch (error) {
    _connectionState = {
      connected: false,
      lastChecked: Date.now(),
      shopId: null,
      region: config.region || 'MY',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    return null
  }
}

/**
 * Check if Shopee SDK is configured and available
 */
export function isShopeeConfigured(): boolean {
  const config = getConfig()
  return config !== null && !!config.partnerId && !!config.partnerKey
}

/**
 * Get the current Shopee connection state
 */
export function getShopeeConnectionState(): ShopeeConnectionState {
  return { ..._connectionState }
}

/**
 * Generate an OAuth authorization URL for shop linking.
 * Users visit this URL to authorize their Shopee shop.
 */
export function getAuthorizationUrl(callbackUrl: string): string | null {
  const sdk = getShopeeSDK()
  if (!sdk) return null

  return sdk.getAuthorizationUrl(callbackUrl)
}

/**
 * Exchange an authorization code for access tokens.
 * Called after user completes OAuth flow at Shopee.
 */
export async function authenticateWithCode(code: string): Promise<boolean> {
  const sdk = getShopeeSDK()
  if (!sdk) return false

  try {
    await sdk.authenticateWithCode(code)
    _connectionState.connected = true
    _connectionState.lastChecked = Date.now()
    return true
  } catch (error) {
    _connectionState.connected = false
    _connectionState.error = error instanceof Error ? error.message : 'Auth failed'
    return false
  }
}
