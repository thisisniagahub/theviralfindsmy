/**
 * Shopee Affiliate API — High-level helpers (GraphQL)
 *
 * Wraps the raw GraphQL client with typed, easy-to-use functions for:
 * - Product search with commission rates
 * - Affiliate link generation (short links)
 * - Offer browsing (Shopee offers, brand offers, product offers)
 * - Performance reports
 *
 * All data flows through the GraphQL endpoint at:
 * https://open-api.affiliate.shopee.com.my/graphql
 */

import { affiliateGraphQL, isAffiliateConfigured } from './affiliate-client'

// ─── Types ──────────────────────────────────────────────

/** Product from affiliate search with commission info */
export interface AffiliateProduct {
  itemId: number
  productName: string
  productLink: string
  offerLink: string
  imageUrl: string
  priceMin: number
  priceMax: number
  commissionRate: number
  sales: number
  shopName: string
  shopId: number
  categoryName: string
  ratingStar: number
}

/** Generated affiliate short link */
export interface AffiliateShortLink {
  shortLink: string
  originUrl: string
  subIds: string[]
}

/** Shopee/Brand offer */
export interface AffiliateOffer {
  offerId: string
  offerName: string
  commissionRate: number
  startTime: number
  endTime: number
  offerLink: string
  imageUrl: string
  status: string
}

/** Affiliate performance summary */
export interface AffiliatePerformance {
  clicks: number
  conversions: number
  orders: number
  revenue: number
  commission: number
  conversionRate: number
  period: string
}

/** Paginated response */
export interface AffiliatePaginatedResponse<T> {
  items: T[]
  page: number
  limit: number
  hasNextPage: boolean
}

// ─── GraphQL Queries ────────────────────────────────────

const PRODUCT_SEARCH_QUERY = `
  query ProductSearch($keyword: String!, $sortType: Int, $page: Int, $limit: Int) {
    productOfferV2(
      keyword: $keyword
      listType: 1
      sortType: $sortType
      page: $page
      limit: $limit
    ) {
      nodes {
        itemId
        productName
        productLink
        offerLink
        imageUrl
        priceMin
        priceMax
        commissionRate
        sales
        shopName
        shopId
        categoryName
        ratingStar
      }
      pageInfo {
        page
        limit
        hasNextPage
      }
    }
  }
`

const GENERATE_SHORT_LINK_MUTATION = `
  mutation GenerateShortLink($input: GenerateShortLinkInput!) {
    generateShortLink(input: $input) {
      shortLink
    }
  }
`

const SHOPEE_OFFERS_QUERY = `
  query ShopeeOffers($page: Int, $limit: Int) {
    shopeeOfferList(page: $page, limit: $limit) {
      nodes {
        offerId
        offerName
        commissionRate
        startTime
        endTime
        offerLink
        imageUrl
        status
      }
      pageInfo {
        page
        limit
        hasNextPage
      }
    }
  }
`

// ─── Product Search ─────────────────────────────────────

/** Sort types for product search */
export enum AffiliateProductSort {
  RELEVANCE = 0,
  PRICE_ASC = 1,
  PRICE_DESC = 2,
  SALES = 3,
  RATING = 4,
  COMMISSION = 5,
}

/** Search product options */
export interface ProductSearchOptions {
  keyword: string
  sortType?: AffiliateProductSort
  page?: number
  limit?: number
}

/**
 * Search products with real commission rates.
 * This is THE core function for TheViralFinds — shows actual affiliate commissions.
 */
export async function searchAffiliateProducts(
  options: ProductSearchOptions,
): Promise<AffiliatePaginatedResponse<AffiliateProduct>> {
  const empty: AffiliatePaginatedResponse<AffiliateProduct> = {
    items: [], page: 1, limit: 20, hasNextPage: false,
  }

  if (!isAffiliateConfigured()) return empty

  const result = await affiliateGraphQL<{
    productOfferV2: {
      nodes: AffiliateProduct[]
      pageInfo: { page: number; limit: number; hasNextPage: boolean }
    }
  }>(PRODUCT_SEARCH_QUERY, {
    keyword: options.keyword,
    sortType: options.sortType ?? AffiliateProductSort.RELEVANCE,
    page: options.page ?? 1,
    limit: options.limit ?? 20,
  })

  if (!result.success || !result.data) return empty

  const { nodes, pageInfo } = result.data.productOfferV2
  return {
    items: nodes ?? [],
    page: pageInfo.page,
    limit: pageInfo.limit,
    hasNextPage: pageInfo.hasNextPage,
  }
}

