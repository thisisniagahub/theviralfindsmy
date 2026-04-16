/**
 * Shopee Product Helpers — Real product data from Shopee Open API
 *
 * Uses ProductManager for catalog management, pricing, and stock data.
 * Falls back to empty results when SDK is not configured.
 */

import { getShopeeSDK } from './client'
import { handleShopeeResponse } from './response-handler'

/** Simplified product info for dashboard display */
export interface ShopeeProduct {
  itemId: number
  name: string
  status: string
  price: number
  originalPrice: number
  stock: number
  sales: number
  rating: number
  likes: number
  views: number
  images: string[]
  categoryId: number
  updatedAt: number
}

/** Product list options */
export interface ProductListOptions {
  offset?: number
  pageSize?: number
  status?: 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST'
}

/**
 * Get paginated product list from Shopee.
 * Returns real product data when SDK is configured.
 */
export async function getProductList(options: ProductListOptions = {}): Promise<{
  products: ShopeeProduct[]
  total: number
  hasMore: boolean
}> {
  const sdk = getShopeeSDK()
  if (!sdk) {
    return { products: [], total: 0, hasMore: false }
  }

  const result = await handleShopeeResponse('fetch product list', async () => {
    const offset = options.offset ?? 0
    const pageSize = options.pageSize ?? 20

    const response = await sdk.product.getItemList({
      offset,
      page_size: pageSize,
      item_status: options.status ? [options.status] as any : ['NORMAL'],
    })

    const resp = response as unknown as Record<string, unknown>
    const itemList = (resp?.item as Array<Record<string, number>>) ?? []
    const total = (resp?.total_count as number) ?? 0
    const hasMore = (resp?.has_next_page as boolean) ?? false

    if (itemList.length === 0) {
      return { products: [] as ShopeeProduct[], total, hasMore }
    }

    // Fetch detailed info for all items
    const itemIds = itemList.map((item) => item.item_id)
    const detailResponse = await sdk.product.getItemBaseInfo({
      item_id_list: itemIds,
    })

    const detailResp = detailResponse as unknown as Record<string, unknown>
    const items = (detailResp?.item_list as Array<Record<string, unknown>>) ?? []

    const products: ShopeeProduct[] = items.map((item) => ({
      itemId: (item.item_id as number) ?? 0,
      name: (item.item_name as string) ?? '',
      status: (item.item_status as string) ?? 'NORMAL',
      price: ((item.price_info as Record<string, unknown>)?.current_price as number) ?? 0,
      originalPrice: ((item.price_info as Record<string, unknown>)?.original_price as number) ?? 0,
      stock: ((item.stock_info_v2 as Record<string, unknown>)?.current_stock as number) ?? 0,
      sales: (item.sale as number) ?? 0,
      rating: (item.rating_star as number) ?? 0,
      likes: (item.likes as number) ?? 0,
      views: (item.views as number) ?? 0,
      images: ((item.image as Record<string, unknown>)?.image_url_list as string[]) ?? [],
      categoryId: (item.category_id as number) ?? 0,
      updatedAt: (item.update_time as number) ?? 0,
    }))

    return { products, total, hasMore }
  })

  if (result.error) {
    return { products: [], total: 0, hasMore: false }
  }

  return result.data ?? { products: [], total: 0, hasMore: false }
}

/**
 * Get detailed product info by item IDs.
 */
export async function getProductDetails(itemIds: number[]): Promise<ShopeeProduct[]> {
  const sdk = getShopeeSDK()
  if (!sdk || itemIds.length === 0) return []

  const result = await handleShopeeResponse('fetch product details', async () => {
    const response = await sdk.product.getItemBaseInfo({
      item_id_list: itemIds,
    })

    const resp = response as unknown as Record<string, unknown>
    const items = (resp?.item_list as Array<Record<string, unknown>>) ?? []

    return items.map((item) => ({
      itemId: (item.item_id as number) ?? 0,
      name: (item.item_name as string) ?? '',
      status: (item.item_status as string) ?? 'NORMAL',
      price: ((item.price_info as Record<string, unknown>)?.current_price as number) ?? 0,
      originalPrice: ((item.price_info as Record<string, unknown>)?.original_price as number) ?? 0,
      stock: ((item.stock_info_v2 as Record<string, unknown>)?.current_stock as number) ?? 0,
      sales: (item.sale as number) ?? 0,
      rating: (item.rating_star as number) ?? 0,
      likes: (item.likes as number) ?? 0,
      views: (item.views as number) ?? 0,
      images: ((item.image as Record<string, unknown>)?.image_url_list as string[]) ?? [],
      categoryId: (item.category_id as number) ?? 0,
      updatedAt: (item.update_time as number) ?? 0,
    }))
  })

  return result.error ? [] : (result.data ?? [])
}

/**
 * Calculate a "boost score" for a product based on real metrics.
 * Used by NiagaBot to recommend products worth promoting.
 */
export function calculateBoostScore(product: ShopeeProduct): number {
  const viewWeight = 0.15
  const saleWeight = 0.40
  const ratingWeight = 0.25
  const likeWeight = 0.10
  const stockWeight = 0.10

  const viewScore = Math.min(product.views / 1000, 10)
  const saleScore = Math.min(product.sales / 100, 10)
  const ratingScore = product.rating * 2
  const likeScore = Math.min(product.likes / 500, 10)
  const stockScore = product.stock > 0 ? Math.min(product.stock / 100, 10) : 0

  return (
    viewScore * viewWeight +
    saleScore * saleWeight +
    ratingScore * ratingWeight +
    likeScore * likeWeight +
    stockScore * stockWeight
  ) * 10
}
