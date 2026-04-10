'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// Table components removed (unused)
import {
  Users, UserCheck, TrendingUp, DollarSign, Share2, Copy, Check,
  ArrowUpRight, MessageCircle, Send, Facebook, Twitter, QrCode,
  Info, Award, Star, Zap,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

// Animated count-up component
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
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

// Chart tooltip
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="chart-tooltip-item">
          <span className="chart-tooltip-dot" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}:</span>
          <span className="chart-tooltip-value">
            {entry.name === 'Earnings' ? `RM ${entry.value.toFixed(2)}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// Mock data (used when API not available)
const MOCK_STATS = {
  totalReferrals: 24,
  activeReferrals: 18,
  conversionRate: 75,
  referralEarnings: 1250.00,
}

const MOCK_REFERRAL_LINK = 'https://shopee-affiliate.com/ref/ahmad-ali-123'

const MOCK_TIER = {
  current: 'Silver',
  next: 'Gold',
  progress: 60,
}

const MOCK_HISTORY = [
  { id: '1', name: 'Siti Nurhaliza', email: 'siti.nur@email.com', status: 'active', dateJoined: '2026-01-15', earnings: 145.50 },
  { id: '2', name: 'Muhammad Amin', email: 'm.amin@email.com', status: 'active', dateJoined: '2026-01-20', earnings: 98.20 },
  { id: '3', name: 'Nurul Aisyah', email: 'nurul.a@email.com', status: 'active', dateJoined: '2026-02-03', earnings: 210.00 },
  { id: '4', name: 'Ahmad Faiz', email: 'a.faiz@email.com', status: 'inactive', dateJoined: '2026-02-10', earnings: 32.80 },
  { id: '5', name: 'Farah Diana', email: 'farah.d@email.com', status: 'active', dateJoined: '2026-02-18', earnings: 178.90 },
  { id: '6', name: 'Ismail Sabri', email: 'i.sabri@email.com', status: 'active', dateJoined: '2026-03-01', earnings: 156.30 },
  { id: '7', name: 'Putri Amelia', email: 'putri.a@email.com', status: 'inactive', dateJoined: '2026-03-12', earnings: 15.60 },
  { id: '8', name: 'Rizal Hakim', email: 'rizal.h@email.com', status: 'active', dateJoined: '2026-03-25', earnings: 88.40 },
]

const MOCK_MONTHLY_EARNINGS = [
  { month: 'Oct', earnings: 85 },
  { month: 'Nov', earnings: 145 },
  { month: 'Dec', earnings: 210 },
  { month: 'Jan', earnings: 178 },
  { month: 'Feb', earnings: 256 },
  { month: 'Mar', earnings: 320 },
]

const TIER_CONFIG = [
  { name: 'Bronze', range: '0-5 referrals', rate: 3, color: 'bg-amber-700 text-white dark:bg-amber-600', border: 'border-amber-700/30' },
  { name: 'Silver', range: '6-15 referrals', rate: 5, color: 'bg-gray-400 text-white dark:bg-gray-300 dark:text-gray-900', border: 'border-gray-400/30' },
  { name: 'Gold', range: '16-30 referrals', rate: 7, color: 'bg-yellow-500 text-white dark:bg-yellow-400 dark:text-gray-900', border: 'border-yellow-500/30' },
  { name: 'Diamond', range: '30+ referrals', rate: 10, color: 'bg-cyan-500 text-white dark:bg-cyan-400 dark:text-gray-900', border: 'border-cyan-500/30' },
]

const HOW_IT_WORKS = [
  { step: 1, title: 'Share your link', description: 'Share your unique referral link with friends' },
  { step: 2, title: 'They sign up', description: 'They sign up using your link' },
  { step: 3, title: 'You earn', description: 'You earn 5% commission on their earnings' },
]

export function ReferralPage() {
  const [copied, setCopied] = useState(false)

  const { data } = useQuery({
    queryKey: ['referral'],
    queryFn: () => fetch('/api/referral').then((r) => r.json()),
    staleTime: 60000,
  })

  const stats = data?.stats || MOCK_STATS
  const referralLink = data?.referralLink || MOCK_REFERRAL_LINK
  const tier = data?.tier || MOCK_TIER
  const history = data?.history || MOCK_HISTORY
  const monthlyEarnings = data?.monthlyEarnings || MOCK_MONTHLY_EARNINGS

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success('Link copied!', { description: 'Referral link copied to clipboard' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy', { description: 'Please try again' })
    }
  }

  const shareMessages = {
    whatsapp: `Join Shopee Affiliate and start earning! 🛒💰 Sign up here: ${referralLink}`,
    telegram: `Join Shopee Affiliate and start earning! Sign up here: ${referralLink}`,
    facebook: `Check out Shopee Affiliate Manager - earn commissions by sharing products! ${referralLink}`,
    twitter: `Just earned commissions with @ShopeeAffiliate! Join now: ${referralLink}`,
  }

  const handleShare = (platform: 'whatsapp' | 'telegram' | 'facebook' | 'twitter') => {
    const msg = shareMessages[platform]
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(msg)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`,
    }
    window.open(urls[platform], '_blank', 'width=600,height=400')
    toast.success(`Opening ${platform.charAt(0).toUpperCase() + platform.slice(1)}`)
  }

  const currentTierIdx = TIER_CONFIG.findIndex(t => t.name === tier.current)

  const statCards = [
    {
      label: 'Total Referrals',
      value: stats.totalReferrals,
      icon: Users,
      trend: '+6 this month',
      trendUp: true,
      color: 'text-shopee bg-shopee/10',
      gradient: 'from-white to-orange-50/50 dark:from-card dark:to-orange-900/10',
    },
    {
      label: 'Active Referrals',
      value: stats.activeReferrals,
      icon: UserCheck,
      trend: '+3 this week',
      trendUp: true,
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      gradient: 'from-white to-green-50/50 dark:from-card dark:to-green-900/10',
    },
    {
      label: 'Conversion Rate',
      value: stats.conversionRate,
      icon: TrendingUp,
      trend: '+2.1%',
      trendUp: true,
      suffix: '%',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
      gradient: 'from-white to-purple-50/50 dark:from-card dark:to-purple-900/10',
    },
    {
      label: 'Referral Earnings',
      value: stats.referralEarnings,
      icon: DollarSign,
      trend: '+18.5%',
      trendUp: true,
      prefix: 'RM ',
      color: 'text-shopee bg-shopee/10',
      gradient: 'from-white to-orange-50/50 dark:from-card dark:to-orange-900/10',
    },
  ]

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-border/50 shadow-sm bg-gradient-to-r from-shopee/5 via-shopee/10 to-shopee/5 dark:from-shopee/10 dark:via-shopee/20 dark:to-shopee/10 overflow-hidden relative card-shine">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-shopee/10 dark:bg-shopee/20 blur-2xl pointer-events-none" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-shopee/10">
                <Share2 className="w-6 h-6 text-shopee" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Referral Hub</h1>
                <p className="text-sm text-muted-foreground">Share, earn & grow your affiliate network</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Badge variant="secondary" className="badge-gradient text-xs">
                <Zap className="w-3 h-3 mr-1" />
                {tier.current} Tier — {tier.progress}% to {tier.next}
              </Badge>
              <div className="flex-1 max-w-[200px] h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-shopee to-shopee-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${tier.progress}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section A: Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`glass-card card-elevated mobile-stat-card`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg stat-icon ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium stat-trend ${stat.trendUp ? 'metric-positive' : 'metric-negative'}`}>
                      {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : null}
                      {stat.trend}
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold stat-value">
                    <AnimatedNumber
                      value={stat.value}
                      prefix={stat.prefix || ''}
                      suffix={stat.suffix || ''}
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground stat-label">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Section B: Referral Link Generator + Section C: Program Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Referral Link Generator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="glass-card card-elevated h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Share2 className="w-4 h-4 text-shopee" />
                Your Referral Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Link display */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-foreground truncate">{referralLink}</p>
                </div>
                <Button size="sm" onClick={handleCopy} className="btn-shopee text-xs h-8 flex-shrink-0">
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>

              {/* Share buttons */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Share via</p>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare('telegram')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0088CC] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Telegram</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1877F2] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <Facebook className="w-4 h-4" />
                    <span className="hidden sm:inline">Facebook</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1DA1F2] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <Twitter className="w-4 h-4" />
                    <span className="hidden sm:inline">Twitter</span>
                  </motion.button>
                </div>
              </div>

              {/* QR Code placeholder */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-white dark:bg-card border border-border flex items-center justify-center">
                  {/* Simple QR code SVG placeholder */}
                  <svg width="80" height="80" viewBox="0 0 80 80" className="text-foreground">
                    {/* Outer border */}
                    <rect x="0" y="0" width="80" height="80" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
                    {/* Top-left finder pattern */}
                    <rect x="8" y="8" width="20" height="20" rx="2" fill="currentColor" />
                    <rect x="12" y="12" width="12" height="12" rx="1" fill="white" />
                    <rect x="14" y="14" width="8" height="8" rx="1" fill="currentColor" />
                    {/* Top-right finder pattern */}
                    <rect x="52" y="8" width="20" height="20" rx="2" fill="currentColor" />
                    <rect x="56" y="12" width="12" height="12" rx="1" fill="white" />
                    <rect x="58" y="14" width="8" height="8" rx="1" fill="currentColor" />
                    {/* Bottom-left finder pattern */}
                    <rect x="8" y="52" width="20" height="20" rx="2" fill="currentColor" />
                    <rect x="12" y="56" width="12" height="12" rx="1" fill="white" />
                    <rect x="14" y="58" width="8" height="8" rx="1" fill="currentColor" />
                    {/* Center pattern (simplified) */}
                    <rect x="32" y="32" width="16" height="16" rx="2" fill="currentColor" />
                    <rect x="36" y="36" width="8" height="8" rx="1" fill="white" />
                    {/* Data modules (simplified) */}
                    <rect x="34" y="12" width="4" height="4" fill="currentColor" />
                    <rect x="42" y="12" width="4" height="4" fill="currentColor" />
                    <rect x="34" y="20" width="4" height="4" fill="currentColor" />
                    <rect x="42" y="20" width="4" height="4" fill="currentColor" />
                    <rect x="12" y="34" width="4" height="4" fill="currentColor" />
                    <rect x="12" y="42" width="4" height="4" fill="currentColor" />
                    <rect x="20" y="34" width="4" height="4" fill="currentColor" />
                    <rect x="20" y="42" width="4" height="4" fill="currentColor" />
                    <rect x="56" y="34" width="4" height="4" fill="currentColor" />
                    <rect x="64" y="34" width="4" height="4" fill="currentColor" />
                    <rect x="56" y="42" width="4" height="4" fill="currentColor" />
                    <rect x="64" y="42" width="4" height="4" fill="currentColor" />
                    <rect x="34" y="56" width="4" height="4" fill="currentColor" />
                    <rect x="42" y="56" width="4" height="4" fill="currentColor" />
                    <rect x="34" y="64" width="4" height="4" fill="currentColor" />
                    <rect x="42" y="64" width="4" height="4" fill="currentColor" />
                    <rect x="56" y="56" width="4" height="4" fill="currentColor" />
                    <rect x="64" y="56" width="4" height="4" fill="currentColor" />
                    <rect x="56" y="64" width="4" height="4" fill="currentColor" />
                    <rect x="64" y="64" width="4" height="4" fill="currentColor" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="w-4 h-4 text-shopee" />
                    <p className="text-sm font-semibold text-foreground">QR Code</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Scan this QR code to share your referral link. Share it on social media, print it on business cards, or embed it in your blog.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section C: Referral Program Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="space-y-4"
        >
          {/* How It Works */}
          <Card className="glass-card card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-shopee" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {HOW_IT_WORKS.map((item, idx) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + idx * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-shopee text-white flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Commission Structure */}
          <Card className="glass-card card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="w-4 h-4 text-shopee" />
                Commission Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TIER_CONFIG.map((t, idx) => {
                  const isCurrent = idx === currentTierIdx
                  return (
                    <motion.div
                      key={t.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.6 + idx * 0.05 }}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isCurrent
                          ? 'gradient-border bg-shopee/5 dark:bg-shopee/10'
                          : 'bg-muted/30 border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${t.color}`}>
                          {t.name}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.range}</p>
                          {isCurrent && (
                            <p className="text-xs text-shopee font-semibold flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Your current tier
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className={`text-sm font-bold ${isCurrent ? 'badge-glow bg-shopee text-white border-0' : 'bg-muted text-foreground'}`}>
                        {t.rate}%
                      </Badge>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Section D: Referral History Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card className="glass-card border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-shopee" />
                Referral History
              </CardTitle>
              <Badge variant="secondary" className="text-xs bg-shopee/10 text-shopee border-0">
                {history.length} referrals
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto table-scroll-mobile max-h-96 overflow-y-auto custom-scrollbar rounded-lg border border-border/50">
              <table className="table-modern">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Date Joined</th>
                    <th className="text-right">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((ref: { id: string; name: string; email: string; status: string; dateJoined: string; earnings: number }, idx: number) => (
                    <motion.tr
                      key={ref.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.7 + idx * 0.03 }}
                      className="table-row-hover"
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-shopee/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-shopee">
                              {ref.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{ref.name}</span>
                        </div>
                      </td>
                      <td className="text-sm text-muted-foreground">{ref.email}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className={`badge-dot ${ref.status === 'active' ? 'badge-dot-success' : 'badge-dot-error'}`} />
                          <span className={`text-xs font-medium capitalize ${
                            ref.status === 'active'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {ref.status}
                          </span>
                        </div>
                      </td>
                      <td className="text-sm text-muted-foreground">{formatDate(ref.dateJoined)}</td>
                      <td className="text-right">
                        <span className="text-sm font-semibold metric-money">
                          RM {ref.earnings.toFixed(2)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section E: Earnings Breakdown Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="hidden lg:block"
      >
        <Card className="glass-card border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-shopee" />
              Monthly Referral Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72 chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyEarnings}>
                  <defs>
                    <linearGradient id="referralBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EE4D2D" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#FF6742" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `RM${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="earnings" fill="url(#referralBarGradient)" radius={[6, 6, 0, 0]} name="Earnings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
