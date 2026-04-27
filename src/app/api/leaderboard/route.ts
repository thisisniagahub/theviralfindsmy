import { NextResponse } from 'next/server'

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

const affiliates: Affiliate[] = [
  {
    rank: 1,
    name: 'Nurul Aisyah binti Hassan',
    initials: 'NA',
    totalEarnings: 28450.80,
    totalClicks: 47820,
    totalConversions: 3214,
    conversionRate: 6.72,
    activeLinks: 156,
    trend: 'up',
    weeklyChange: 12.5,
    tier: 'diamond',
    isCurrentUser: false,
  },
  {
    rank: 2,
    name: 'Lim Wei Jie',
    initials: 'LW',
    totalEarnings: 24120.50,
    totalClicks: 41230,
    totalConversions: 2856,
    conversionRate: 6.93,
    activeLinks: 134,
    trend: 'up',
    weeklyChange: 8.2,
    tier: 'diamond',
    isCurrentUser: false,
  },
  {
    rank: 3,
    name: 'Priya a/p Subramaniam',
    initials: 'PS',
    totalEarnings: 19870.30,
    totalClicks: 35640,
    totalConversions: 2412,
    conversionRate: 6.77,
    activeLinks: 112,
    trend: 'neutral',
    weeklyChange: 1.4,
    tier: 'platinum',
    isCurrentUser: false,
  },
  {
    rank: 4,
    name: 'Ahmad Ali',
    initials: 'AA',
    totalEarnings: 15340.60,
    totalClicks: 28910,
    totalConversions: 1987,
    conversionRate: 6.87,
    activeLinks: 89,
    trend: 'up',
    weeklyChange: 15.3,
    tier: 'platinum',
    isCurrentUser: true,
  },
  {
    rank: 5,
    name: 'Chew Mei Ling',
    initials: 'CM',
    totalEarnings: 14280.90,
    totalClicks: 26450,
    totalConversions: 1756,
    conversionRate: 6.64,
    activeLinks: 97,
    trend: 'down',
    weeklyChange: -3.1,
    tier: 'gold',
    isCurrentUser: false,
  },
  {
    rank: 6,
    name: 'Mohd Amin bin Yusof',
    initials: 'MA',
    totalEarnings: 12650.40,
    totalClicks: 23180,
    totalConversions: 1523,
    conversionRate: 6.57,
    activeLinks: 78,
    trend: 'up',
    weeklyChange: 5.7,
    tier: 'gold',
    isCurrentUser: false,
  },
  {
    rank: 7,
    name: 'Tan Siew Lin',
    initials: 'TS',
    totalEarnings: 10920.70,
    totalClicks: 20890,
    totalConversions: 1345,
    conversionRate: 6.44,
    activeLinks: 72,
    trend: 'neutral',
    weeklyChange: 0.8,
    tier: 'gold',
    isCurrentUser: false,
  },
  {
    rank: 8,
    name: 'Kavitha a/p Rajan',
    initials: 'KR',
    totalEarnings: 9870.20,
    totalClicks: 18450,
    totalConversions: 1189,
    conversionRate: 6.45,
    activeLinks: 65,
    trend: 'up',
    weeklyChange: 4.2,
    tier: 'silver',
    isCurrentUser: false,
  },
  {
    rank: 9,
    name: 'Hafiz bin Ismail',
    initials: 'HI',
    totalEarnings: 8430.60,
    totalClicks: 16230,
    totalConversions: 1023,
    conversionRate: 6.3,
    activeLinks: 54,
    trend: 'down',
    weeklyChange: -1.8,
    tier: 'silver',
    isCurrentUser: false,
  },
  {
    rank: 10,
    name: 'Wong Jia Hao',
    initials: 'WJ',
    totalEarnings: 7250.30,
    totalClicks: 14890,
    totalConversions: 912,
    conversionRate: 6.13,
    activeLinks: 48,
    trend: 'neutral',
    weeklyChange: 0.3,
    tier: 'silver',
    isCurrentUser: false,
  },
  {
    rank: 11,
    name: 'Siti Fatimah binti Abdullah',
    initials: 'SF',
    totalEarnings: 6120.80,
    totalClicks: 13450,
    totalConversions: 823,
    conversionRate: 6.12,
    activeLinks: 42,
    trend: 'up',
    weeklyChange: 6.9,
    tier: 'silver',
    isCurrentUser: false,
  },
  {
    rank: 12,
    name: 'Rajesh Kumar a/l Muthu',
    initials: 'RK',
    totalEarnings: 5340.50,
    totalClicks: 11230,
    totalConversions: 689,
    conversionRate: 6.14,
    activeLinks: 38,
    trend: 'down',
    weeklyChange: -5.4,
    tier: 'bronze',
    isCurrentUser: false,
  },
  {
    rank: 13,
    name: 'Ngo Wei Ming',
    initials: 'NW',
    totalEarnings: 4560.20,
    totalClicks: 9870,
    totalConversions: 567,
    conversionRate: 5.74,
    activeLinks: 31,
    trend: 'up',
    weeklyChange: 3.1,
    tier: 'bronze',
    isCurrentUser: false,
  },
  {
    rank: 14,
    name: 'Aisyah binti Rahman',
    initials: 'AR',
    totalEarnings: 3280.90,
    totalClicks: 8340,
    totalConversions: 456,
    conversionRate: 5.47,
    activeLinks: 25,
    trend: 'neutral',
    weeklyChange: -0.2,
    tier: 'bronze',
    isCurrentUser: false,
  },
  {
    rank: 15,
    name: 'Lee Kar Fai',
    initials: 'LK',
    totalEarnings: 2140.60,
    totalClicks: 6540,
    totalConversions: 312,
    conversionRate: 4.77,
    activeLinks: 18,
    trend: 'up',
    weeklyChange: 9.8,
    tier: 'bronze',
    isCurrentUser: false,
  },
]

export async function GET() {
  const currentUser = affiliates.find((a) => a.isCurrentUser)

  // Tier distribution summary
  const tierCounts = {
    diamond: affiliates.filter((a) => a.tier === 'diamond').length,
    platinum: affiliates.filter((a) => a.tier === 'platinum').length,
    gold: affiliates.filter((a) => a.tier === 'gold').length,
    silver: affiliates.filter((a) => a.tier === 'silver').length,
    bronze: affiliates.filter((a) => a.tier === 'bronze').length,
  }

  // Stats summary
  const topEarnings = affiliates[0].totalEarnings
  const averageEarnings =
    affiliates.reduce((sum, a) => sum + a.totalEarnings, 0) / affiliates.length

  return NextResponse.json({
    affiliates,
    userRank: currentUser || null,
    summary: {
      totalAffiliates: affiliates.length,
      tierCounts,
      topEarnings,
      averageEarnings: Math.round(averageEarnings * 100) / 100,
      nextTierThreshold: 16500,
    },
  })
}
