'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Award,
  Trophy,
  Target,
  Link2,
  DollarSign,
  Share2,
  Flame,
  Lock,
  CheckCircle,
  Star,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'clicks' | 'earnings' | 'links' | 'social' | 'streak'
  tier: 'bronze' | 'silver' | 'gold'
  progress: number
  unlocked: boolean
  unlockedAt: string | null
  requirement: string
}

interface AchievementsResponse {
  achievements: Achievement[]
  summary: {
    total: number
    unlocked: number
    locked: number
    percentage: number
  }
  categoryStats: Record<string, { unlocked: number; total: number }>
  userStats: {
    totalClicks: number
    totalEarnings: number
    totalLinks: number
    totalShares: number
    currentStreak: number
  }
}

// ============================================================
// Constants
// ============================================================

type CategoryFilter = 'all' | 'clicks' | 'earnings' | 'links' | 'social' | 'streak'

const categoryFilters: { value: CategoryFilter; label: string; icon: typeof Target }[] = [
  { value: 'all', label: 'All', icon: Trophy },
  { value: 'clicks', label: 'Clicks', icon: Target },
  { value: 'earnings', label: 'Earnings', icon: DollarSign },
  { value: 'links', label: 'Links', icon: Link2 },
  { value: 'social', label: 'Social', icon: Share2 },
  { value: 'streak', label: 'Streak', icon: Flame },
]

const tierConfig: Record<string, { label: string; bgClass: string; textClass: string; glowClass: string; borderClass: string }> = {
  bronze: {
    label: 'Bronze',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    glowClass: '',
    borderClass: 'border-amber-300/50 dark:border-amber-700/30',
  },
  silver: {
    label: 'Silver',
    bgClass: 'bg-gray-100 dark:bg-gray-800/40',
    textClass: 'text-gray-600 dark:text-gray-300',
    glowClass: '',
    borderClass: 'border-gray-300/50 dark:border-gray-600/30',
  },
  gold: {
    label: 'Gold',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    glowClass: 'achievement-glow-gold',
    borderClass: 'border-yellow-400/40 dark:border-yellow-600/30',
  },
}

const categoryGlowMap: Record<string, string> = {
  clicks: 'achievement-glow-shopee',
  earnings: 'achievement-glow-gold',
  links: 'achievement-glow-purple',
  social: 'achievement-glow-green',
  streak: 'achievement-glow-shopee',
}

// ============================================================
// Sub-components
// ============================================================

