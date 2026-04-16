/**
 * Shopee Integration — Barrel export
 *
 * Provides unified access to all Shopee SDK helpers:
 * - Client: SDK singleton, connection state, OAuth
 * - Products: Product catalog, pricing, boost scores
 * - Orders: Order tracking, conversion data, revenue stats
 * - Promotions: Vouchers, discounts, flash sales
 * - Shipping: Logistics, tracking, delivery status
 * - Shop: Shop info, account health, performance metrics
 * - AMS: Affiliate marketing campaigns, commissions, optimization
 * - Affiliate: GraphQL API for link generation, product search, offers
 */

// Client & configuration
export {
  getShopeeSDK,
  isShopeeConfigured,
  getShopeeConnectionState,
  getAuthorizationUrl,
  authenticateWithCode,
} from './client'
export type {
  ShopeeConfig,
  ShopeeConnectionState,
  ShopeeRegionCode,
} from './client'

// Products
export {
  getProductList,
  getProductDetails,
  calculateBoostScore,
} from './products'
export type {
  ShopeeProduct,
  ProductListOptions,
} from './products'

// Orders
export {
  getOrderList,
  getOrderStats,
} from './orders'
export type {
  ShopeeOrder,
  ShopeeOrderItem,
  OrderTimeRange,
  OrderListOptions,
  OrderStats,
} from './orders'

// Promotions
export {
  getVoucherList,
  getDiscountList,
  createVoucher,
} from './promotions'
export type {
  ShopeeVoucher,
  ShopeeDiscount,
  VoucherListOptions,
} from './promotions'

// Shipping
export {
  getShippingChannels,
  getTrackingInfo,
  getShippingParameter,
} from './shipping'
export type {
  ShopeeShippingChannel,
  ShopeeTrackingInfo,
  ShopeeTrackingEvent,
} from './shipping'

// Shop & Account Health
export {
  getShopInfo,
  getAccountHealth,
} from './shop'
export type {
  ShopeeShopInfo,
  ShopeeAccountHealth,
} from './shop'

// AMS (Affiliate Marketing Service)
export {
  getCampaignProducts,
  getAvailableProducts,
  batchAddToCampaign,
  batchEditCampaignProducts,
  batchRemoveFromCampaign,
  getAutoAddSettings,
  updateAutoAddSettings,
  getOptimizationSuggestions,
  getBatchTaskStatus,
  getAmsDashboardSummary,
} from './ams'
export type {
  AmsCampaignProduct,
  AmsAvailableProduct,
  AmsOptimizationSuggestion,
  AmsAutoAddSettings,
  AmsBatchTaskStatus,
  AmsDashboardSummary,
  AmsPaginatedResponse,
  AddToCampaignItem,
  CampaignProductListOptions,
} from './ams'

// AMS Client (low-level)
export { isAmsConfigured } from './ams-client'

// Affiliate API (GraphQL)
export {
  searchAffiliateProducts,
  generateAffiliateLink,
  batchGenerateAffiliateLinks,
  getShopeeOffers,
  getAffiliateDashboardSummary,
  AffiliateProductSort,
} from './affiliate'
export type {
  AffiliateProduct,
  AffiliateShortLink,
  AffiliateOffer,
  AffiliatePerformance,
  AffiliatePaginatedResponse,
  AffiliateDashboardSummary,
  ProductSearchOptions,
} from './affiliate'

// Affiliate Client (low-level)
export { isAffiliateConfigured, affiliateGraphQL } from './affiliate-client'
