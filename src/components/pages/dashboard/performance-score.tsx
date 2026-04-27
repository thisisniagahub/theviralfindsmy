'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { SCORE_RADIUS, SCORE_STROKE, SCORE_CIRCUMFERENCE, gradeTips } from './dashboard-shared'

interface ScoreBreakdownItem {
  label: string
  earned: number
  max: number
}

interface PerformanceScoreProps {
  performanceScore: number
  performanceGrade: string
  scoreBreakdown: ScoreBreakdownItem[]
}

export function PerformanceScore({ performanceScore, performanceGrade, scoreBreakdown }: PerformanceScoreProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="col-span-2"
    >
      <Card className="border-border/50 shadow-sm stat-card-lift bg-gradient-to-br from-white to-emerald-50/30 dark:from-card dark:to-emerald-900/10 mobile-stat-card h-full">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Score Ring */}
          <div className="relative flex-shrink-0 mx-auto sm:mx-0">
            <svg width="80" height="80" viewBox="0 0 100 100" className="transform -rotate-90 sm:w-[100px] sm:h-[100px]">
              <circle
                cx="50"
                cy="50"
                r={SCORE_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={SCORE_STROKE}
                className="text-muted/40"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={SCORE_RADIUS}
                fill="none"
                stroke={
                  performanceScore >= 80 ? '#22C55E' :
                  performanceScore >= 50 ? '#EE4D2D' : '#EF4444'
                }
                strokeWidth={SCORE_STROKE}
                strokeLinecap="round"
                strokeDasharray={SCORE_CIRCUMFERENCE}
                initial={{ strokeDashoffset: SCORE_CIRCUMFERENCE }}
                animate={{ strokeDashoffset: SCORE_CIRCUMFERENCE - (SCORE_CIRCUMFERENCE * performanceScore) / 100 }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center transform rotate-0">
              <motion.span
                className="text-lg sm:text-xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {performanceScore ?? 0}
              </motion.span>
              <span className={`text-sm sm:text-lg font-bold ${
                (performanceGrade || 'F') === 'A' ? 'text-green-600 dark:text-green-400' :
                (performanceGrade || 'F') === 'B' ? 'text-emerald-600 dark:text-emerald-400' :
                (performanceGrade || 'F') === 'C' ? 'text-shopee' :
                (performanceGrade || 'F') === 'D' ? 'text-orange-500' : 'text-red-500'
              }`}>
                {performanceGrade || 'F'}
              </span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="flex-1 min-w-0 w-full">
            <p className="text-sm font-semibold mb-1">Performance Score</p>
            <p className="text-xs text-muted-foreground mb-3">{gradeTips[performanceGrade || 'F'] || ''}</p>
            <div className="space-y-1.5">
              {(scoreBreakdown || []).slice(0, 4).map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-[90px] truncate flex-shrink-0">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        item.earned / item.max >= 0.8 ? 'bg-green-500' :
                        item.earned / item.max >= 0.5 ? 'bg-shopee' : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.max((item.earned / item.max) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="font-medium w-10 text-right flex-shrink-0">{item.earned}/{item.max}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
