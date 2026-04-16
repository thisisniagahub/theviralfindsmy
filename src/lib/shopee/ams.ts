/**
 * Shopee AMS (Affiliate Marketing Service) — Campaign & commission management
 *
 * Custom wrapper for Shopee V2.0 AMS endpoints.
 * These endpoints are NOT in the @congminh1254/shopee-sdk.
 *
 * Covers:
 * - Campaign product listing with real commission rates
 * - Campaign product management (add/edit/remove)
 * - Auto-add rules for new products
 * - Shopee's AI optimization suggestions
 * - Batch task status tracking
 */

import { shopeeGet, shopeePost, isAmsConfigured } from './ams-client'

// ─── Types ──────────────────────────────────────────────

/** Product in an AMS campaign */
export interface AmsCampaignProduct {
  itemId: number
  itemName: string
  campaignId: number
  campaignStatus: 'ongoing' | 'upcoming' | 'terminating'
  commissionRate: number // e.g. 1.1 means 1.1%
  periodStartTime: number
  periodEndTime: number
  imageUrl?: string
}

/** Product not yet in any campaign */
export interface AmsAvailableProduct {
  itemId: number
  itemName: string
  currentPrice: number
  stock: number
  sales: number
  imageUrl?: string
}

/** Optimization suggestion from Shopee AI */
export interface AmsOptimizationSuggestion {
  itemId: number
  itemName: string
  currentCommission: number
  suggestedCommission: number
  reason: string
  expectedImpact: string
}

/** Auto-add settings */
export interface AmsAutoAddSettings {
  enabled: boolean
  defaultCommissionRate: number
  lastUpdated: number
}

/** Batch task status */
export interface AmsBatchTaskStatus {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalItems: number
  processedItems: number
  failedItems: number
  errors: string[]
}

/** Paginated response wrapper */
export interface AmsPaginatedResponse<T> {
  items: T[]
  cursor: string
  hasMore: boolean
  total: number
}

// ─── API Path Constants ─────────────────────────────────

const AMS_PATHS = {
  GET_CAMPAIGN_PRODUCTS: '/api/v2/ams/get_open_campaign_added_product',
  GET_AVAILABLE_PRODUCTS: '/api/v2/ams/get_open_campaign_not_added_product',
  BATCH_ADD_PRODUCTS: '/api/v2/ams/batch_add_products_to_open_campaign',
  ADD_ALL_PRODUCTS: '/api/v2/ams/add_all_products_to_open_campaign',
  BATCH_EDIT_PRODUCTS: '/api/v2/ams/batch_edit_products_open_campaign',
  EDIT_ALL_PRODUCTS: '/api/v2/ams/edit_all_products_open_campaign',
  BATCH_REMOVE_PRODUCTS: '/api/v2/ams/batch_remove_products_open_campaign',
  REMOVE_ALL_PRODUCTS: '/api/v2/ams/remove_all_products_open_campaign',
  GET_AUTO_ADD_SETTINGS: '/api/v2/ams/get_auto_add_new_product_to_open_campaign',
  UPDATE_AUTO_ADD_SETTINGS: '/api/v2/ams/update_auto_add_new_product_to_open_campaign',
  GET_BATCH_TASK: '/api/v2/ams/get_open_campaign_batch_task',
  GET_OPTIMIZATION: '/api/v2/ams/get_optimization_suggestion_product_list',
  GET_SUGGESTED_PRODUCTS: '/api/v2/ams/batch_get_products_suggested_commission',
} as const

// ─── Campaign Product Queries ───────────────────────────

/** Options for listing campaign products */
export interface CampaignProductListOptions {
  pageSize?: number
  cursor?: string
  sortBy?: 'commission_rate' | '-commission_rate'
  searchType?: 'ITEM_NAME' | 'ITEM_ID'
  searchContent?: string
}

/**
 * Get products currently in AMS campaigns with their real commission rates.
 * This is THE key endpoint for TheViralFinds — shows actual affiliate commissions.
 */