function CircularProgressRing({
  percentage,
  size = 140,
  strokeWidth = 10,
}: {
  percentage: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EE4D2D" />
            <stop offset="50%" stopColor="#FF6742" />
            <stop offset="100%" stopColor="#FFB347" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-gradient-shopee"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
        >
          {percentage}%
        </motion.span>
        <span className="text-[11px] text-muted-foreground font-medium mt-0.5">completed</span>
      </div>
    </div>
  )
}

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const tier = tierConfig[achievement.tier]
  const glowClass = achievement.unlocked ? categoryGlowMap[achievement.category] || '' : ''
  const displayedProgress = achievement.unlocked ? 100 : achievement.progress

  const handleMouseEnter = () => {
    if (achievement.unlocked && achievement.unlockedAt) {
      const dateStr = new Date(achievement.unlockedAt).toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      toast.success(`🏆 ${achievement.name}`, {
        description: `Unlocked on ${dateStr}!`,
        duration: 2500,
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Card
        className={`
          relative overflow-hidden rounded-xl border transition-all duration-300 h-full
          ${achievement.unlocked
            ? `${glowClass} ${tier.borderClass} glass-card`
            : 'border-border/50 opacity-75'
          }
          card-tilt hover-scale-lg cursor-default
        `}
        onMouseEnter={handleMouseEnter}
      >
        {/* Gradient accent top bar */}
        <div
          className={`h-1 w-full ${
            achievement.unlocked
              ? 'bg-gradient-to-r from-shopee via-shopee-light to-shopee-gold'
              : 'bg-muted'
          }`}
        />

        <CardContent className="p-5">
          <div className="flex flex-col items-center text-center gap-3">
            {/* Icon */}
            <div
              className={`
                achievement-badge
                ${achievement.unlocked ? 'unlocked' : 'locked'}
                ${achievement.unlocked && achievement.tier === 'gold' ? 'achievement-glow-gold' : ''}
              `}
            >
              <span className="text-3xl">{achievement.icon}</span>
            </div>

            {/* Tier badge */}
            <Badge
              variant="secondary"
              className={`text-[10px] px-2 py-0.5 font-semibold ${tier.bgClass} ${tier.textClass}`}
            >
              <Star className="w-2.5 h-2.5 mr-1" />
              {tier.label}
            </Badge>

            {/* Name & Description */}
            <div>
              <h3 className={`text-sm font-bold ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {achievement.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {achievement.description}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {achievement.requirement}
                </span>
                <span className={`text-[11px] font-bold ${achievement.unlocked ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {displayedProgress}%
                </span>
              </div>
              <div className="progress-bar-animated">
                <div
                  className="progress-fill"
                  style={{ width: `${displayedProgress}%` }}
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5 mt-1">
              {achievement.unlocked ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    Unlocked
                  </span>
                  {achievement.unlockedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(achievement.unlockedAt).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground">
                    {achievement.progress}% complete
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>

        {/* Unlocked shimmer overlay */}
        {achievement.unlocked && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-shopee/5 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-shopee-gold/5 blur-2xl" />
          </div>
        )}
      </Card>
    </motion.div>
  )
}

// ============================================================
// Main Component
// ============================================================

export function AchievementsPage() {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all')

  const { data, isLoading } = useQuery<AchievementsResponse>({
    queryKey: ['achievements'],
    queryFn: () => fetch('/api/achievements').then((r) => r.json()),
  })

  const achievements = data?.achievements || []
  const summary = data?.summary
  const categoryStats = data?.categoryStats
  const userStats = data?.userStats

  const filteredAchievements =
    activeFilter === 'all'
      ? achievements
      : achievements.filter((a) => a.category === activeFilter)

  // Stats cards data
  const statsCards = [
    {
      label: 'Total Earned',
      value: userStats ? `RM ${userStats.totalEarnings.toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '—',
      icon: DollarSign,
      color: 'text-shopee bg-shopee/10',
    },
    {
      label: 'Total Clicks',
      value: userStats ? userStats.totalClicks.toLocaleString() : '—',
      icon: Target,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
    },
    {
      label: 'Links Created',
      value: userStats ? userStats.totalLinks.toString() : '—',
      icon: Link2,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
    },
    {
      label: 'Current Streak',
      value: userStats ? `${userStats.currentStreak} days` : '—',
      icon: Flame,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-7 w-40" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>

        {/* Progress overview skeleton */}
        <Skeleton className="h-52 rounded-xl" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    )
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
            <Award className="w-5 h-5 text-shopee" />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              Achievements
              <Trophy className="w-4 h-4 text-shopee-gold" />
            </h2>
            <p className="text-sm text-muted-foreground">
              Track your milestones and unlock rewards
            </p>
          </div>
        </div>

        {/* Overall summary badge */}
        {summary && (
          <Badge className="badge-gradient text-xs px-3 py-1">
            <Star className="w-3 h-3 mr-1" />
            {summary.unlocked} / {summary.total} Unlocked
          </Badge>
        )}
      </motion.div>

      {/* ============================================================
          Stats Cards
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
          Progress Overview
          ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="glass-card border-border/50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Circular Progress Ring */}
              <CircularProgressRing percentage={summary?.percentage || 0} size={140} strokeWidth={10} />

              {/* Summary details */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-foreground mb-1">
                  Your Achievement Progress
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {summary
                    ? `${summary.locked} more achievements to unlock — keep going!`
                    : 'Loading...'}
                </p>

                {/* Category breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categoryStats &&
                    Object.entries(categoryStats).map(([cat, stat]) => {
                      const catLabel = categoryFilters.find((f) => f.value === cat)?.label || cat
                      const CatIcon = categoryFilters.find((f) => f.value === cat)?.icon || Trophy
                      return (
                        <div
                          key={cat}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                        >
                          <CatIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-foreground truncate">
                              {catLabel}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {stat.unlocked}/{stat.total}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Motivational message */}
              <div className="hidden lg:flex flex-col items-center justify-center text-center p-4 rounded-xl bg-gradient-to-br from-shopee/5 to-shopee-gold/5 min-w-[160px]">
                <span className="text-4xl mb-2">
                  {summary && summary.percentage === 100
                    ? '🎉'
                    : summary && summary.percentage >= 50
                      ? '🌟'
                      : '💪'}
                </span>
                <p className="text-xs font-semibold text-foreground">
                  {summary && summary.percentage === 100
                    ? 'All Unlocked!'
                    : summary && summary.percentage >= 50
                      ? 'Halfway There!'
                      : 'Just Getting Started'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {summary && summary.percentage === 100
                    ? 'You are a legend!'
                    : 'Every step counts!'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================================
          Category Filter Tabs
          ============================================================ */}
      <motion.div
        className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        {categoryFilters.map((filter) => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.value
          const catStat = categoryStats?.[filter.value]

          return (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                transition-all duration-200 whitespace-nowrap flex-shrink-0
                ${isActive
                  ? 'bg-shopee text-white shadow-shopee'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {filter.label}
              {filter.value !== 'all' && catStat && (
                <span
                  className={`ml-0.5 text-[10px] ${
                    isActive ? 'text-white/80' : 'text-muted-foreground/70'
                  }`}
                >
                  {catStat.unlocked}/{catStat.total}
                </span>
              )}
              {filter.value === 'all' && summary && (
                <span
                  className={`ml-0.5 text-[10px] ${
                    isActive ? 'text-white/80' : 'text-muted-foreground/70'
                  }`}
                >
                  {summary.unlocked}
                </span>
              )}
            </button>
          )
        })}
      </motion.div>

      {/* ============================================================
          Achievement Grid
          ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state when no achievements match filter */}
      {filteredAchievements.length === 0 && !isLoading && (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No achievements in this category yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Start engaging to unlock new badges!
          </p>
        </motion.div>
      )}
    </div>
  )
}
