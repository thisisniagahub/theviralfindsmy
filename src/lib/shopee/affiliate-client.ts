/**
 * Shopee Affiliate Open API — GraphQL Client
 *
 * The Shopee Affiliate program has its OWN API (separate from Shopee Open Platform).
 * It uses GraphQL (not REST) and requires AppID + Secret from the affiliate dashboard.
 *
 * Endpoint: https://open-api.affiliate.shopee.{region}/graphql
 * Auth: SHA256 signature header
 * Docs: https://affiliate.shopee.com.my/open_api/home
 *
 * @see https://graphql.org/code/#graphql-clients
 */

import { createHash } from 'crypto'

/** Region-specific GraphQL endpoints */
const AFFILIATE_ENDPOINTS: Record<string, string> = {
  MY: 'https://open-api.affiliate.shopee.com.my/graphql',
  SG: 'https://open-api.affiliate.shopee.sg/graphql',
  ID: 'https://open-api.affiliate.shopee.co.id/graphql',
  TH: 'https://open-api.affiliate.shopee.co.th/graphql',
  VN: 'https://open-api.affiliate.shopee.vn/graphql',
  PH: 'https://open-api.affiliate.shopee.ph/graphql',
  TW: 'https://open-api.affiliate.shopee.tw/graphql',
  BR: 'https://open-api.affiliate.shopee.com.br/graphql',
}

/** Affiliate API configuration */
interface AffiliateApiConfig {
  appId: string
  secret: string
  region: string
}

/**
 * Generate SHA256 signature for Shopee Affiliate API.
 *
 * Signature = SHA256(appId + timestamp + payload + secret)
 */
function generateAffiliateSignature(
  appId: string,
  secret: string,
  timestamp: number,
  payload: string,
): string {
  const baseString = `${appId}${timestamp}${payload}${secret}`
  return createHash('sha256').update(baseString).digest('hex')
}

/**
 * Get affiliate API config from environment variables.
 */
function getAffiliateConfig(): AffiliateApiConfig | null {
  const appId = process.env.SHOPEE_AFFILIATE_APP_ID
  const secret = process.env.SHOPEE_AFFILIATE_SECRET
  const region = process.env.SHOPEE_REGION ?? 'MY'

  if (!appId || !secret) return null

  return { appId, secret, region }
}

/**
 * Check if affiliate API is configured.
 */
export function isAffiliateConfigured(): boolean {
  return getAffiliateConfig() !== null
}

/**
 * Execute a GraphQL query/mutation against the Shopee Affiliate API.
 */
export async function affiliateGraphQL<T = Record<string, unknown>>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ success: boolean; data?: T; errors?: Array<{ message: string }>; error?: string }> {
  const config = getAffiliateConfig()
  if (!config) {
    return {
      success: false,
      error: 'Shopee Affiliate API not configured (need SHOPEE_AFFILIATE_APP_ID + SHOPEE_AFFILIATE_SECRET)',
    }
  }

  const endpoint = AFFILIATE_ENDPOINTS[config.region]
  if (!endpoint) {
    return { success: false, error: `Unsupported region: ${config.region}` }
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const payload = JSON.stringify({ query, variables: variables ?? {} })

  const signature = generateAffiliateSignature(
    config.appId,
    config.secret,
    timestamp,
    payload,
  )

  const authHeader = `SHA256 Credential=${config.appId},Timestamp=${timestamp},Signature=${signature}`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: payload,
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const json = await response.json() as { data?: T; errors?: Array<{ message: string }> }

    if (json.errors && json.errors.length > 0) {
      return { success: false, errors: json.errors, error: json.errors[0].message }
    }

    return { success: true, data: json.data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'GraphQL request failed',
    }
  }
}

/**
 * Get the GraphQL endpoint URL for the current region.
 */
export function getAffiliateEndpoint(): string | null {
  const config = getAffiliateConfig()
  if (!config) return null
  return AFFILIATE_ENDPOINTS[config.region] ?? null
}
