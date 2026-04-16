/**
 * Shopee AMS Client — Low-level HTTP client with HMAC-SHA256 signing
 *
 * Handles direct API calls to Shopee Open Platform V2.0 endpoints
 * that aren't covered by the @congminh1254/shopee-sdk (e.g., AMS).
 *
 * Signing formula: sign = HMAC-SHA256(partner_key, partner_id + api_path + timestamp + access_token + shop_id)
 * Base URL: https://partner.shopeemobile.com
 */

import { createHmac } from 'crypto'

/** Shopee API region base URLs */
const BASE_URLS: Record<string, string> = {
  GLOBAL: 'https://partner.shopeemobile.com',
  CN: 'https://openplatform.shopee.cn',
  BR: 'https://openplatform.shopee.com.br',
  SANDBOX: 'https://openplatform.sandbox.test-stable.shopee.sg',
}

/** Configuration for direct Shopee API calls */
interface ShopeeApiConfig {
  partnerId: number
  partnerKey: string
  shopId: number
  accessToken: string
  useSandbox?: boolean
}

/**
 * Generate HMAC-SHA256 signature for Shopee V2.0 API
 *
 * Base string for Shop API: partner_id + api_path + timestamp + access_token + shop_id
 */
function generateSignature(
  partnerKey: string,
  partnerId: number,
  apiPath: string,
  timestamp: number,
  accessToken: string,
  shopId: number,
): string {
  const baseString = `${partnerId}${apiPath}${timestamp}${accessToken}${shopId}`
  return createHmac('sha256', partnerKey).update(baseString).digest('hex')
}

/**
 * Get API config from environment variables.
 * Returns null if required credentials are missing.
 */
function getApiConfig(): ShopeeApiConfig | null {
  const partnerId = process.env.SHOPEE_PARTNER_ID
  const partnerKey = process.env.SHOPEE_PARTNER_KEY
  const shopId = process.env.SHOPEE_SHOP_ID
  const accessToken = process.env.SHOPEE_ACCESS_TOKEN

  if (!partnerId || !partnerKey || !shopId || !accessToken) {
    return null
  }

  return {
    partnerId: Number(partnerId),
    partnerKey,
    shopId: Number(shopId),
    accessToken,
    useSandbox: process.env.SHOPEE_USE_SANDBOX === 'true',
  }
}

/**
 * Make a signed GET request to Shopee V2.0 API.
 */
export async function shopeeGet<T = Record<string, unknown>>(
  apiPath: string,
  params: Record<string, string | number> = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  const config = getApiConfig()
  if (!config) {
    return { success: false, error: 'Shopee API credentials not configured (need SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_SHOP_ID, SHOPEE_ACCESS_TOKEN)' }
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const sign = generateSignature(
    config.partnerKey,
    config.partnerId,
    apiPath,
    timestamp,
    config.accessToken,
    config.shopId,
  )

  const baseUrl = config.useSandbox ? BASE_URLS.SANDBOX : BASE_URLS.GLOBAL
  const url = new URL(apiPath, baseUrl)

  // Auth query parameters
  url.searchParams.set('partner_id', String(config.partnerId))
  url.searchParams.set('timestamp', String(timestamp))
  url.searchParams.set('sign', sign)
  url.searchParams.set('access_token', config.accessToken)
  url.searchParams.set('shop_id', String(config.shopId))

  // Additional query parameters
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const json = await response.json() as Record<string, unknown>

    // Shopee V2 error format: { error: "error.code", message: "..." }
    if (json.error && json.error !== '') {
      return { success: false, error: `${json.error}: ${json.message || 'Unknown error'}` }
    }

    return { success: true, data: (json.response ?? json) as T }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

/**
 * Make a signed POST request to Shopee V2.0 API.
 */
export async function shopeePost<T = Record<string, unknown>>(
  apiPath: string,
  body: Record<string, unknown> = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  const config = getApiConfig()
  if (!config) {
    return { success: false, error: 'Shopee API credentials not configured' }
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const sign = generateSignature(
    config.partnerKey,
    config.partnerId,
    apiPath,
    timestamp,
    config.accessToken,
    config.shopId,
  )

  const baseUrl = config.useSandbox ? BASE_URLS.SANDBOX : BASE_URLS.GLOBAL
  const url = new URL(apiPath, baseUrl)

  url.searchParams.set('partner_id', String(config.partnerId))
  url.searchParams.set('timestamp', String(timestamp))
  url.searchParams.set('sign', sign)
  url.searchParams.set('access_token', config.accessToken)
  url.searchParams.set('shop_id', String(config.shopId))

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const json = await response.json() as Record<string, unknown>

    if (json.error && json.error !== '') {
      return { success: false, error: `${json.error}: ${json.message || 'Unknown error'}` }
    }

    return { success: true, data: (json.response ?? json) as T }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

/**
 * Check if AMS API credentials are configured
 */
export function isAmsConfigured(): boolean {
  return getApiConfig() !== null
}
