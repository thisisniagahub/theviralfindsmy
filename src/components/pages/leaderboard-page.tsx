'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import {
  Trophy,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  Target,
  Award,
  ChevronUp,
  ChevronDown,
  Medal,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================

interface Affiliate {
  rank: number
  name: string
  initials: string
  totalEarnings: number
  totalClicks: number
  totalConversions: number
  conversionRate: number
  activeLinks: number
  trend: 'up' | 'down' | 'neutral'
  weeklyChange: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  isCurrentUser: boolean
}

interface LeaderboardResponse {
  affiliates: Affiliate[]
  userRank: Affiliate | null
  summary: {
    totalAffiliates: number
    tierCounts: Record<string, number>
    topEarnings: number
    averageEarnings: number
    nextTierThreshold: number
  }
}

// ============================================================
// Constants
// ============================================================

type PeriodFilter = 'week' | 'month' | 'all'

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

const tierConfig: Record<
  string,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  diamond: {
    label: 'Diamond',
    bgClass: 'bg-cyan-100 dark:bg-cyan-900/30',
    textClass: 'text-cyan-700 dark:text-cyan-400',
    borderClass: 'border-cyan-300/50 dark:border-cyan-700/30',
  },
  platinum: {
    label: 'Platinum',
    bgClass: 'bg-slate-100 dark:bg-slate-800/40',
    textClass: 'text-slate-600 dark:text-slate-300',
    borderClass: 'border-slate-400/50 dark:border-slate-600/30',
  },
  gold: {
    label: 'Gold',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    borderClass: 'border-yellow-400/40 dark:border-yellow-600/30',
  },
  silver: {
    label: 'Silver',
    bgClass: 'bg-gray-100 dark:bg-gray-800/40',
    textClass: 'text-gray-600 dark:text-gray-300',
    borderClass: 'border-gray-300/50 dark:border-gray-600/30',
  },
  bronze: {
    label: 'Bronze',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-300/50 dark:border-amber-700/30',
  },
}

const rankBgClasses: Record<number, string> = {
  1: 'rank-1',
  2: 'rank-2',
  3: 'rank-3',
}

const rankBadgeClasses: Record<number, string> = {
  1: 'rank-badge-1',
  2: 'rank-badge-2',
  3: 'rank-badge-3',
}

// ============================================================
// Helpers
// ============================================================

function formatEarnings(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-MY')
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5" />
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5" />
  return <Minus className="w-3.5 h-3.5" />
}

// ============================================================
// Sub-components
// ============================================================

function TierBadge({ tier }: { tier: string }) {
  const config = tierConfig[tier]
  if (!config) return null
  return (
    <Badge
      variant="secondary"
      className={`text-[10px] px-2 py-0.5 font-semibold ${config.bgClass} ${config.textClass}`}
    >
      {config.label}
    </Badge>
  )
}

function PodiumCard({
  affiliate,
  podiumIndex,
}: {
  affiliate: Affiliate
  podiumIndex: number
}) {
  const isFirst = affiliate.rank === 1
  const bgClass = rankBgClasses[affiliate.rank]
  const badgeClass = rankBadgeClasses[affiliate.rank]

  const sizes = ['order-2 lg:order-1 lg:mt-8', 'order-1 lg:order-2 lg:mt-0', 'order-3 lg:order-3 lg:mt-12']
  const cardSizes = [
    'lg:w-64',
    'lg:w-72',
    'lg:w-60',
  ]

  return (
    <motion.div
      className={`flex-1 ${sizes[podiumIndex]}`}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 + podiumIndex * 0.15, ease: 'easeOut' }}
    >
      <Card
        className={`
          relative overflow-hidden rounded-2xl border transition-all duration-300
          ${bgClass || 'border-border/50'}
          glass-card card-elevated ${cardSizes[podiumIndex]}
        `}
      >
        {/* Gradient accent */}
        <div
          className={`h-1.5 w-full ${
            isFirst
              ? 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500'
              : affiliate.rank === 2
                ? 'bg-gradient-to-r from-gray-300 via-gray-200 to-gray-400'
                : 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700'
          }`}
        />

        <CardContent className="p-5 pt-6">
          <div className="flex flex-col items-center text-center gap-3">
            {/* Rank badge with Crown for #1 */}
            <div className="relative">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${badgeClass || 'bg-muted text-muted-foreground'}`}>
                {affiliate.rank}
              </div>
              {isFirst && (
                <motion.div
                  className="absolute -top-3 -right-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
                >
                  <Crown className="w-6 h-6 text-yellow-500" />
                </motion.div>
              )}
            </div>

            {/* Initials avatar */}
            <div
              className={`
                w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold
                ${isFirst
                  ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 ring-2 ring-yellow-400/50'
                  : affiliate.rank === 2
                    ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 ring-2 ring-gray-300/50'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/40'
                }
              `}
            >
              {affiliate.initials}
            </div>

            {/* Name */}
            <div>
              <h3 className={`text-sm font-bold ${isFirst ? 'text-gradient-gold' : 'text-foreground'}`}>
                {affiliate.name}
              </h3>
              <TierBadge tier={affiliate.tier} />
            </div>

            {/* Earnings */}
            <div>
              <p className={`text-xl font-bold ${isFirst ? 'text-gradient-shopee' : ''}`}>
                {formatEarnings(affiliate.totalEarnings)}
              </p>
              <p className="text-xs text-muted-foreground">Total Earnings</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 w-full mt-1">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <Target className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-bold">{formatNumber(affiliate.totalClicks)}</p>
                <p className="text-[10px] text-muted-foreground">Clicks</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <DollarSign className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-bold">{formatNumber(affiliate.totalConversions)}</p>
                <p className="text-[10px] text-muted-foreground">Sales</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <Award className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-bold">{affiliate.conversionRate}%</p>
                <p className="text-[10px] text-muted-foreground">Conv.</p>
              </div>
            </div>

            {/* Weekly change */}
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${
                affiliate.trend === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : affiliate.trend === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-muted-foreground'
              }`}
            >
              <TrendIcon trend={affiliate.trend} />
              <span>
                {affiliate.weeklyChange > 0 ? '+' : ''}
                {affiliate.weeklyChange}% this week
              </span>
            </div>
          </div>
        </CardContent>

        {/* Decorative glow */}
        {isFirst && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-shopee/10 blur-3xl" />
          </div>
        )}
      </Card>
    </motion.div>
  )
}

