/**
 * Shopee Promotion Helpers — Manage vouchers, discounts, and flash sales
 *
 * Uses VoucherManager, DiscountManager, and ShopFlashSaleManager
 * for creating and tracking promotions directly from TheViralFinds.
 */

import { getShopeeSDK } from './client'
import { handleShopeeResponse } from './response-handler'

/** Voucher info for display */
export interface ShopeeVoucher {
  voucherId: number
  voucherCode: string
  voucherName: string
  voucherType: 'SHOP' | 'PRODUCT'
  rewardType: 'DISCOUNT' | 'FIX_PRICE' | 'FREE_SHIPPING'
  usageQuantity: number
  currentUsage: number
  startTime: number
  endTime: number
  discountAmount: number
  status: string
}

/** Discount campaign info */
export interface ShopeeDiscount {
  discountId: number
  discountName: string
  startTime: number
  endTime: number
  status: string
  itemCount: number
}

/** Options for listing vouchers */
export interface VoucherListOptions {
  pageNo?: number
  pageSize?: number
  status?: 'upcoming' | 'ongoing' | 'expired' | 'all'
}

/**
 * Get list of shop vouchers.
 */
export async function getVoucherList(options: VoucherListOptions = {}): Promise<{
  vouchers: ShopeeVoucher[]
  total: number
}> {
  const sdk = getShopeeSDK()
  if (!sdk) return { vouchers: [], total: 0 }

  const result = await handleShopeeResponse('fetch voucher list', async () => {
    const response = await sdk.voucher.getVoucherList({
      page_no: options.pageNo ?? 1,
      page_size: options.pageSize ?? 20,
      status: (options.status || 'all') as any,
    })

    const resp = response as unknown as Record<string, unknown>
    const vouchers = (resp?.voucher_list as Array<Record<string, unknown>>) ?? []
    const total = (resp?.total as number) ?? 0

    return {
      total,
      vouchers: vouchers.map((v) => ({
        voucherId: (v.voucher_id as number) ?? 0,
        voucherCode: (v.voucher_code as string) ?? '',
        voucherName: (v.voucher_name as string) ?? '',
        voucherType: (v.voucher_type as 'SHOP' | 'PRODUCT') ?? 'SHOP',
        rewardType: (v.reward_type as 'DISCOUNT' | 'FIX_PRICE' | 'FREE_SHIPPING') ?? 'DISCOUNT',
        usageQuantity: (v.usage_quantity as number) ?? 0,
        currentUsage: (v.current_usage as number) ?? 0,
        startTime: (v.start_time as number) ?? 0,
        endTime: (v.end_time as number) ?? 0,
        discountAmount: (v.discount_amount as number) ?? 0,
        status: (v.status as string) ?? '',
      })),
    }
  })

  return result.error ? { vouchers: [], total: 0 } : (result.data ?? { vouchers: [], total: 0 })
}

/**
 * Get list of discount campaigns.
 */
export async function getDiscountList(options: { status?: 'upcoming' | 'ongoing' | 'expired' } = {}): Promise<{
  discounts: ShopeeDiscount[]
  total: number
}> {
  const sdk = getShopeeSDK()
  if (!sdk) return { discounts: [], total: 0 }

  const result = await handleShopeeResponse('fetch discount list', async () => {
    const response = await sdk.discount.getDiscountList({
      discount_status: (options.status || 'ongoing') as any,
      page_no: 1,
      page_size: 50,
    })

    const resp = response as unknown as Record<string, unknown>
    const discounts = (resp?.discount_list as Array<Record<string, unknown>>) ?? []
    const total = (resp?.total_count as number) ?? 0

    return {
      total,
      discounts: discounts.map((d) => ({
        discountId: (d.discount_id as number) ?? 0,
        discountName: (d.discount_name as string) ?? '',
        startTime: (d.start_time as number) ?? 0,
        endTime: (d.end_time as number) ?? 0,
        status: (d.status as string) ?? '',
        itemCount: (d.item_count as number) ?? 0,
      })),
    }
  })

  return result.error ? { discounts: [], total: 0 } : (result.data ?? { discounts: [], total: 0 })
}

/**
 * Create a new shop voucher (for NiagaMarketingBot automation).
 */
export async function createVoucher(params: {
  name: string
  code: string
  startTime: number
  endTime: number
  discountAmount: number
  usageQuantity: number
  minSpend?: number
}): Promise<{ success: boolean; voucherId?: number; error?: string }> {
  const sdk = getShopeeSDK()
  if (!sdk) return { success: false, error: 'Shopee SDK not configured' }

  const result = await handleShopeeResponse('create voucher', async () => {
    const response = await sdk.voucher.addVoucher({
      voucher_name: params.name,
      voucher_code: params.code,
      voucher_type: 1, // Shop voucher
      reward_type: 1,  // Discount
      usage_quantity: params.usageQuantity,
      start_time: params.startTime,
      end_time: params.endTime,
      discount_amount: params.discountAmount,
      ...(params.minSpend && { min_basket_price: params.minSpend }),
    } as any)

    const resp = response as unknown as Record<string, unknown>
    return { success: true, voucherId: resp?.voucher_id as number }
  })

  if (result.error) {
    return { success: false, error: result.error }
  }

  return result.data ?? { success: true }
}
