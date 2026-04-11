'use client'

import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { AnimatedNumber } from './dashboard-shared'
import { cn } from '@/lib/utils'

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
    <>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
            className="h-full"
          >
            <Card className={cn(
               "h-full glass-card border-white/10 shadow-lg stat-card-lift overflow-hidden group",
               "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-10 dark:hover:before:opacity-20",
               stat.label === 'Total Earnings' ? 'before:from-shopee before:to-transparent' : 'before:from-primary/20 before:to-transparent'
            )}>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "p-3 rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                    stat.color
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Sparkline Visualization */}
                  <div className="relative group/spark">
                    <svg width="64" height="28" viewBox="0 0 60 24" className="overflow-visible filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                      <motion.polyline
                        fill="none"
                        stroke={stat.label === 'Total Earnings' ? '#EE4D2D' : stat.trendUp ? '#22C55E' : '#EF4444'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={stat.sparkline}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
                      />
                    </svg>
                    <div className="absolute inset-0 bg-current opacity-0 group-hover/spark:opacity-10 blur-xl transition-opacity" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{stat.label}</div>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      <AnimatedNumber
                        value={stat.value}
                        prefix={stat.isRM ? 'RM ' : ''}
                        suffix={stat.isPercent ? '%' : ''}
                      />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md border",
                      stat.trendUp 
                        ? "text-green-600 bg-green-500/10 border-green-500/20" 
                        : "text-red-500 bg-red-500/10 border-red-500/20"
                    )}>
                      {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.trend}
                    </div>
                  </div>
                </div>
              </CardContent>
              
              {/* Subtle background icon */}
              <Icon className="absolute -right-4 -bottom-4 w-24 h-24 text-foreground/[0.03] -rotate-12 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-0" />
            </Card>
          </motion.div>
        )
      })}
    </>
  )
}
