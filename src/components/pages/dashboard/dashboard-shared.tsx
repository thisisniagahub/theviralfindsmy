'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp, DollarSign, Wallet, CheckCircle, MousePointerClick,
  Link2, Eye, Target, BarChart3, FileText, type LucideIcon,
} from 'lucide-react'

export const PIE_COLORS = ['#EE4D2D', '#FF6742', '#FFB347', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899']

export interface DashboardData {
  totalLinks: number
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  conversionRate: number
  earningsData: { date: string; earnings: number; clicks: number }[]
  topLinks: {
    id: string; name: string; productName: string; productImage: string | null; clicks: number; conversions: number; earnings: number; status: string; shortCode: string; category: string | null; campaign: { name: string } | null
  }[]
  recentConversions: {
    id: string; orderId: string; amount: number; commission: number; status: string; createdAt: string
    affiliateLink: { name: string; productName: string; shortCode: string } | null
  }[]
  countryData: { name: string; value: number }[]
  period: string
  performanceScore: number
  performanceGrade: string
  scoreBreakdown: Array<{ label: string; earned: number; max: number }>
}

export interface ActivityApiResponse {
  id: string
  type: 'conversion' | 'click' | 'payout' | 'campaign' | 'link' | 'system'
  title: string
  description: string
  timestamp: string
  icon: string
  color: string
  borderClass: string
  time: string
}

export function formatRM(amount: number) {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`
}

export const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{value.toLocaleString('en-MY', { minimumFractionDigits: suffix === '%' ? 1 : 2, maximumFractionDigits: suffix === '%' ? 1 : 2 })}{suffix}
    </motion.span>
  )
}

export const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Wallet,
  TrendingUp,
  CheckCircle,
  MousePointerClick,
  Link2,
  Eye,
  Target,
  BarChart3,
  FileText,
}

export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="chart-tooltip-item">
          <span className="chart-tooltip-dot" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}:</span>
          <span className="chart-tooltip-value">
            {entry.name === 'Earnings' || entry.name === 'Revenue' ? `RM ${entry.value.toFixed(2)}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export const periodOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

export const SCORE_RADIUS = 45
export const SCORE_STROKE = 6
export const SCORE_CIRCUMFERENCE = 2 * Math.PI * SCORE_RADIUS

export const gradeTips: Record<string, string> = {
  A: 'Excellent performance! Keep optimizing your top-performing links.',
  B: 'Great work! Focus on boosting conversion rates to reach A grade.',
  C: 'Good start! Increase click volume and active links for better scores.',
  D: 'Room for improvement. Reactivate paused links and diversify campaigns.',
  F: 'Action needed! Create more links and focus on high-converting products.',
}
