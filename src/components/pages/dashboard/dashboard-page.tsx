'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, MousePointerClick, TrendingUp, DollarSign,
  ChevronRight, Clock, Target, Plus, Calendar, AlertTriangle,
} from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

import {
  type DashboardData, type ActivityApiResponse,
  formatRM, periodOptions,
} from './dashboard-shared'
import { WelcomeBanner } from './welcome-banner'
import { type StatItem } from './stat-cards'
import { StatCards } from './stat-cards'
import { PerformanceScore } from './performance-score'
import { QuickActions } from './quick-actions'
import { EarningsChart } from './earnings-chart'
import { ClicksChart } from './clicks-chart'
import { TopProducts } from './top-products'
import { RecentActivity } from './recent-activity'
import { ActivityFeed } from './activity-feed'

export function DashboardPage() {
  const router = useRouter()

  const navigatePage = useCallback((page: string) => {
    const pathMap: Record<string, string> = {
      dashboard: '/',
      products: '/products',
      links: '/links',
      analytics: '/analytics',
      calculator: '/calculator',
      campaigns: '/campaigns',
      leaderboard: '/leaderboard',
      achievements: '/achievements',
      activity: '/activity',
      earnings: '/earnings',
      settings: '/settings',
      notifications: '/notifications',
      referral: '/referral',
      'shopee-integration': '/shopee-integration',
      'agent-office': '/agent-office',
      openclaw: '/openclaw',
    }
    router.push(pathMap[page] || `/${page}`)
  }, [router])
  const [period, setPeriod] = useState('30d')
  const [activityOpen, setActivityOpen] = useState(false)
  // "last updated" timer (kept for future use)
  const [_lastUpdated] = useState('just now')
  const [minutesAgo, setMinutesAgo] = useState(0)

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard', period],
    queryFn: () => fetch(`/api/dashboard?period=${period}`).then((r) => r.json()),
  })

  const { data: activityData, isFetching: isActivityFetching, refetch: refetchActivity } = useQuery<{
    activities: ActivityApiResponse[]
    total: number
  }>({
    queryKey: ['activity'],
    queryFn: () => fetch('/api/activity').then((r) => r.json()),
    refetchInterval: 30000,
  })

  const activityItems = useMemo(() => {
    if (!activityData?.activities?.length) return []
    return activityData.activities.slice(0, 8)
  }, [activityData])

  const { data: goalsData } = useQuery({
    queryKey: ['goals'],
    queryFn: () => fetch('/api/goals').then((r) => r.json()),
  })

  const { data: linksData } = useQuery({
    queryKey: ['links-expiring'],
    queryFn: () => fetch('/api/links?limit=50').then((r) => r.json()),
  })

  const expiringLinks = useMemo(() => {
    if (!linksData?.links) return []
    return linksData.links.filter((l: { expiryStatus: string; expiresIn: number | null; isExpired: boolean }) =>
      l.expiryStatus === 'expiring_soon' || l.isExpired
    ).sort((a: { expiresIn: number | null }, b: { expiresIn: number | null }) => (a.expiresIn ?? 999) - (b.expiresIn ?? 999))
  }, [linksData])

  // Update "last updated" timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesAgo((prev) => prev + 1)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const todayStr = new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const exportCSV = useCallback(() => {
    if (!data) return
    const rows = [
      ['Metric', 'Value'],
      ['Total Clicks', data.totalClicks.toString()],
      ['Total Conversions', data.totalConversions.toString()],
      ['Total Earnings (RM)', data.totalEarnings.toFixed(2)],
      ['Conversion Rate (%)', data.conversionRate.toString()],
      ['Total Links', data.totalLinks.toString()],
      [],
      ['Date', 'Earnings (RM)', 'Clicks'],
      ...(data.earningsData || []).map((d) => [d.date, d.earnings.toFixed(2), d.clicks.toString()]),
      [],
      ['Top Link', 'Clicks', 'Conversions', 'Earnings (RM)'],
      ...(data.topLinks || []).map((l) => [l.name, l.clicks.toString(), l.conversions.toString(), l.earnings.toFixed(2)]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shopee-affiliate-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  const exportPDF = useCallback(() => {
    window.print()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  const stats: StatItem[] = [
    {
      label: 'Total Clicks',
      value: data?.totalClicks || 0,
      displayValue: (data?.totalClicks || 0).toLocaleString(),
      icon: MousePointerClick,
      trend: '+12.5%',
      trendUp: true,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      gradient: 'from-white to-blue-50/50 dark:from-card dark:to-blue-900/10',
      sparkline: '5,10 18,8 36,12 54,6',
    },
    {
      label: 'Conversions',
      value: data?.totalConversions || 0,
      displayValue: (data?.totalConversions || 0).toLocaleString(),
      icon: TrendingUp,
      trend: '+8.2%',
      trendUp: true,
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      gradient: 'from-white to-green-50/50 dark:from-card dark:to-green-900/10',
      sparkline: '5,14 18,10 36,10 54,6',
    },
    {
      label: 'Total Earnings',
      value: data?.totalEarnings || 0,
      displayValue: formatRM(data?.totalEarnings || 0),
      icon: DollarSign,
      trend: '+23.1%',
      trendUp: true,
      color: 'text-shopee bg-shopee/10',
      gradient: 'from-white to-orange-50/50 dark:from-card dark:to-orange-900/10',
      isRM: true,
      sparkline: '5,18 18,16 36,8 54,4',
    },
    {
      label: 'Conversion Rate',
      value: data?.conversionRate || 0,
      displayValue: `${data?.conversionRate || 0}%`,
      icon: Eye,
      trend: '-0.3%',
      trendUp: false,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
      gradient: 'from-white to-purple-50/50 dark:from-card dark:to-purple-900/10',
      isPercent: true,
      sparkline: '5,10 18,14 36,8 54,6',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner
        totalEarnings={data?.totalEarnings || 0}
        todayStr={todayStr}
        onExportCSV={exportCSV}
        onExportPDF={exportPDF}
      />

      {/* Stats Cards + Performance Score */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCards stats={stats} />
        <PerformanceScore
          performanceScore={data?.performanceScore || 0}
          performanceGrade={data?.performanceGrade || 'F'}
          scoreBreakdown={data?.scoreBreakdown || []}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions onNavigate={navigatePage} onExportCSV={exportCSV} />

      {/* Section divider */}
      <div className="section-divider" />

      {/* Charts Section */}
      <div>
        {/* Header with Date Range + Last Updated */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Performance Overview</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <RefreshCw className="w-3 h-3" />
              Last updated: {minutesAgo === 0 ? 'just now' : `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`}
            </div>
          </div>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="h-8">
              {periodOptions.map((opt) => (
                <TabsTrigger key={opt.value} value={opt.value} className="text-xs px-2.5 py-1 h-6">
                  {opt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Charts Row */}
        <EarningsChart
          earningsData={data?.earningsData || []}
          countryData={data?.countryData || []}
        />

        {/* Clicks Bar Chart — hidden on mobile */}
        <ClicksChart earningsData={data?.earningsData || []} />
      </div>

      {/* Goals Tracker Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.75 }}
      >
        <Card className="glass-card card-accent border-shopee/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-shopee" />
                Earnings Goals
              </CardTitle>
              <Button
                size="sm"
                className="btn-shopee text-xs h-7"
                onClick={() => navigatePage('earnings')}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Goal
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {(goalsData?.goals || []).slice(0, 3).map((goal: {
                id: string; name: string; targetAmount: number; currentAmount: number;
                period: string; status: string; endDate: string | null
              }, index: number) => {
                const pct = goal.targetAmount > 0
                  ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
                  : 0
                const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)
                const pctColor = pct >= 80 ? 'text-green-600 dark:text-green-400' : pct >= 50 ? 'text-shopee' : 'text-red-500'
                const barColor = pct >= 80 ? 'from-green-500 to-emerald-400' : pct >= 50 ? 'from-shopee to-orange-400' : 'from-red-500 to-red-400'
                const daysLeft = goal.endDate
                  ? Math.max(Math.ceil((new Date(goal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 0)
                  : null
                const periodBadgeColor: Record<string, string> = {
                  monthly: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                  weekly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                  yearly: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                  custom: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
                }
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.8 + index * 0.08 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium truncate">{goal.name}</p>
                        {goal.status === 'achieved' && (
                          <span className="text-xs">✨</span>
                        )}
                        <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 flex-shrink-0 ${periodBadgeColor[goal.period] || ''}`}>
                          {goal.period}
                        </Badge>
                        {goal.status === 'achieved' && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Achieved!
                          </Badge>
                        )}
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${pctColor}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${barColor} progress-bar-animated`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.9 + index * 0.08, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="metric-money font-medium">{formatRM(goal.currentAmount)} / {formatRM(goal.targetAmount)}</span>
                      <div className="flex items-center gap-3">
                        {goal.status !== 'achieved' && (
                          <span>RM {remaining.toFixed(2)} remaining</span>
                        )}
                        {daysLeft !== null && goal.status === 'active' && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {daysLeft}d left
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-shopee text-xs hover:text-shopee-dark"
              onClick={() => navigatePage('earnings')}
            >
              View All Goals <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expiring Soon Widget */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.78 }}
      >
        {expiringLinks.length > 0 && (
          <Card className="glass-card shadow-sm border-amber-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Expiring Soon
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                  {expiringLinks.length} link{expiringLinks.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {expiringLinks.slice(0, 3).map((link: { id: string; name: string; productName: string | null; expiresIn: number | null; isExpired: boolean; earnings: number }, idx: number) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.8 + idx * 0.05 }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigatePage('links')}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${link.isExpired ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                        <Clock className={`w-4 h-4 ${link.isExpired ? 'text-red-500' : 'text-amber-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{link.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{link.productName || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {link.isExpired ? (
                        <Badge variant="secondary" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20">Expired</Badge>
                      ) : (
                        <Badge variant="secondary" className={`text-[10px] px-2 py-0 ${link.expiresIn !== null && link.expiresIn <= 3 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'}`}>
                          {link.expiresIn}d left
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Bottom Row: Top Links + Conversions | Top Products + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Links & Conversions Tabs */}
        <RecentActivity
          topLinks={data?.topLinks || []}
          recentConversions={data?.recentConversions || []}
        />

        {/* Top Products + Activity Column */}
        <div className="space-y-4 lg:space-y-6">
          <TopProducts topLinks={data?.topLinks || []} onNavigate={navigatePage} />
          <ActivityFeed
            activityItems={activityItems}
            activityOpen={activityOpen}
            onActivityOpenChange={setActivityOpen}
            isActivityFetching={isActivityFetching}
            onRefetchActivity={() => refetchActivity()}
            onNavigate={navigatePage}
          />
        </div>
      </div>
    </div>
  )
}