export async function getCampaignProducts(
  options: CampaignProductListOptions = {},
): Promise<AmsPaginatedResponse<AmsCampaignProduct>> {
  const empty: AmsPaginatedResponse<AmsCampaignProduct> = {
    items: [], cursor: '', hasMore: false, total: 0,
  }

  if (!isAmsConfigured()) return empty

  const params: Record<string, string | number> = {
    page_size: options.pageSize ?? 20,
  }
  if (options.cursor) params.cursor = options.cursor
  if (options.sortBy) params.sort_by = options.sortBy
  if (options.searchType) params.search_type = options.searchType
  if (options.searchContent) params.search_content = options.searchContent

  const result = await shopeeGet<Record<string, unknown>>(
    AMS_PATHS.GET_CAMPAIGN_PRODUCTS,
    params,
  )

  if (!result.success || !result.data) return empty

  const data = result.data
  const itemList = (data.item_list as Array<Record<string, unknown>>) ?? []

  return {
    items: itemList.map((item) => ({
      itemId: (item.item_id as number) ?? 0,
      itemName: (item.item_name as string) ?? '',
      campaignId: (item.campaign_id as number) ?? 0,
      campaignStatus: ((item.campaign_status as string) ?? 'ongoing').toLowerCase() as 'ongoing' | 'upcoming' | 'terminating',
      commissionRate: (item.commission_rate as number) ?? 0,
      periodStartTime: (item.period_start_time as number) ?? 0,
      periodEndTime: (item.period_end_time as number) ?? 0,
      imageUrl: (item.image_url as string) ?? undefined,
    })),
    cursor: (data.cursor as string) ?? '',
    hasMore: (data.has_next_page as boolean) ?? false,
    total: (data.total_count as number) ?? itemList.length,
  }
}

/**
 * Get products NOT yet in any AMS campaign — candidates for adding.
 */
export async function getAvailableProducts(
  options: { pageSize?: number; cursor?: string } = {},
): Promise<AmsPaginatedResponse<AmsAvailableProduct>> {
  const empty: AmsPaginatedResponse<AmsAvailableProduct> = {
    items: [], cursor: '', hasMore: false, total: 0,
  }

  if (!isAmsConfigured()) return empty

  const params: Record<string, string | number> = {
    page_size: options.pageSize ?? 20,
  }
  if (options.cursor) params.cursor = options.cursor

  const result = await shopeeGet<Record<string, unknown>>(
    AMS_PATHS.GET_AVAILABLE_PRODUCTS,
    params,
  )

  if (!result.success || !result.data) return empty

  const data = result.data
  const itemList = (data.item_list as Array<Record<string, unknown>>) ?? []

  return {
    items: itemList.map((item) => ({
      itemId: (item.item_id as number) ?? 0,
      itemName: (item.item_name as string) ?? '',
      currentPrice: (item.current_price as number) ?? 0,
      stock: (item.stock as number) ?? 0,
      sales: (item.sale as number) ?? 0,
      imageUrl: (item.image_url as string) ?? undefined,
    })),
    cursor: (data.cursor as string) ?? '',
    hasMore: (data.has_next_page as boolean) ?? false,
    total: (data.total_count as number) ?? itemList.length,
  }
}

// ─── Campaign Product Management ────────────────────────

/** Add products to campaign with commission config */
export interface AddToCampaignItem {
  itemId: number
  commissionRate: number  // e.g. 5.0 = 5%
}

/**
 * Batch add products to AMS open campaign.
 */
export async function batchAddToCampaign(
  items: AddToCampaignItem[],
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  if (!isAmsConfigured()) return { success: false, error: 'AMS not configured' }

  const result = await shopeePost<Record<string, unknown>>(
    AMS_PATHS.BATCH_ADD_PRODUCTS,
    {
      item_list: items.map((item) => ({
        item_id: item.itemId,
        commission_rate: item.commissionRate,
      })),
    },
  )

  if (!result.success) return { success: false, error: result.error }

  return {
    success: true,
    taskId: (result.data?.task_id as string) ?? undefined,
  }
}

/**
 * Batch edit commission rates for products already in campaign.
 */
export async function batchEditCampaignProducts(
  items: AddToCampaignItem[],
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  if (!isAmsConfigured()) return { success: false, error: 'AMS not configured' }

  const result = await shopeePost<Record<string, unknown>>(
    AMS_PATHS.BATCH_EDIT_PRODUCTS,
    {
      item_list: items.map((item) => ({
        item_id: item.itemId,
        commission_rate: item.commissionRate,
      })),
    },
  )

  if (!result.success) return { success: false, error: result.error }

  return {
    success: true,
    taskId: (result.data?.task_id as string) ?? undefined,
  }
}

/**
 * Batch remove products from AMS campaign.
 */
export async function batchRemoveFromCampaign(
  itemIds: number[],
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  if (!isAmsConfigured()) return { success: false, error: 'AMS not configured' }

  const result = await shopeePost<Record<string, unknown>>(
    AMS_PATHS.BATCH_REMOVE_PRODUCTS,
    { item_id_list: itemIds },
  )

  if (!result.success) return { success: false, error: result.error }

  return {
    success: true,
    taskId: (result.data?.task_id as string) ?? undefined,
  }
}

// ─── Auto-Add Settings ──────────────────────────────────

/**
 * Get auto-add settings for new products.
 */
export async function getAutoAddSettings(): Promise<AmsAutoAddSettings | null> {
  if (!isAmsConfigured()) return null

  const result = await shopeeGet<Record<string, unknown>>(AMS_PATHS.GET_AUTO_ADD_SETTINGS)
  if (!result.success || !result.data) return null

  const data = result.data
  return {
    enabled: (data.is_enable as boolean) ?? false,
    defaultCommissionRate: (data.commission_rate as number) ?? 0,
    lastUpdated: (data.update_time as number) ?? 0,
  }
}

