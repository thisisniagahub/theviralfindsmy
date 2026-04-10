'use client'

import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { AnimatedNumber } from './dashboard-shared'

export interface StatItem {
  label: string
  value: number
  displayValue: string
  icon: LucideIcon
  trend: string
  trendUp: boolean
  color: string
  gradient: string
  sparkline: string
  isRM?: boolean
  isPercent?: boolean
}

interface StatCardsProps {
  stats: StatItem[]
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={`border-border/50 shadow-sm stat-card-lift bg-gradient-to-br ${stat.gradient} mobile-stat-card card-hover-ripple`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg stat-icon ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {/* Sparkline */}
                  <svg width="60" height="24" viewBox="0 0 60 24" className="overflow-visible">
                    <polyline
                      fill="none"
                      stroke={index === 2 ? '#EE4D2D' : stat.trendUp ? '#22C55E' : '#EF4444'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={stat.sparkline}
                    />
                  </svg>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xl sm:text-2xl font-bold stat-value">
                    <AnimatedNumber
                      value={stat.value}
                      prefix={stat.isRM ? 'RM ' : ''}
                      suffix={stat.isPercent ? '%' : ''}
                    />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium stat-trend ${stat.trendUp ? 'metric-positive' : 'metric-negative'}`}>
                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.trend}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground stat-label">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
