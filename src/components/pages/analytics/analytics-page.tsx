'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUpRight, Flame } from 'lucide-react'
import { motion } from 'framer-motion'

import { type AnalyticsData, type LinkData } from './analytics-shared'
import { PerformanceCharts } from './performance-charts'
import { ClickHeatmapGrid } from './heatmap'
import { LinkComparison } from './link-comparison'

export function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const [compareLinkA, setCompareLinkA] = useState('')
  const [compareLinkB, setCompareLinkB] = useState('')

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics', period],
    queryFn: () => fetch(`/api/analytics?period=${period}`).then((r) => r.json()),
  })

  // Fetch links for comparison dropdowns
  const { data: linksData } = useQuery<{ links: LinkData[] }>({
    queryKey: ['links-all-compare'],
    queryFn: () => fetch('/api/links?limit=100').then((r) => r.json()),
  })

  // Fetch selected comparison links
  const { data: linkA } = useQuery<LinkData>({
    queryKey: ['compare-link-a', compareLinkA],
    queryFn: () => fetch(`/api/links/${compareLinkA}`).then((r) => r.json()),
    enabled: !!compareLinkA,
  })

  const { data: linkB } = useQuery<LinkData>({
    queryKey: ['compare-link-b', compareLinkB],
    queryFn: () => fetch(`/api/links/${compareLinkB}`).then((r) => r.json()),
    enabled: !!compareLinkB,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <Skeleton className="h-80" /><Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  const totalClicks = data?.performanceData?.reduce((s, d) => s + d.clicks, 0) || 0
  const totalConversions = data?.performanceData?.reduce((s, d) => s + d.conversions, 0) || 0
  const totalEarnings = data?.performanceData?.reduce((s, d) => s + d.earnings, 0) || 0
  const avgConvRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0'

  const links = linksData?.links || []

  return (
    <div className="space-y-6">
      {/* Period Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Performance Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your affiliate performance over time</p>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Total Clicks', value: totalClicks.toLocaleString(), trend: '+15%' },
          { label: 'Conversions', value: totalConversions.toLocaleString(), trend: '+8%' },
          { label: 'Revenue', value: `RM ${totalEarnings.toFixed(2)}`, trend: '+22%' },
          { label: 'Avg. Conv. Rate', value: `${avgConvRate}%`, trend: '+1.2%' },
        ].map((s) => (
          <Card key={s.label} className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold">{s.value}</span>
                <span className="flex items-center text-xs metric-positive font-medium">
                  <ArrowUpRight className="w-3 h-3" />{s.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Charts */}
      <PerformanceCharts data={data} />

      {/* ========== Compare Links Section ========== */}
      <div className="section-divider" />
      <LinkComparison
        links={links}
        compareLinkA={compareLinkA}
        compareLinkB={compareLinkB}
        onCompareLinkAChange={setCompareLinkA}
        onCompareLinkBChange={setCompareLinkB}
        linkA={linkA}
        linkB={linkB}
      />

      {/* ========== Click Performance Heatmap ========== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-shopee" />
              <CardTitle className="text-base font-semibold">Click Performance Heatmap</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Best times to share your links</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto custom-scrollbar pb-2">
              <ClickHeatmapGrid data={data?.heatmap || []} />
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Low</span>
              <div className="flex gap-0.5">
                {[5, 15, 25, 40, 55, 70, 85, 100].map((opacity) => (
                  <div
                    key={opacity}
                    className="w-5 h-3 rounded-sm"
                    style={{ backgroundColor: `rgba(238, 77, 45, ${opacity / 100})` }}
                  />
                ))}
              </div>
              <span>High</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
