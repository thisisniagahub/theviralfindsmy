import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {
  dbServiceFetchOptions,
  type AuthenticatedRequest,
} from '@/lib/api-auth'
import { demoRandom } from '@/lib/demo'
import { forecastEarnings, suggestCommissionRate } from '@/lib/forecast'
import type { TypedSession } from '@/types/next-auth'

import type {
  ActivityFeedResponse,
  DashboardBootstrapData,
  DashboardData,
  DashboardGoal,
  DashboardLinkSummary,
  ForecastResponse,
  GoalsResponse,
  LinksResponse,
} from './dashboard-types'

const DB_URL = process.env.DB_SERVICE_URL

const DEMO_PRODUCT_IMAGES = [
  '/products/laneige-mask.png',
  '/products/tws-earbuds.png',
  '/products/running-shoes.png',
  '/products/vitamin-c.png',
  '/products/cetaphil.png',
  '/products/airpods-pro.png',
  '/products/innisfree-serum.png',
  '/products/snack-box.png',
  '/products/uniqlo-tshirt.png',
  '/products/ensure-gold.png',
]

interface DashboardBootstrapOptions {
  period?: string
  activityLimit?: number
  linksLimit?: number
  forecastDays?: number
  auth?: AuthenticatedRequest | null
}

interface LinksQueryOptions {
  page?: number
  limit?: number
  status?: string
  campaignId?: string
  search?: string
}

function isDemoMode() {
  return process.env.DEMO_MODE === 'true'
}

function getChartDays(period: string) {
  const now = new Date()
  const totalDays = period === '7d'
    ? 7
    : period === '90d'
      ? 90
      : period === 'month'
        ? now.getDate()
        : 30

  return Math.min(totalDays, 30)
}

function getForecastHistoryDays(period: string) {
  if (period === '7d') return 7
  if (period === '90d') return 90
  if (period === 'month') return 30
  return 30
}

function buildDashboardServiceError(response: Response, payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
    return `${fallback}: ${payload.error}`
  }

  return `${fallback}: HTTP ${response.status}`
}

async function readJsonOrThrow<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(buildDashboardServiceError(response, payload, fallback))
  }

  return payload as T
}

