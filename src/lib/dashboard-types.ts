export interface DashboardChartPoint {
  date: string
  earnings: number
  clicks: number
}

export interface DashboardScoreBreakdownItem {
  label: string
  earned: number
  max: number
}

export interface DashboardCampaignSummary {
  id?: string
  name: string
}

export interface DashboardLinkSummary {
  id: string
  name: string
  productName: string | null
  productImage: string | null
  clicks: number
  conversions: number
  earnings: number
  status: string
  shortCode: string
  category: string | null
  campaign: DashboardCampaignSummary | null
  expiryStatus?: string
  expiresIn?: number | null
  isExpired?: boolean
}

export interface DashboardConversionItem {
  id: string
  orderId: string
  amount: number
  commission: number
  status: string
  createdAt: string
  affiliateLink: {
    name: string
    productName: string
    shortCode: string
  } | null
}

export interface DashboardCountryPoint {
  name: string
  value: number
}

export interface DashboardData {
  totalLinks: number
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  conversionRate: number
  earningsData: DashboardChartPoint[]
  topLinks: DashboardLinkSummary[]
  recentConversions: DashboardConversionItem[]
  countryData: DashboardCountryPoint[]
  period: string
  performanceScore: number
  performanceGrade: string
  scoreBreakdown: DashboardScoreBreakdownItem[]
  _demo?: boolean
  _unavailable?: boolean
  _hint?: string
}

export interface ActivityApiResponse {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  icon: string
  time: string
  color?: string
  borderClass?: string
  metadata?: Record<string, unknown>
}

export interface ActivityFeedResponse {
  activities: ActivityApiResponse[]
  total?: number
  totalActivities?: number
  todayCount?: number
  thisWeekCount?: number
  limit?: number
  hasMore?: boolean
}

export interface DashboardGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  period: string
  startDate: string
  endDate: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface GoalsSummary {
  totalGoals: number
  activeGoals: number
  achievedGoals: number
  totalTarget: number
  totalCurrent: number
  overallProgress: number
}

export interface GoalsResponse {
  goals: DashboardGoal[]
  summary: GoalsSummary
}

export interface LinksResponse {
  links: DashboardLinkSummary[]
  campaigns?: DashboardCampaignSummary[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ForecastPoint {
  date: string
  value: number
  confidence: number
}

export interface ForecastData {
  optimistic: ForecastPoint[]
  expected: ForecastPoint[]
  pessimistic: ForecastPoint[]
  trend: 'up' | 'down' | 'stable'
  growthRate: number
  suggestedAction: string
}

export interface ForecastResponse {
  success: boolean
  forecast: ForecastData
  rateSuggestion?: unknown
  historicalData?: Array<{
    date: string
    earnings: number
    clicks: number
  }>
}

export interface DashboardBootstrapData {
  period: string
  forecastDays: number
  dashboard: DashboardData | null
  activity: ActivityFeedResponse | null
  goals: GoalsResponse | null
  links: LinksResponse | null
  forecast: ForecastResponse | null
  generatedAt: string
  errors: string[]
}