/**
 * Update auto-add settings for new products.
 */
export async function updateAutoAddSettings(
  enabled: boolean,
  commissionRate?: number,
): Promise<{ success: boolean; error?: string }> {
  if (!isAmsConfigured()) return { success: false, error: 'AMS not configured' }

  const body: Record<string, unknown> = { is_enable: enabled }
  if (commissionRate !== undefined) body.commission_rate = commissionRate

  const result = await shopeePost(AMS_PATHS.UPDATE_AUTO_ADD_SETTINGS, body)
  return { success: result.success, error: result.error }
}

// ─── Optimization & Intelligence ────────────────────────

/**
 * Get Shopee's AI-powered optimization suggestions for campaign products.
 * This is gold for NiagaBot — real Shopee data + AI recommendations.
 */
export async function getOptimizationSuggestions(
  options: { pageSize?: number; cursor?: string } = {},
): Promise<AmsPaginatedResponse<AmsOptimizationSuggestion>> {
  const empty: AmsPaginatedResponse<AmsOptimizationSuggestion> = {
    items: [], cursor: '', hasMore: false, total: 0,
  }

  if (!isAmsConfigured()) return empty

  const params: Record<string, string | number> = {
    page_size: options.pageSize ?? 20,
  }
  if (options.cursor) params.cursor = options.cursor

  const result = await shopeeGet<Record<string, unknown>>(
    AMS_PATHS.GET_OPTIMIZATION,
    params,
  )

  if (!result.success || !result.data) return empty

  const data = result.data
  const itemList = (data.item_list as Array<Record<string, unknown>>) ?? []

  return {
    items: itemList.map((item) => ({
      itemId: (item.item_id as number) ?? 0,
      itemName: (item.item_name as string) ?? '',
      currentCommission: (item.current_commission_rate as number) ?? 0,
      suggestedCommission: (item.suggested_commission_rate as number) ?? 0,
      reason: (item.optimization_reason as string) ?? '',
      expectedImpact: (item.expected_impact as string) ?? '',
    })),
    cursor: (data.cursor as string) ?? '',
    hasMore: (data.has_next_page as boolean) ?? false,
    total: (data.total_count as number) ?? itemList.length,
  }
}

// ─── Batch Task Tracking ────────────────────────────────

/**
 * Get status of a batch task (add/edit/remove).
 */
export async function getBatchTaskStatus(
  taskId: string,
): Promise<AmsBatchTaskStatus | null> {
  if (!isAmsConfigured()) return null

  const result = await shopeeGet<Record<string, unknown>>(
    AMS_PATHS.GET_BATCH_TASK,
    { task_id: taskId },
  )

  if (!result.success || !result.data) return null

  const data = result.data
  return {
    taskId,
    status: ((data.status as string) ?? 'pending').toLowerCase() as AmsBatchTaskStatus['status'],
    totalItems: (data.total_count as number) ?? 0,
    processedItems: (data.success_count as number) ?? 0,
    failedItems: (data.fail_count as number) ?? 0,
    errors: (data.fail_list as string[]) ?? [],
  }
}

// ─── Aggregate / Summary ────────────────────────────────

/** Full AMS dashboard summary */
export interface AmsDashboardSummary {
  totalCampaignProducts: number
  averageCommissionRate: number
  topCommissionProducts: AmsCampaignProduct[]
  optimizationCount: number
  autoAddEnabled: boolean
}

/**
 * Get a full AMS dashboard summary — aggregates multiple API calls.
 * Used by the dashboard and NiagaBot for comprehensive affiliate insights.
 */
export async function getAmsDashboardSummary(): Promise<AmsDashboardSummary | null> {
  if (!isAmsConfigured()) return null

  try {
    const [campaignProducts, optimizations, autoAdd] = await Promise.all([
      getCampaignProducts({ pageSize: 100, sortBy: '-commission_rate' }),
      getOptimizationSuggestions({ pageSize: 5 }),
      getAutoAddSettings(),
    ])

    const rates = campaignProducts.items.map((p) => p.commissionRate)
    const avgRate = rates.length > 0
      ? rates.reduce((a, b) => a + b, 0) / rates.length
      : 0

    return {
      totalCampaignProducts: campaignProducts.total,
      averageCommissionRate: Math.round(avgRate * 100) / 100,
      topCommissionProducts: campaignProducts.items.slice(0, 5),
      optimizationCount: optimizations.total,
      autoAddEnabled: autoAdd?.enabled ?? false,
    }
  } catch (error) {
    console.error('[Shopee AMS] Failed to get dashboard summary:', error)
    return null
  }
}
