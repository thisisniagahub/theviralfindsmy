/**
 * Shopee Shipping Helpers — Logistics and tracking from Shopee Open API
 *
 * Uses LogisticsManager for shipping channels, tracking, and delivery status.
 */

import { getShopeeSDK } from './client'
import { handleShopeeResponse } from './response-handler'

/** Shipping channel info */
export interface ShopeeShippingChannel {
  channelId: number
  channelName: string
  enabled: boolean
  preferred: boolean
  codSupported: boolean
}

/** Tracking info for an order */
export interface ShopeeTrackingInfo {
  orderSn: string
  trackingNumber: string
  logisticsStatus: string
  logisticsChannel: string
  estimatedDelivery: string
  lastUpdate: number
  history: ShopeeTrackingEvent[]
}

/** A single tracking event */
export interface ShopeeTrackingEvent {
  time: number
  description: string
  status: string
}

/**
 * Get available shipping channels for the shop.
 */
export async function getShippingChannels(): Promise<ShopeeShippingChannel[]> {
  const sdk = getShopeeSDK()
  if (!sdk) return []

  const result = await handleShopeeResponse('fetch shipping channels', async () => {
    const response = await sdk.logistics.getChannelList()
    const resp = response as unknown as Record<string, unknown>
    const channels = (resp?.logistics_channel_list as Array<Record<string, unknown>>) ?? []

    return channels.map((ch) => ({
      channelId: (ch.logistics_channel_id as number) ?? 0,
      channelName: (ch.logistics_channel_name as string) ?? '',
      enabled: (ch.enabled as boolean) ?? false,
      preferred: (ch.preferred as boolean) ?? false,
      codSupported: (ch.cod_enabled as boolean) ?? false,
    }))
  })

  return result.error ? [] : (result.data ?? [])
}

/**
 * Get tracking info for an order.
 */
export async function getTrackingInfo(orderSn: string): Promise<ShopeeTrackingInfo | null> {
  const sdk = getShopeeSDK()
  if (!sdk) return null

  const result = await handleShopeeResponse('fetch tracking info', async () => {
    const response = await sdk.logistics.getTrackingInfo({
      order_sn: orderSn,
    })

    const resp = response as unknown as Record<string, unknown>
    const trackingList = (resp?.tracking_info as Array<Record<string, unknown>>) ?? []

    return {
      orderSn,
      trackingNumber: (resp?.tracking_number as string) ?? '',
      logisticsStatus: (resp?.logistics_status as string) ?? '',
      logisticsChannel: (resp?.logistics_channel_name as string) ?? '',
      estimatedDelivery: (resp?.estimated_delivery_date as string) ?? '',
      lastUpdate: Date.now(),
      history: trackingList.map((event) => ({
        time: (event.ctime as number) ?? 0,
        description: (event.description as string) ?? '',
        status: (event.status as string) ?? '',
      })),
    }
  })

  return result.error ? null : result.data
}

/**
 * Get shipping parameter for an order (required before shipping).
 */
export async function getShippingParameter(orderSn: string) {
  const sdk = getShopeeSDK()
  if (!sdk) return null

  const result = await handleShopeeResponse('fetch shipping parameter', async () => {
    return await sdk.logistics.getShippingParameter({ order_sn: orderSn })
  })

  return result.error ? null : result.data
}