async function fetchDbJson<T>(
  path: string,
  auth: AuthenticatedRequest | null,
  fallbackError: string
): Promise<T> {
  if (!DB_URL) {
    throw new Error('Database service not configured')
  }

  if (!auth) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${DB_URL}${path}`, dbServiceFetchOptions(auth, {
    cache: 'no-store',
  }))

  return readJsonOrThrow<T>(response, fallbackError)
}

function getMockHistoricalData(days: number) {
  const data = []
  const today = new Date()

  for (let i = days; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const base = 50 + (days - i) * 2
    const variance = demoRandom.range(-15, 15)

    data.push({
      date: date.toISOString().split('T')[0],
      earnings: Math.max(0, base + variance),
      clicks: Math.floor(100 + (days - i) * 5 + demoRandom.rangeInt(0, 50)),
    })
  }

  return data
}

export async function getDashboardAuth(): Promise<AuthenticatedRequest | null> {
  const session = await getServerSession(authOptions) as TypedSession | null

  if (!session?.user?.id) {
    return null
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email,
    userRole: session.user.role,
  }
}

export function getDemoDashboardData(period: string): DashboardData {
  const chartDays = getChartDays(period)

  const earningsData = Array.from({ length: chartDays }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (chartDays - 1 - index))

    return {
      date: date.toISOString().split('T')[0],
      earnings: Math.round(demoRandom.range(30, 180) * 100) / 100,
      clicks: demoRandom.rangeInt(20, 100),
    }
  })

  return {
    totalLinks: 18,
    totalClicks: 6112,
    totalConversions: 284,
    totalEarnings: 3125.5,
    conversionRate: 4.6,
    earningsData,
    topLinks: [
      { id: '1', name: 'Laneige Water Mask', productName: 'Laneige Water Sleeping Mask', productImage: '/products/laneige-mask.png', clicks: 456, conversions: 34, earnings: 456.8, status: 'active', shortCode: 'lnMask', category: 'Beauty', campaign: { name: 'Beauty Week' } },
      { id: '2', name: 'TWS Earbuds Pro', productName: 'TWS Earbuds Pro Max', productImage: '/products/tws-earbuds.png', clicks: 389, conversions: 28, earnings: 398.4, status: 'active', shortCode: 'twPro', category: 'Electronics', campaign: { name: 'Tech Deals' } },
      { id: '3', name: 'Running Shoes', productName: 'Ultra Running Shoes V2', productImage: '/products/running-shoes.png', clicks: 312, conversions: 22, earnings: 312, status: 'active', shortCode: 'rnShoe', category: 'Sports', campaign: null },
      { id: '4', name: 'Vitamin C Serum', productName: 'Vitamin C Brightening Serum', productImage: '/products/vitamin-c.png', clicks: 267, conversions: 19, earnings: 267.3, status: 'active', shortCode: 'vitC', category: 'Beauty', campaign: { name: 'Beauty Week' } },
      { id: '5', name: 'Cetaphil Cleanser', productName: 'Cetaphil Gentle Skin Cleanser', productImage: '/products/cetaphil.png', clicks: 234, conversions: 16, earnings: 198, status: 'active', shortCode: 'ceta', category: 'Beauty', campaign: null },
    ],
    recentConversions: Array.from({ length: 10 }, (_, index) => ({
      id: `conv-${index + 1}`,
      orderId: `ORD-${10000 + index}`,
      amount: Math.round(demoRandom.range(30, 230) * 100) / 100,
      commission: Math.round(demoRandom.range(5, 35) * 100) / 100,
      status: ['confirmed', 'pending', 'paid'][index % 3],
      createdAt: new Date(Date.now() - index * 3600000 * 6).toISOString(),
      affiliateLink: {
        name: ['Laneige Mask', 'TWS Earbuds', 'Running Shoes', 'Vitamin C', 'AirPods Pro'][index % 5],
        productName: 'Product',
        shortCode: `sc${index}`,
      },
    })),
    countryData: [
      { name: 'Malaysia', value: 3840 },
      { name: 'Singapore', value: 890 },
      { name: 'Indonesia', value: 650 },
      { name: 'Thailand', value: 420 },
      { name: 'Philippines', value: 312 },
    ],
    period,
    performanceScore: 72,
    performanceGrade: 'C',
    scoreBreakdown: [
      { label: 'Conversion Rate', earned: 10, max: 20 },
      { label: 'Total Clicks', earned: 10, max: 20 },
      { label: 'Total Earnings', earned: 20, max: 20 },
      { label: 'Active Links', earned: 15, max: 15 },
      { label: 'Earnings/Click', earned: 8, max: 15 },
      { label: 'Paused Links', earned: 5, max: 10 },
    ],
    _demo: true,
  }
}

export function getDemoActivityFeed(limit = 20): ActivityFeedResponse {
  const now = new Date()
  const activities = [
    { id: 'act-1', type: 'conversion', title: 'New sale: Laneige Water Sleeping Mask', description: 'RM 12.50 commission earned · Order ORD-10001', timestamp: new Date(now.getTime() - 1800000).toISOString(), metadata: { amount: 89.9, commission: 12.5, status: 'confirmed', productName: 'Laneige Water Sleeping Mask' }, icon: 'ShoppingCart', time: '30m ago' },
    { id: 'act-2', type: 'click_milestone', title: 'TWS Earbuds Pro reached 300 clicks!', description: 'Your affiliate link for "TWS Earbuds Pro Max" hit a new milestone', timestamp: new Date(now.getTime() - 7200000).toISOString(), metadata: { linkId: 'link-2', clicks: 389, milestone: 300 }, icon: 'MousePointer', time: '2h ago' },
    { id: 'act-3', type: 'link_created', title: 'New link created: Vitamin C Serum', description: 'Beauty · Vitamin C Brightening Serum', timestamp: new Date(now.getTime() - 14400000).toISOString(), metadata: { linkId: 'link-4', shortCode: 'vitC', category: 'Beauty' }, icon: 'Link2', time: '4h ago' },
    { id: 'act-4', type: 'payout_requested', title: 'Payout of RM 350.00 requested', description: 'Status: Processing · Bank Transfer via CIMB', timestamp: new Date(now.getTime() - 28800000).toISOString(), metadata: { amount: 350, status: 'processing', method: 'bank_transfer' }, icon: 'ArrowUpRight', time: '8h ago' },
    { id: 'act-5', type: 'conversion', title: 'New sale: Running Shoes', description: 'RM 15.60 commission earned · Order ORD-10000', timestamp: new Date(now.getTime() - 43200000).toISOString(), metadata: { amount: 129.9, commission: 15.6, status: 'pending', productName: 'Ultra Running Shoes V2' }, icon: 'ShoppingCart', time: '12h ago' },
    { id: 'act-6', type: 'goal_achieved', title: 'Goal milestone: Monthly Earnings Target', description: '72% achieved — RM 1,450.00 of RM 2,000.00', timestamp: new Date(now.getTime() - 86400000).toISOString(), metadata: { goalId: 'goal-1', current: 1450, target: 2000, percentage: 72 }, icon: 'Trophy', time: '1 day ago' },
    { id: 'act-7', type: 'campaign_started', title: 'Campaign started: Beauty Week', description: 'Budget RM 1,500.00 · 1 Mar 2026', timestamp: new Date(now.getTime() - 172800000).toISOString(), metadata: { campaignId: 'camp-1', budget: 1500, status: 'active' }, icon: 'Megaphone', time: '2 days ago' },
    { id: 'act-8', type: 'payout_received', title: 'Payout of RM 500.00 received', description: 'Bank Transfer via Maybank — ****4521', timestamp: new Date(now.getTime() - 259200000).toISOString(), metadata: { amount: 500, method: 'bank_transfer', bankName: 'Maybank' }, icon: 'Wallet', time: '3 days ago' },
    { id: 'act-9', type: 'link_updated', title: 'Link updated: Cetaphil Cleanser', description: '234 clicks, 16 conversions, RM 198.00 earned', timestamp: new Date(now.getTime() - 345600000).toISOString(), metadata: { linkId: 'link-5', clicks: 234, earnings: 198 }, icon: 'Edit', time: '4 days ago' },
    { id: 'act-10', type: 'conversion', title: 'New sale: TWS Earbuds Pro', description: 'RM 14.20 commission earned · Order ORD-9998', timestamp: new Date(now.getTime() - 432000000).toISOString(), metadata: { amount: 79.9, commission: 14.2, status: 'paid', productName: 'TWS Earbuds Pro Max' }, icon: 'ShoppingCart', time: '5 days ago' },
  ]

  return {
    activities: activities.slice(0, limit),
    totalActivities: 15,
    todayCount: 3,
    thisWeekCount: 8,
    limit,
    hasMore: activities.length > limit,
  }
}

export function getDemoGoalsData(): GoalsResponse {
  const now = new Date()
  const goals: DashboardGoal[] = [
    { id: 'goal-1', name: 'Monthly Earnings Target', targetAmount: 2000, currentAmount: 1450, period: 'monthly', startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate: null, status: 'active', createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(), updatedAt: now.toISOString() },
    { id: 'goal-2', name: 'Q1 Revenue Goal', targetAmount: 5000, currentAmount: 5000, period: 'quarterly', startDate: new Date(now.getFullYear(), 0, 1).toISOString(), endDate: new Date(now.getFullYear(), 2, 31).toISOString(), status: 'achieved', createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(), updatedAt: new Date(now.getTime() - 5 * 86400000).toISOString() },
    { id: 'goal-3', name: 'New Product Launch', targetAmount: 800, currentAmount: 320, period: 'monthly', startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate: null, status: 'active', createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(), updatedAt: now.toISOString() },
  ]

  return {
    goals,
    summary: {
      totalGoals: 3,
      activeGoals: 2,
      achievedGoals: 1,
      totalTarget: 7800,
      totalCurrent: 6770,
      overallProgress: 87,
    },
  }
}

export function getDemoLinksData(options: LinksQueryOptions = {}): LinksResponse {
  const {
    page = 1,
    limit = 10,
    status = '',
    campaignId = '',
    search = '',
  } = options

  const demoLinks = Array.from({ length: 18 }, (_, index): DashboardLinkSummary & {
    campaignId: string | null
  } => {
    const names = ['Laneige Water Mask', 'TWS Earbuds Pro', 'Running Shoes', 'Vitamin C Serum', 'Cetaphil Cleanser', 'AirPods Pro Case', 'Retinol Night Cream', 'Yoga Mat Premium', 'Mechanical Keyboard', 'Protein Powder', 'Wireless Charger', 'Sunscreen SPF50', 'Bluetooth Speaker', 'Lip Tint Set', 'Smart Watch Band', 'Coffee Maker', 'Backpack Travel', 'Face Sheet Masks']
    const categories = ['Beauty', 'Electronics', 'Sports', 'Beauty', 'Beauty', 'Electronics', 'Beauty', 'Sports', 'Electronics', 'Health', 'Electronics', 'Beauty', 'Electronics', 'Beauty', 'Electronics', 'Home', 'Fashion', 'Beauty']
    const campaigns = [{ id: 'camp-1', name: 'Beauty Week' }, { id: 'camp-2', name: 'Tech Deals' }, null, { id: 'camp-1', name: 'Beauty Week' }, null, { id: 'camp-2', name: 'Tech Deals' }, null, null, { id: 'camp-2', name: 'Tech Deals' }, null, null, { id: 'camp-1', name: 'Beauty Week' }, null, { id: 'camp-1', name: 'Beauty Week' }, null, null, null, { id: 'camp-1', name: 'Beauty Week' }]
    const clicks = [456, 389, 312, 267, 234, 198, 176, 155, 143, 132, 121, 110, 98, 87, 76, 65, 54, 43]
    const conversions = [34, 28, 22, 19, 16, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 3, 2]
    const earnings = [456.8, 398.4, 312, 267.3, 198, 178.2, 156.8, 139.5, 128.7, 118.8, 108.9, 99, 88.2, 78.3, 68.4, 58.5, 48.6, 38.7]
    const statuses: Array<'active' | 'paused'> = ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'paused', 'active', 'active', 'active', 'active', 'active', 'active', 'paused', 'active', 'active', 'active']
    const shortCodes = ['lnMask', 'twPro', 'rnShoe', 'vitC', 'ceta', 'airCase', 'retCr', 'yogaM', 'mechK', 'protP', 'wirC', 'sunS', 'btSp', 'lipT', 'swB', 'coffM', 'bkTr', 'faceM']

    return {
      id: `link-${index + 1}`,
      name: names[index],
      productName: names[index],
      productImage: DEMO_PRODUCT_IMAGES[index % DEMO_PRODUCT_IMAGES.length],
      clicks: clicks[index],
      conversions: conversions[index],
      earnings: earnings[index],
      status: statuses[index],
      shortCode: shortCodes[index],
      category: categories[index],
      campaign: campaigns[index],
      campaignId: campaigns[index]?.id || null,
      expiresIn: index === 7 ? 3 : null,
      isExpired: false,
      expiryStatus: index === 7 ? 'expiring_soon' : 'none',
    }
  })

  const normalizedSearch = search.trim().toLowerCase()
  const filtered = demoLinks.filter((link) => {
    if (status && link.status !== status) return false
    if (campaignId && link.campaignId !== campaignId) return false
    if (!normalizedSearch) return true

    return [
      link.name,
      link.productName,
      link.shortCode,
      link.category,
    ]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(normalizedSearch))
  })

  const total = filtered.length
  const start = Math.max(page - 1, 0) * limit
  const pagedLinks = filtered.slice(start, start + limit)

  return {
    links: pagedLinks,
    campaigns: [
      { id: 'camp-1', name: 'Beauty Week' },
      { id: 'camp-2', name: 'Tech Deals' },
    ],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export function getForecastResponse(days = 30, period = 30): ForecastResponse {
  const historicalData = getMockHistoricalData(period)
  const forecast = forecastEarnings(historicalData, days)
  const rateSuggestion = suggestCommissionRate(historicalData)

  return {
    success: true,
    forecast,
    rateSuggestion,
    historicalData: historicalData.slice(-30),
  }
}

export async function getDashboardData(period = '30d', auth?: AuthenticatedRequest | null): Promise<DashboardData> {
  if (isDemoMode()) {
    return getDemoDashboardData(period)
  }

  const resolvedAuth = auth ?? await getDashboardAuth()
  return fetchDbJson<DashboardData>(`/dashboard/stats?${new URLSearchParams({ period }).toString()}`, resolvedAuth, 'Failed to load dashboard data')
}

export async function getActivityFeed(limit = 20, auth?: AuthenticatedRequest | null): Promise<ActivityFeedResponse> {
  if (isDemoMode()) {
    return getDemoActivityFeed(limit)
  }

  const resolvedAuth = auth ?? await getDashboardAuth()
  return fetchDbJson<ActivityFeedResponse>(`/activity?${new URLSearchParams({ limit: String(limit) }).toString()}`, resolvedAuth, 'Failed to load activity feed')
}

export async function getGoalsData(auth?: AuthenticatedRequest | null): Promise<GoalsResponse> {
  if (isDemoMode()) {
    return getDemoGoalsData()
  }

  const resolvedAuth = auth ?? await getDashboardAuth()
  return fetchDbJson<GoalsResponse>('/goals', resolvedAuth, 'Failed to load goals')
}

export async function getLinksData(options: LinksQueryOptions = {}, auth?: AuthenticatedRequest | null): Promise<LinksResponse> {
  if (isDemoMode()) {
    return getDemoLinksData(options)
  }

  const resolvedAuth = auth ?? await getDashboardAuth()
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 10),
    status: options.status ?? '',
    campaignId: options.campaignId ?? '',
    search: options.search ?? '',
  })

  return fetchDbJson<LinksResponse>(`/links?${params.toString()}`, resolvedAuth, 'Failed to load links')
}

export async function getDashboardBootstrapData(options: DashboardBootstrapOptions = {}): Promise<DashboardBootstrapData> {
  const period = options.period ?? '30d'
  const activityLimit = options.activityLimit ?? 20
  const linksLimit = options.linksLimit ?? 50
  const forecastDays = options.forecastDays ?? 30
  const auth = options.auth === undefined ? await getDashboardAuth() : options.auth
  const errors: string[] = []

  const [dashboard, activity, goals, links, forecast] = await Promise.all([
    getDashboardData(period, auth).catch((error) => {
      errors.push(error instanceof Error ? error.message : String(error))
      return null
    }),
    getActivityFeed(activityLimit, auth).catch((error) => {
      errors.push(error instanceof Error ? error.message : String(error))
      return null
    }),
    getGoalsData(auth).catch((error) => {
      errors.push(error instanceof Error ? error.message : String(error))
      return null
    }),
    getLinksData({ limit: linksLimit }, auth).catch((error) => {
      errors.push(error instanceof Error ? error.message : String(error))
      return null
    }),
    Promise.resolve(getForecastResponse(forecastDays, getForecastHistoryDays(period))).catch((error) => {
      errors.push(error instanceof Error ? error.message : String(error))
      return null
    }),
  ])

  return {
    period,
    forecastDays,
    dashboard,
    activity,
    goals,
    links,
    forecast,
    generatedAt: new Date().toISOString(),
    errors,
  }
}
