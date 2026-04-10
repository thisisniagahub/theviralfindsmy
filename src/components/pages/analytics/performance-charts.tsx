'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ChartTooltip, type AnalyticsData } from './analytics-shared'

interface PerformanceChartsProps {
  data: AnalyticsData | undefined
}

export function PerformanceCharts({ data }: PerformanceChartsProps) {
  return (
    <>
      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Clicks & Conversions Line */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Clicks & Conversions</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.performanceData || []}>
                  <defs>
                    <linearGradient id="clickGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="convGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="clicks" stroke="#3B82F6" fill="url(#clickGrad2)" strokeWidth={2} />
                  <Area type="monotone" dataKey="conversions" stroke="#22C55E" fill="url(#convGrad2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Area */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Revenue Over Time</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.performanceData || []}>
                  <defs>
                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EE4D2D" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EE4D2D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `RM${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="earnings" stroke="#EE4D2D" fill="url(#revGrad2)" strokeWidth={2} name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Bar */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Top 10 Products by Earnings</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topProducts || []} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `RM${v}`} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="earnings" fill="#EE4D2D" radius={[0, 4, 4, 0]} name="Earnings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel + Device/Source */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Funnel */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-3">
            {data?.funnelData?.map((step, i) => {
              const maxCount = data.funnelData[0].count
              const width = Math.max((step.count / maxCount) * 100, 10)
              return (
                <div key={step.stage}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{step.stage}</span>
                    <span className="text-muted-foreground">{step.count.toLocaleString()}</span>
                  </div>
                  <div className="h-8 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-700 flex items-center px-3"
                      style={{ width: `${width}%`, backgroundColor: step.color }}
                    >
                      {width > 25 && <span className="text-xs text-white font-medium">{step.count.toLocaleString()}</span>}
                    </div>
                  </div>
                  {i < data.funnelData.length - 1 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {((step.count / data.funnelData[i + 1].count) * 100).toFixed(0)}% → next stage
                    </p>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Device Breakdown</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.deviceData || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {(data?.deviceData || []).map((_, i) => (
                      <Cell key={`dev-${i}`} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Traffic Sources</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Source</TableHead><TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Clicks</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {data?.sourceData?.slice(0, 8).map((src, idx) => (
                  <TableRow key={src.name} className={idx % 2 === 1 ? 'even:bg-muted/30' : ''}>
                    <TableCell className="text-[13px] font-medium">{src.name}</TableCell>
                    <TableCell className="text-right text-[13px] font-medium">{src.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Category Performance</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Category</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Clicks</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Conversions</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Earnings</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Conv. Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.categoryData?.map((cat, idx) => {
                  const rate = cat.clicks > 0 ? ((cat.conversions / cat.clicks) * 100).toFixed(1) : '0'
                  return (
                    <TableRow key={cat.name} className={idx % 2 === 1 ? 'even:bg-muted/30' : ''}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{cat.name}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-[13px] font-medium">{cat.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-[13px] font-medium">{cat.conversions}</TableCell>
                      <TableCell className="text-right text-[13px] font-medium metric-money">RM {cat.earnings.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-[13px] font-medium">{rate}%</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

const DEVICE_COLORS = ['#EE4D2D', '#3B82F6', '#22C55E']
