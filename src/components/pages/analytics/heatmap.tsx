'use client'

import {
  Tooltip as ShadTooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

// Heatmap helpers
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function formatHour(h: number): string {
  if (h === 0) return '12a'
  if (h < 12) return `${h}a`
  if (h === 12) return '12p'
  return `${h - 12}p`
}

export function ClickHeatmapGrid({ data }: { data: { day: number; hour: number; clicks: number }[] }) {
  const maxClicks = Math.max(...data.map((d) => d.clicks), 1)

  const lookup: Record<string, number> = {}
  for (const d of data) {
    lookup[`${d.day}-${d.hour}`] = d.clicks
  }

  return (
    <div
      className="grid grid-cols-[40px_repeat(7,1fr)] gap-[3px] min-w-[320px]"
      role="img"
      aria-label="Click performance heatmap showing click volume by day and hour"
    >
      {/* Corner cell */}
      <div />

      {/* Day headers - full names (desktop) */}
      {DAY_NAMES.map((name) => (
        <div key={name} className="text-center text-[11px] font-medium text-muted-foreground pb-1 hidden sm:block">
          {name}
        </div>
      ))}
      {/* Day headers - short names (mobile) */}
      {DAY_SHORT.map((name) => (
        <div key={`s-${name}`} className="text-center text-[10px] font-medium text-muted-foreground pb-1 sm:hidden">
          {name}
        </div>
      ))}

      {/* Hour rows: each row = hour label + 7 data cells */}
      {Array.from({ length: 24 }, (_, hour) => (
        <div key={`row-${hour}`} className="contents">
          {/* Hour label */}
          <div className="h-5 sm:h-6 flex items-center justify-end pr-2 text-[10px] text-muted-foreground font-mono">
            {formatHour(hour)}
          </div>
          {/* 7 day cells for this hour */}
          {Array.from({ length: 7 }, (_, day) => {
            const clicks = lookup[`${day}-${hour}`] || 0
            const opacity = maxClicks > 0 ? Math.max(clicks / maxClicks, 0.04) : 0.04

            return (
              <ShadTooltip key={`${hour}-${day}`}>
                <TooltipTrigger asChild>
                  <div
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm cursor-default transition-transform hover:scale-125"
                    style={{ backgroundColor: `rgba(238, 77, 45, ${opacity})` }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-medium">
                  <span className="font-semibold">{DAY_NAMES[day]}</span> at {formatHour(hour).replace(/a$/, ' AM').replace(/p$/, ' PM')}: <span className="text-shopee">{clicks} clicks</span>
                </TooltipContent>
              </ShadTooltip>
            )
          })}
        </div>
      ))}
    </div>
  )
}
