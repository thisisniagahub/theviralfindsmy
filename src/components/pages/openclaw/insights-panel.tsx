'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Brain, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Sparkles, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Insight {
  type: string
  message: string
  impact: string
}

interface InsightsPanelProps {
  onFetch?: () => Promise<Insight[]>
}

export function InsightsPanel({ onFetch }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    try {
      if (onFetch) {
        const data = await onFetch()
        setInsights(data)
        toast.success('AI Insights refreshed')
      } else {
        const res = await fetch('/api/openclaw/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalClicks: 3847, totalEarnings: 2847.50, conversionRate: 4.2,
            activeLinks: 15, topCategory: 'Electronics',
          }),
        })
        const data = await res.json()
        if (data.success) {
          setInsights(data.insights || [])
          toast.success('AI Insights refreshed')
        }
      }
    } catch {
      toast.error('Failed to fetch insights')
    }
    setLoading(false)
  }, [onFetch])

  const colors: Record<string, string> = { opportunity: '#22C55E', warning: '#F59E0B', success: '#3B82F6', tip: '#8B5CF6' }
  const icons: Record<string, LucideIcon> = { opportunity: TrendingUp, warning: AlertTriangle, success: CheckCircle, tip: Sparkles }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card className="glass-card border-shopee/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-shopee" />
              AI Insights
              <Badge variant="secondary" className="text-[9px] bg-shopee/10 text-shopee border-0">Powered by LLM</Badge>
            </CardTitle>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
              {loading ? 'Analyzing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {insights.length > 0 ? (
            <div className="space-y-2.5">
              {insights.map((insight, idx) => {
                const Icon = icons[insight.type] || Brain
                return (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30" style={{ borderLeft: `3px solid ${colors[insight.type] || '#EE4D2D'}` }}>
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors[insight.type] }} />
                    <p className="text-sm text-foreground flex-1">{insight.message}</p>
                    <Badge variant="secondary" className={cn('text-[10px] flex-shrink-0', insight.impact === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : insight.impact === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400')}>
                      {insight.impact}
                    </Badge>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Brain className="w-10 h-10 text-shopee/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Click &quot;Refresh&quot; to get AI-powered insights</p>
              <Button size="sm" className="btn-shopee text-xs" onClick={handleRefresh} disabled={loading}>
                <Sparkles className="w-3 h-3 mr-1" /> Generate Insights
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}