// ─── Link Generation ────────────────────────────────────

/**
 * Generate a trackable affiliate short link from any Shopee URL.
 *
 * @param originUrl - The original Shopee product/page URL
 * @param subIds - Custom tracking IDs (campaign, source, etc.)
 */
export async function generateAffiliateLink(
  originUrl: string,
  subIds: string[] = [],
): Promise<AffiliateShortLink | null> {
  if (!isAffiliateConfigured()) return null

  const result = await affiliateGraphQL<{
    generateShortLink: { shortLink: string }
  }>(GENERATE_SHORT_LINK_MUTATION, {
    input: { originUrl, subIds },
  })

  if (!result.success || !result.data) return null

  return {
    shortLink: result.data.generateShortLink.shortLink,
    originUrl,
    subIds,
  }
}

/**
 * Batch generate affiliate links for multiple URLs.
 */
export async function batchGenerateAffiliateLinks(
  urls: Array<{ url: string; subIds?: string[] }>,
): Promise<AffiliateShortLink[]> {
  if (!isAffiliateConfigured()) return []

  const results = await Promise.allSettled(
    urls.map(({ url, subIds }) => generateAffiliateLink(url, subIds ?? [])),
  )

  return results
    .filter((r): r is PromiseFulfilledResult<AffiliateShortLink | null> =>
      r.status === 'fulfilled' && r.value !== null,
    )
    .map((r) => r.value!)
}

// ─── Offers ─────────────────────────────────────────────

/**
 * Get available Shopee promotional offers for affiliates.
 */
export async function getShopeeOffers(
  options: { page?: number; limit?: number } = {},
): Promise<AffiliatePaginatedResponse<AffiliateOffer>> {
  const empty: AffiliatePaginatedResponse<AffiliateOffer> = {
    items: [], page: 1, limit: 20, hasNextPage: false,
  }

  if (!isAffiliateConfigured()) return empty

  const result = await affiliateGraphQL<{
    shopeeOfferList: {
      nodes: AffiliateOffer[]
      pageInfo: { page: number; limit: number; hasNextPage: boolean }
    }
  }>(SHOPEE_OFFERS_QUERY, {
    page: options.page ?? 1,
    limit: options.limit ?? 20,
  })

  if (!result.success || !result.data) return empty

  const { nodes, pageInfo } = result.data.shopeeOfferList
  return {
    items: nodes ?? [],
    page: pageInfo.page,
    limit: pageInfo.limit,
    hasNextPage: pageInfo.hasNextPage,
  }
}

// ─── Aggregate Dashboard ────────────────────────────────

/** Full affiliate dashboard summary for AI agents */
export interface AffiliateDashboardSummary {
  configured: boolean
  topProducts: AffiliateProduct[]
  activeOffers: AffiliateOffer[]
  endpoint: string | null
}

/**
 * Get a snapshot of the affiliate dashboard for NiagaBot.
 */
export async function getAffiliateDashboardSummary(
  keyword: string = 'trending',
): Promise<AffiliateDashboardSummary> {
  if (!isAffiliateConfigured()) {
    return {
      configured: false,
      topProducts: [],
      activeOffers: [],
      endpoint: null,
    }
  }

  try {
    const [products, offers] = await Promise.all([
      searchAffiliateProducts({
        keyword,
        sortType: AffiliateProductSort.COMMISSION,
        limit: 10,
      }),
      getShopeeOffers({ limit: 5 }),
    ])

    return {
      configured: true,
      topProducts: products.items,
      activeOffers: offers.items,
      endpoint: `open-api.affiliate.shopee.${(process.env.SHOPEE_REGION ?? 'MY').toLowerCase()}`,
    }
  } catch (error) {
    console.error('[Shopee Affiliate] Dashboard summary failed:', error)
    return {
      configured: true,
      topProducts: [],
      activeOffers: [],
      endpoint: null,
    }
  }
}