function UserRankCard({ user }: { user: Affiliate }) {
  const progressToNext = Math.min(
    Math.round((user.totalEarnings / 16500) * 100),
    99
  )
  const earningsToNext = Math.max(16500 - user.totalEarnings, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.7, ease: 'easeOut' }}
    >
      <Card className="gradient-border overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Medal className="w-5 h-5 text-shopee" />
              Your Rank
            </CardTitle>
            <Badge className="badge-gradient text-xs px-3 py-1">
              #{user.rank} of 15
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Rank circle */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-shopee to-shopee-light flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-shopee/20">
                #{user.rank}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center ${
                  user.trend === 'up'
                    ? 'bg-green-500 text-white'
                    : user.trend === 'down'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-400 text-white'
                }`}
              >
                {user.trend === 'up' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : user.trend === 'down' ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 text-center sm:text-left space-y-3 w-full">
              <div>
                <h3 className="text-lg font-bold text-foreground">{user.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <TierBadge tier={user.tier} />
                  <span
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      user.weeklyChange > 0
                        ? 'metric-positive'
                        : user.weeklyChange < 0
                          ? 'metric-negative'
                          : 'text-muted-foreground'
                    }`}
                  >
                    <TrendIcon trend={user.trend} />
                    {user.weeklyChange > 0 ? '+' : ''}
                    {user.weeklyChange}% this week
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-muted/50">
                  <p className="text-sm font-bold metric-money">{formatEarnings(user.totalEarnings)}</p>
                  <p className="text-[10px] text-muted-foreground">Total Earnings</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50">
                  <p className="text-sm font-bold">{formatNumber(user.totalClicks)}</p>
                  <p className="text-[10px] text-muted-foreground">Total Clicks</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50">
                  <p className="text-sm font-bold">{formatNumber(user.totalConversions)}</p>
                  <p className="text-[10px] text-muted-foreground">Conversions</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50">
                  <p className="text-sm font-bold">{user.conversionRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Conv. Rate</p>
                </div>
              </div>

              {/* Progress to next tier */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Progress to Diamond
                  </span>
                  <span className="text-[11px] font-bold text-shopee">
                    {progressToNext}%
                  </span>
                </div>
                <div className="progress-bar-animated">
                  <div className="progress-fill" style={{ width: `${progressToNext}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {formatEarnings(earningsToNext)} more to reach Diamond tier
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RankingsRow({
  affiliate,
  index,
}: {
  affiliate: Affiliate
  index: number
}) {
  const isUser = affiliate.isCurrentUser

  return (
    <motion.tr
      className={`
        border-b transition-colors duration-150 table-row-hover
        ${isUser ? 'bg-shopee/5 dark:bg-shopee/10' : ''}
      `}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.9 + index * 0.04 }}
    >
      {/* Rank */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {affiliate.rank <= 3 ? (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rankBadgeClasses[affiliate.rank]}`}
            >
              {affiliate.rank}
            </div>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground w-8 text-center">
              {affiliate.rank}
            </span>
          )}
        </div>
      </td>

      {/* Affiliate */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div
            className={`
              w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
              ${isUser
                ? 'bg-shopee/10 text-shopee ring-2 ring-shopee/30'
                : 'bg-muted text-muted-foreground'
              }
            `}
          >
            {affiliate.initials}
          </div>
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold truncate ${isUser ? 'text-shopee' : 'text-foreground'}`}
            >
              {affiliate.name}
              {isUser && (
                <span className="text-[10px] ml-1.5 text-shopee/70 font-normal">(You)</span>
              )}
            </p>
            <TierBadge tier={affiliate.tier} />
          </div>
        </div>
      </td>

      {/* Earnings */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-bold metric-money">
          {formatEarnings(affiliate.totalEarnings)}
        </span>
      </td>

      {/* Clicks */}
      <td className="py-3 px-4 text-right hidden md:table-cell">
        <span className="text-sm">{formatNumber(affiliate.totalClicks)}</span>
      </td>

      {/* Conversions */}
      <td className="py-3 px-4 text-right hidden lg:table-cell">
        <span className="text-sm">{formatNumber(affiliate.totalConversions)}</span>
      </td>

      {/* Conversion Rate */}
      <td className="py-3 px-4 text-right hidden lg:table-cell">
        <span className="text-sm font-medium">{affiliate.conversionRate}%</span>
      </td>

      {/* Active Links */}
      <td className="py-3 px-4 text-right hidden xl:table-cell">
        <span className="text-sm">{affiliate.activeLinks}</span>
      </td>

      {/* Trend */}
      <td className="py-3 px-4 text-right">
        <div
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            affiliate.trend === 'up'
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : affiliate.trend === 'down'
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400'
          }`}
        >
          <TrendIcon trend={affiliate.trend} />
          {affiliate.weeklyChange > 0 ? '+' : ''}
          {affiliate.weeklyChange}%
        </div>
      </td>
    </motion.tr>
  )
}

