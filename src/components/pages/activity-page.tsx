'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ShoppingCart, MousePointer, Wallet, ArrowUpRight, Target, Trophy,
  Megaphone, Flag, Link2, Edit, Trash2, Activity, ChevronDown,
  Clock, TrendingUp, Calendar, Filter, Loader2, Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ActivityData {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  time: string
  metadata: Record<string, unknown>
  icon: string
}

interface ActivityResponse {
  activities: ActivityData[]
  totalActivities: number
  todayCount: number
  thisWeekCount: number
  hasMore: boolean
}

const typeFilters = [
  { id: 'all', label: 'All', types: [] },
  { id: 'conversions', label: 'Conversions', types: ['conversion'] },
  { id: 'links', label: 'Links', types: ['link_created', 'link_updated', 'link_deleted'] },
  { id: 'payouts', label: 'Payouts', types: ['payout_received', 'payout_requested'] },
  { id: 'goals', label: 'Goals', types: ['goal_created', 'goal_achieved'] },
  { id: 'campaigns', label: 'Campaigns', types: ['campaign_started', 'campaign_ended'] },
]

const timeRanges = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
]

const iconConfig: Record<string, {
  component: React.ComponentType<{ className?: string }>
  colorClass: string
  bgClass: string
  dotColor: string
}> = {
  link_created: { component: Link2, colorClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-50 dark:bg-green-900/20', dotColor: 'bg-green-500' },
  link_updated: { component: Edit, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-900/20', dotColor: 'bg-blue-500' },
  link_deleted: { component: Trash2, colorClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-900/20', dotColor: 'bg-red-500' },
  conversion: { component: ShoppingCart, colorClass: 'text-shopee dark:text-shopee', bgClass: 'bg-shopee/10 dark:bg-shopee/20', dotColor: 'bg-shopee' },
  click_milestone: { component: MousePointer, colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-50 dark:bg-purple-900/20', dotColor: 'bg-purple-500' },
  payout_received: { component: Wallet, colorClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-50 dark:bg-green-900/20', dotColor: 'bg-green-500' },
  payout_requested: { component: ArrowUpRight, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-900/20', dotColor: 'bg-blue-500' },
  goal_created: { component: Target, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-900/20', dotColor: 'bg-blue-500' },
  goal_achieved: { component: Trophy, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-900/20', dotColor: 'bg-amber-500' },
  campaign_started: { component: Megaphone, colorClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-50 dark:bg-green-900/20', dotColor: 'bg-green-500' },
  campaign_ended: { component: Flag, colorClass: 'text-gray-600 dark:text-gray-400', bgClass: 'bg-gray-50 dark:bg-gray-900/20', dotColor: 'bg-gray-500' },
}

export function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [activeRange, setActiveRange] = useState('all')
  const [limit, setLimit] = useState(20)

  const typeParam = typeFilters.find(f => f.id === activeFilter)?.types.join(',') || ''

  const { data, isLoading, isFetching, refetch } = useQuery<ActivityResponse>({
    queryKey: ['activity-feed', activeFilter, activeRange, limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (typeParam) params.set('type', typeParam)
      if (activeRange !== 'all') params.set('range', activeRange)
      params.set('limit', limit.toString())
      const res = await fetch(`/api/activity?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch activities')
      return res.json()
    },
  })

  const activities = data?.activities || []
  const hasMore = data?.hasMore || false
  const totalActivities = data?.totalActivities || 0
  const todayCount = data?.todayCount || 0
  const thisWeekCount = data?.thisWeekCount || 0

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId)
    setLimit(20)
  }

  const handleRangeChange = (rangeId: string) => {
    setActiveRange(rangeId)
    setLimit(20)
  }

  const loadMore = () => {
    if (!hasMore) return
    setLimit(prev => prev + 20)
  }

  // Simulate live pulse — refetch every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000)
    return () => clearInterval(interval)
  }, [refetch])

  const isInitialLoading = isLoading
  const isLoadingMore = isFetching && !isLoading

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-shopee/10 text-shopee">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Activity Feed</h1>
            <p className="text-sm text-muted-foreground">Track all your affiliate activities in real-time</p>
          </div>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border bg-card p-4 card-elevated"
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{isInitialLoading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : totalActivities}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-4 card-elevated"
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-shopee" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today</span>
          </div>
          <p className="text-2xl font-bold text-shopee">{isInitialLoading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : todayCount}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-4 card-elevated"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Week</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{isInitialLoading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : thisWeekCount}</p>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl border border-border p-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Type Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 mr-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Filter:</span>
            </div>
            {typeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                  activeFilter === filter.id
                    ? 'bg-shopee text-white shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => handleRangeChange(range.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200',
                    activeRange === range.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Activity Timeline */}
      <div className="relative">
        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-shopee mb-3" />
            <p className="text-sm text-muted-foreground">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No activities found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {activeFilter !== 'all' || activeRange !== 'all'
                ? 'Try changing your filters to see more activities.'
                : 'Your activity feed is empty. Start creating links and sharing them to see activities here.'}
            </p>
            {(activeFilter !== 'all' || activeRange !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => { handleFilterChange('all'); handleRangeChange('all') }}
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Timeline Container */}
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[19px] sm:left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-shopee via-shopee/30 to-transparent" />

              {/* Activity Cards */}
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {activities.map((activity, index) => {
                    const config = iconConfig[activity.type] || iconConfig.link_created
                    const Icon = config.component
                    const isLast = index === activities.length - 1

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{
                          duration: 0.3,
                          delay: Math.min(index * 0.04, 0.5),
                          ease: 'easeOut',
                        }}
                        layout
                        className="relative pl-10 sm:pl-12"
                      >
                        {/* Timeline Dot */}
                        <div className={cn(
                          'absolute left-[14px] sm:left-[18px] top-5 w-3 h-3 rounded-full border-2 border-background z-10',
                          config.dotColor
                        )} />

                        {/* Activity Card */}
                        <div className={cn(
                          'group rounded-xl border border-border bg-card p-4 transition-all duration-300 mb-2',
                          'hover:shadow-md hover:border-shopee/20 hover:bg-card/95 card-elevated',
                        )}>
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={cn(
                              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110',
                              config.bgClass,
                              config.colorClass
                            )}>
                              <Icon className="w-5 h-5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                                  {activity.title}
                                </h3>
                                <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                                  {activity.time}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                {activity.description}
                              </p>
                              {/* Type Badge */}
                              <div className="mt-2 flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'text-[10px] px-1.5 py-0 h-5 border-0 font-medium',
                                    config.bgClass,
                                    config.colorClass
                                  )}
                                >
                                  {activity.type.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Spacing after last item for timeline fade */}
                        {isLast && <div className="h-8" />}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-6 mb-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="gap-2 px-6 hover:bg-shopee hover:text-white hover:border-shopee transition-all duration-300"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Load More Activities
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
