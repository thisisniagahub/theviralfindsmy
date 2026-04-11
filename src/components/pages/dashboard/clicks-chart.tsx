'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { ChartTooltip } from './dashboard-shared'

interface ClicksChartProps {
  earningsData: { date: string; earnings: number; clicks: number }[]
}

export function ClicksChart({ earningsData }: ClicksChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.7 }}
      className="mt-4 lg:mt-6 mobile-hide"
    >
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Daily Clicks</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsData || []}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EE4D2D" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#FF6742" stopOpacity={0.7} />
                  </linearGradient>
                  <filter id="barShadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#EE4D2D" floodOpacity="0.2" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(8)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="clicks" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Clicks" filter="url(#barShadow)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
