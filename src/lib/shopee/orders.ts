/**
 * Shopee Order Helpers — Real order data from Shopee Open API
 *
 * Uses OrderManager for order tracking, conversion data, and revenue analytics.
 */

import { getShopeeSDK } from './client'
import { handleShopeeResponse } from './response-handler'

/** Simplified order info for dashboard display */
export interface ShopeeOrder {
  orderSn: string
  status: string
  totalAmount: number
  currency: string
  itemCount: number
  buyerUsername: string
  shippingCarrier: string
  trackingNumber: string
  createTime: number
  updateTime: number
  payTime: number
  items: ShopeeOrderItem[]
}

/** Order item detail */
export interface ShopeeOrderItem {
  itemId: number
  itemName: string
  itemSku: string
  modelId: number
  quantity: number
  itemPrice: number
  imageUrl: string
}

/** Time range filter for orders */
export interface OrderTimeRange {
  timeFrom: number
  timeTo: number
  field?: 'create_time' | 'update_time' | 'pay_time'
}

/** Order list options */
export interface OrderListOptions {
  timeRange: OrderTimeRange
  pageSize?: number
  cursor?: string
  status?: 'UNPAID' | 'READY_TO_SHIP' | 'PROCESSED' | 'SHIPPED' | 'COMPLETED' | 'IN_CANCEL' | 'CANCELLED' | 'INVOICE_PENDING'
}

/** Order summary statistics */
export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  completedOrders: number
  cancelledOrders: number
  conversionValue: number
}

/**
 * Get paginated order list from Shopee.
 */
export async function getOrderList(options: OrderListOptions): Promise<{
  orders: ShopeeOrder[]
  hasMore: boolean
  nextCursor: string
}> {
  const sdk = getShopeeSDK()
  if (!sdk) {
    return { orders: [], hasMore: false, nextCursor: '' }
  }

  const result = await handleShopeeResponse('fetch order list', async () => {
    const params = {
      time_range_field: options.timeRange.field || 'create_time',
      time_from: options.timeRange.timeFrom,
      time_to: options.timeRange.timeTo,
      page_size: options.pageSize ?? 50,
      ...(options.cursor && { cursor: options.cursor }),
      ...(options.status && { order_status: options.status }),
    } as any
    const response = await sdk.order.getOrderList(params)

    const resp = response as unknown as Record<string, unknown>
    const orderList = (resp?.order_list as Array<Record<string, unknown>>) ?? []
    const hasMore = (resp?.more as boolean) ?? false
    const nextCursor = (resp?.next_cursor as string) ?? ''

    if (orderList.length === 0) {
      return { orders: [] as ShopeeOrder[], hasMore, nextCursor }
    }

    // Fetch full order details
    const orderSns = orderList.map((o) => o.order_sn as string)
    const detailResponse = await sdk.order.getOrdersDetail({
      order_sn_list: orderSns,
      response_optional_fields: 'buyer_username,item_list,pay_time,shipping_carrier,tracking_no',
    } as any)

    const detailResp = detailResponse as unknown as Record<string, unknown>
    const details = (detailResp?.order_list as Array<Record<string, unknown>>) ?? []

    const orders: ShopeeOrder[] = details.map((order) => {
      const items = (order.item_list as Array<Record<string, unknown>>) ?? []
      return {
        orderSn: (order.order_sn as string) ?? '',
        status: (order.order_status as string) ?? '',
        totalAmount: (order.total_amount as number) ?? 0,
        currency: (order.currency as string) ?? 'MYR',
        itemCount: items.length,
        buyerUsername: (order.buyer_username as string) ?? '',
        shippingCarrier: (order.shipping_carrier as string) ?? '',
        trackingNumber: (order.tracking_no as string) ?? '',
        createTime: (order.create_time as number) ?? 0,
        updateTime: (order.update_time as number) ?? 0,
        payTime: (order.pay_time as number) ?? 0,
        items: items.map((item) => ({
          itemId: (item.item_id as number) ?? 0,
          itemName: (item.item_name as string) ?? '',
          itemSku: (item.item_sku as string) ?? '',
          modelId: (item.model_id as number) ?? 0,
          quantity: (item.model_quantity_purchased as number) ?? 0,
          itemPrice: (item.model_discounted_price as number) ?? 0,
          imageUrl: (item.image_info as Record<string, string>)?.image_url ?? '',
        })),
      }
    })

    return { orders, hasMore, nextCursor }
  })

  if (result.error) {
    return { orders: [], hasMore: false, nextCursor: '' }
  }

  return result.data ?? { orders: [], hasMore: false, nextCursor: '' }
}

/**
 * Get order statistics for a time period.
 * Used by dashboard and NiagaComputerBot for real performance metrics.
 */
export async function getOrderStats(timeRange: OrderTimeRange): Promise<OrderStats> {
  const defaultStats: OrderStats = {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    conversionValue: 0,
  }

  try {
    // Fetch all orders in time range (paginate through all)
    let allOrders: ShopeeOrder[] = []
    let cursor = ''
    let hasMore = true

    while (hasMore) {
      const result = await getOrderList({
        timeRange,
        pageSize: 100,
        cursor: cursor || undefined,
      })

      allOrders = [...allOrders, ...result.orders]
      hasMore = result.hasMore
      cursor = result.nextCursor

      // Safety: max 10 pages (1000 orders)
      if (allOrders.length >= 1000) break
    }

    if (allOrders.length === 0) return defaultStats

    const completedOrders = allOrders.filter((o) => o.status === 'COMPLETED')
    const cancelledOrders = allOrders.filter((o) => o.status === 'CANCELLED')
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    return {
      totalOrders: allOrders.length,
      totalRevenue,
      averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      conversionValue: totalRevenue * 0.05, // Estimated 5% affiliate commission
    }
  } catch (error) {
    console.error('[Shopee] Failed to compute order stats:', error)
    return defaultStats
  }
}
