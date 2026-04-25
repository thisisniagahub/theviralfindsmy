import { NextResponse } from 'next/server'

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

// Mock user stats to calculate realistic progress
const userStats = {
  totalClicks: 2457,
  totalEarnings: 3125.50,
  totalLinks: 28,
  totalShares: 12,
  currentStreak: 5,
}

// 12 achievements across 5 categories — 7 unlocked, 5 locked
const achievements: Achievement[] = [
  // CLICKS category
  {
    id: 'click-1',
    name: 'First Click',
    description: 'Generated your first affiliate click',
    icon: '👆',
    category: 'clicks',
    tier: 'bronze',
    progress: 100,
    unlocked: true,
    unlockedAt: '2024-11-15T10:32:00.000Z',
    requirement: 'Get 1 click on your affiliate links',
  },
  {
    id: 'click-1000',
    name: 'Click Master',
    description: 'Reached 1,000 total clicks on your links',
    icon: '🖱️',
    category: 'clicks',
    tier: 'silver',
    progress: 100,
    unlocked: true,
    unlockedAt: '2025-01-08T14:22:00.000Z',
    requirement: 'Accumulate 1,000 clicks',
  },
  {
    id: 'click-10000',
    name: 'Click Tsunami',
    description: 'Hit 10,000 total clicks — a true traffic generator',
    icon: '🌊',
    category: 'clicks',
    tier: 'gold',
    progress: 25,
    unlocked: false,
    unlockedAt: null,
    requirement: 'Accumulate 10,000 clicks',
  },

  // EARNINGS category
  {
    id: 'earn-1',
    name: 'First Commission',
    description: 'Earned your first affiliate commission',
    icon: '💰',
    category: 'earnings',
    tier: 'bronze',
    progress: 100,
    unlocked: true,
    unlockedAt: '2024-11-20T08:45:00.000Z',
    requirement: 'Earn RM 1 in commissions',
  },
  {
    id: 'earn-500',
    name: 'Money Maker',
    description: 'Earned RM 500 in total commissions',
    icon: '💵',
    category: 'earnings',
    tier: 'silver',
    progress: 100,
    unlocked: true,
    unlockedAt: '2025-02-12T16:10:00.000Z',
    requirement: 'Earn RM 500 in commissions',
  },
  {
    id: 'earn-5000',
    name: 'Big Earner',
    description: 'Reached RM 5,000 in total affiliate earnings',
    icon: '💎',
    category: 'earnings',
    tier: 'gold',
    progress: 63,
    unlocked: false,
    unlockedAt: null,
    requirement: 'Earn RM 5,000 in commissions',
  },
  // LINKS category
  {
    id: 'link-1',
    name: 'Link Creator',
    description: 'Created your first affiliate link',
    icon: '🔗',
    category: 'links',
    tier: 'bronze',
    progress: 100,
    unlocked: true,
    unlockedAt: '2024-11-14T09:15:00.000Z',
    requirement: 'Create 1 affiliate link',
  },
  {
    id: 'link-50',
    name: 'Link Network',
    description: 'Built a network of 50 affiliate links',
    icon: '🕸️',
    category: 'links',
    tier: 'silver',
    progress: 56,
    unlocked: false,
    unlockedAt: null,
    requirement: 'Create 50 affiliate links',
  },

  // SOCIAL category
  {
    id: 'share-1',
    name: 'Sharer',
    description: 'Shared your first affiliate link on social media',
    icon: '📢',
    category: 'social',
    tier: 'bronze',
    progress: 100,
    unlocked: true,
    unlockedAt: '2024-11-18T12:50:00.000Z',
    requirement: 'Share 1 affiliate link',
  },
  {
    id: 'share-100',
    name: 'Viral Marketer',
    description: 'Shared links 100 times — a true social marketer',
    icon: '🚀',
    category: 'social',
    tier: 'gold',
    progress: 12,
    unlocked: false,
    unlockedAt: null,
    requirement: 'Share 100 affiliate links',
  },

  // STREAK category
  {
    id: 'streak-7',
    name: 'Consistent',
    description: 'Maintained a 7-day active streak',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    progress: 100,
    unlocked: true,
    unlockedAt: '2025-01-25T20:00:00.000Z',
    requirement: 'Maintain a 7-day active streak',
  },
  {
    id: 'streak-30',
    name: 'Dedicated',
    description: 'An incredible 30-day unbroken streak',
    icon: '⚡',
    category: 'streak',
    tier: 'gold',
    progress: 17,
    unlocked: false,
    unlockedAt: null,
    requirement: 'Maintain a 30-day active streak',
  },
]

export async function GET() {
  // Calculate progress dynamically based on user stats
  const computedAchievements = achievements.map((a) => {
    let progress = a.progress

    if (!a.unlocked) {
      switch (a.id) {
        case 'click-10000':
          progress = Math.min(Math.round((userStats.totalClicks / 10000) * 100), 99)
          break
        case 'earn-5000':
          progress = Math.min(Math.round((userStats.totalEarnings / 5000) * 100), 99)
          break
        case 'link-50':
          progress = Math.min(Math.round((userStats.totalLinks / 50) * 100), 99)
          break
        case 'share-100':
          progress = Math.min(Math.round((userStats.totalShares / 100) * 100), 99)
          break
        case 'streak-30':
          progress = Math.min(Math.round((userStats.currentStreak / 30) * 100), 99)
          break
      }
    }

    return { ...a, progress }
  })

  const totalCount = computedAchievements.length
  let unlockedCount = 0

  // Category breakdown
  const categoryStats = {
    clicks: { unlocked: 0, total: 0 },
    earnings: { unlocked: 0, total: 0 },
    links: { unlocked: 0, total: 0 },
    social: { unlocked: 0, total: 0 },
    streak: { unlocked: 0, total: 0 },
  }

  for (const a of computedAchievements) {
    if (a.unlocked) {
      unlockedCount++
    }

    const stats = categoryStats[a.category]
    if (stats) {
      stats.total++
      if (a.unlocked) {
        stats.unlocked++
      }
    }
  }

  return NextResponse.json({
    achievements: computedAchievements,
    summary: {
      total: totalCount,
      unlocked: unlockedCount,
      locked: totalCount - unlockedCount,
      percentage: Math.round((unlockedCount / totalCount) * 100),
    },
    categoryStats,
    userStats,
  })
}