// ============================================================
// Loading Skeleton
// ============================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-9 w-64 rounded-lg" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Podium skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-2xl" />
        ))}
      </div>

      {/* Your rank skeleton */}
      <Skeleton className="h-52 rounded-xl" />

      {/* Table skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

export function LeaderboardPage() {
  const [period, setPeriod] = useState<PeriodFilter>('all')

  const { data, isLoading } = useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', period],
    queryFn: () => fetch('/api/leaderboard').then((r) => r.json()),
  })

  const affiliates = data?.affiliates || []
  const userRank = data?.userRank
  const summary = data?.summary

  const top3 = affiliates.slice(0, 3)
  const remainingAffiliates = affiliates.slice(3)

  // Summary stats cards
  const statsCards = [
    {
      label: 'Total Affiliates',
      value: summary ? summary.totalAffiliates.toString() : '—',
      icon: Users,
      color: 'text-shopee bg-shopee/10',
    },
    {
      label: 'Top Earner',
      value: summary ? formatEarnings(summary.topEarnings) : '—',
      icon: Trophy,
      color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
    },
    {
      label: 'Avg. Earnings',
      value: summary ? formatEarnings(summary.averageEarnings) : '—',
      icon: DollarSign,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
    },
    {
      label: 'Your Position',
      value: userRank ? `#${userRank.rank}` : '—',
      icon: Award,
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
    },
  ]

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* ============================================================
          Header
          ============================================================ */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-shopee/10">
            <Trophy className="w-5 h-5 text-shopee" />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              Affiliate Leaderboard
              <Crown className="w-4 h-4 text-yellow-500" />
            </h2>
            <p className="text-sm text-muted-foreground">
              See how you rank among top affiliates in Malaysia
            </p>
          </div>
        </div>

        {/* Period filter tabs */}
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as PeriodFilter)}
        >
          <TabsList className="h-9">
            {periodOptions.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value} className="text-xs px-3">
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* ============================================================
          Summary Stats Cards
          ============================================================ */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {statsCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
            >
              <Card className="card-elevated border-border/50">
                <CardContent className="p-4">
                  <div className={`p-2 rounded-lg w-fit mb-2 ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* ============================================================
          Top 3 Podium
          ============================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
          <Medal className="w-4 h-4" />
          Top Performers
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
          {top3.map((affiliate, idx) => (
            <PodiumCard
              key={affiliate.rank}
              affiliate={affiliate}
              podiumIndex={idx}
            />
          ))}
        </div>
      </motion.div>

      {/* ============================================================
          Your Rank Card
          ============================================================ */}
      {userRank && <UserRankCard user={userRank} />}

      {/* ============================================================
          Full Rankings Table
          ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.85 }}
      >
        <Card className="card-elevated overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-shopee" />
              Full Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-16">
                      Rank
                    </th>
                    <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Affiliate
                    </th>
                    <th className="py-2.5 px-4 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Earnings
                    </th>
                    <th className="py-2.5 px-4 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Clicks
                    </th>
                    <th className="py-2.5 px-4 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Conversions
                    </th>
                    <th className="py-2.5 px-4 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Rate
                    </th>
                    <th className="py-2.5 px-4 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                      Links
                    </th>
                    <th className="py-2.5 px-4 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {remainingAffiliates.map((affiliate, index) => (
                    <RankingsRow
                      key={affiliate.rank}
                      affiliate={affiliate}
                      index={index}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================================
          Tier Legend
          ============================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      >
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="text-xs font-semibold text-muted-foreground">Tiers:</span>
              {Object.entries(tierConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${config.bgClass} ${config.textClass} ring-1 ring-current/20`} />
                  <span className={`text-[11px] font-medium ${config.textClass}`}>
                    {config.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
