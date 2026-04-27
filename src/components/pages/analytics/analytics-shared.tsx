'use client'

export interface AnalyticsData {
  performanceData: { date: string; clicks: number; conversions: number; earnings: number }[]
  topProducts: { id: string; name: string; category: string; clicks: number; conversions: number; earnings: number }[]
  sourceData: { name: string; value: number }[]
  deviceData: { name: string; value: number }[]
  categoryData: { name: string; clicks: number; conversions: number; earnings: number }[]
  funnelData: { stage: string; count: number; color: string }[]
  heatmap: { day: number; hour: number; clicks: number }[]
}

export interface LinkData {
  id: string; name: string; productName: string | null; productImage: string | null
  clicks: number; conversions: number; earnings: number; status: string
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
            {entry.name === 'Revenue' || entry.name === 'Earnings' ? `RM ${entry.value.toFixed(2)}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}
