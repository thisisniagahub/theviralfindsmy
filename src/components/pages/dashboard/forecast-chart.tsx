'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ForecastPoint {
  date: string
  value: number
  confidence: number
}

interface ForecastData {
  optimistic: ForecastPoint[]
  expected: ForecastPoint[]
  pessimistic: ForecastPoint[]
  trend: 'up' | 'down' | 'stable'
  growthRate: number
  suggestedAction: string
}

export function ForecastChart({ days = 30 }: { days?: number }) {
  const { data, isLoading, refetch } = useQuery<{ forecast: ForecastData }>({
    queryKey: ['forecast', days],
    queryFn: () => fetch(`/api/forecast/earnings?days=${days}`).then(r => r.json()),
    refetchInterval: 5 * 60_000, // Every 5 minutes
  })

  if (isLoading) {
    return <Skeleton className="h-64 rounded-xl" />
  }

  if (!data?.forecast) return null

  const { forecast } = data

  // Merge all 3 scenarios into chart data
  const chartData = forecast.expected.map((exp, i) => ({
    date: exp.date,
    expected: Math.round(exp.value * 100) / 100,
    optimistic: Math.round(forecast.optimistic[i].value * 100) / 100,
    pessimistic: Math.round(forecast.pessimistic[i].value * 100) / 100,
  }))

  const totalForecast = forecast.expected.reduce((sum, e) => sum + e.value, 0)

  const TrendIcon = forecast.trend === 'up' ? TrendingUp : forecast.trend === 'down' ? TrendingDown : Minus
  const trendColor = forecast.trend === 'up' ? 'text-green-500' : forecast.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'

  return (
    <Card className="glass-card card-accent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-shopee" />
            Earnings Forecast ({days} days)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`text-xs ${trendColor}`}>
              <TrendIcon className="w-3 h-3 mr-1" />
              {forecast.growthRate.toFixed(1)}%
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 w-7 p-0">
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-2 rounded-lg bg-green-500/10 text-center">
            <p className="text-xs text-muted-foreground">Optimistic</p>
            <p className="text-sm font-bold text-green-500">
              RM {chartData.reduce((s, d) => s + d.optimistic, 0).toFixed(2)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-shopee/10 text-center">
            <p className="text-xs text-muted-foreground">Expected</p>
            <p className="text-sm font-bold text-shopee">RM {totalForecast.toFixed(2)}</p>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 text-center">
            <p className="text-xs text-muted-foreground">Pessimistic</p>
            <p className="text-sm font-bold text-red-500">
              RM {chartData.reduce((s, d) => s + d.pessimistic, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EE4D2D" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EE4D2D" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPessimistic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => v.slice(5)}
                fontSize={10}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                fontSize={10}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => `RM${v}`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [`RM ${value.toFixed(2)}`, name]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="optimistic"
                stroke="#22c55e"
                fill="url(#colorOptimistic)"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
              <Area
                type="monotone"
                dataKey="expected"
                stroke="#EE4D2D"
                fill="url(#colorExpected)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="pessimistic"
                stroke="#ef4444"
                fill="url(#colorPessimistic)"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Action Suggestion */}
        {forecast.suggestedAction && (
          <div className="mt-3 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            💡 {forecast.suggestedAction}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
