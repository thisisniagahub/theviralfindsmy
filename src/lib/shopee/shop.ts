/**
 * Shopee Shop & Account Helpers — Shop info, health metrics, and performance
 *
 * Uses ShopManager and AccountHealthManager for shop-level analytics.
 */

import { getShopeeSDK } from './client'
import { handleShopeeResponse } from './response-handler'

/** Shop information */
export interface ShopeeShopInfo {
  shopId: number
  shopName: string
  shopDescription: string
  shopLogo: string
  region: string
  status: string
  itemCount: number
  ratingBad: number
  ratingGood: number
  ratingNormal: number
  followerCount: number
}

/** Account health metrics */
export interface ShopeeAccountHealth {
  listingViolations: number
  lateShipmentRate: number
  cancellationRate: number
  returnRefundRate: number
  responseChatRate: number
  overallScore: number
  penaltyPoints: number
}

/**
 * Get shop profile information.
 */
export async function getShopInfo(): Promise<ShopeeShopInfo | null> {
  const sdk = getShopeeSDK()
  if (!sdk) return null

  const result = await handleShopeeResponse('fetch shop info', async () => {
    const response = await sdk.shop.getShopInfo()
    const resp = response as unknown as Record<string, unknown>

    return {
      shopId: (resp?.shop_id as number) ?? 0,
      shopName: (resp?.shop_name as string) ?? '',
      shopDescription: (resp?.description as string) ?? '',
      shopLogo: (resp?.shop_logo as string) ?? '',
      region: (resp?.region as string) ?? '',
      status: (resp?.status as string) ?? '',
      itemCount: (resp?.item_count as number) ?? 0,
      ratingBad: (resp?.rating_bad as number) ?? 0,
      ratingGood: (resp?.rating_good as number) ?? 0,
      ratingNormal: (resp?.rating_normal as number) ?? 0,
      followerCount: (resp?.follower_count as number) ?? 0,
    }
  })

  return result.error ? null : (result.data ?? null)
}

/**
 * Get account health and performance metrics.
 * Used by NiagaOpsBot for monitoring and NiagaBot for recommendations.
 */
export async function getAccountHealth(): Promise<ShopeeAccountHealth | null> {
  const sdk = getShopeeSDK()
  if (!sdk) return null

  const result = await handleShopeeResponse('fetch account health', async () => {
    const response = await sdk.accountHealth.getShopPerformance()
    const resp = response as unknown as Record<string, unknown>
    const metrics = (resp?.performance as Record<string, unknown>) ?? {}

    return {
      listingViolations: (metrics?.listing_violations as number) ?? 0,
      lateShipmentRate: (metrics?.late_shipment_rate as number) ?? 0,
      cancellationRate: (metrics?.cancellation_rate as number) ?? 0,
      returnRefundRate: (metrics?.return_refund_rate as number) ?? 0,
      responseChatRate: (metrics?.response_chat_rate as number) ?? 0,
      overallScore: (metrics?.overall_performance as number) ?? 0,
      penaltyPoints: (metrics?.penalty_points as number) ?? 0,
    }
  })

  return result.error ? null : (result.data ?? null)
}
