'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { GitCompareArrows } from 'lucide-react'
import { type LinkData } from './analytics-shared'

interface LinkComparisonProps {
  links: LinkData[]
  compareLinkA: string
  compareLinkB: string
  onCompareLinkAChange: (value: string) => void
  onCompareLinkBChange: (value: string) => void
  linkA: LinkData | undefined
  linkB: LinkData | undefined
}

export function LinkComparison({ links, compareLinkA, compareLinkB, onCompareLinkAChange, onCompareLinkBChange, linkA, linkB }: LinkComparisonProps) {
  // Comparison metrics
  const compData = (linkA && linkB) ? [
    { label: 'Clicks', a: linkA.clicks, b: linkB.clicks, format: (v: number) => v.toLocaleString() },
    { label: 'Conversions', a: linkA.conversions, b: linkB.conversions, format: (v: number) => v.toLocaleString() },
    { label: 'Earnings', a: linkA.earnings, b: linkB.earnings, format: (v: number) => `RM ${v.toFixed(2)}` },
    { label: 'Conversion Rate', a: linkA.clicks > 0 ? (linkA.conversions / linkA.clicks) * 100 : 0, b: linkB.clicks > 0 ? (linkB.conversions / linkB.clicks) * 100 : 0, format: (v: number) => `${v.toFixed(1)}%` },
  ] : []

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <GitCompareArrows className="w-5 h-5 text-shopee" />
        <h2 className="text-base font-semibold">Compare Links</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Select two affiliate links to compare their performance side-by-side.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Select value={compareLinkA} onValueChange={onCompareLinkAChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select Link A" />
          </SelectTrigger>
          <SelectContent>
            {links.filter((l) => l.id !== compareLinkB).map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={compareLinkB} onValueChange={onCompareLinkBChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select Link B" />
          </SelectTrigger>
          <SelectContent>
            {links.filter((l) => l.id !== compareLinkA).map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {linkA && linkB && (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 lg:p-6">
            {/* Product Headers */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3">
                {linkA.productImage && <img src={linkA.productImage} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">Link A</p>
                  <p className="text-xs text-muted-foreground truncate">{linkA.productName || linkA.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {linkB.productImage && <img src={linkB.productImage} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">Link B</p>
                  <p className="text-xs text-muted-foreground truncate">{linkB.productName || linkB.name}</p>
                </div>
              </div>
            </div>

            {/* Metrics Comparison */}
            <div className="space-y-4">
              {compData.map((metric) => {
                const maxVal = Math.max(metric.a, metric.b, 1)
                const aPct = (metric.a / maxVal) * 100
                const bPct = (metric.b / maxVal) * 100
                const ratioA = metric.b > 0 ? metric.a / metric.b : 0
                const ratioB = metric.a > 0 ? metric.b / metric.a : 0
                const winner = metric.a > metric.b ? 'A' : metric.b > metric.a ? 'B' : null
                const ratioVal = winner === 'A' ? ratioA.toFixed(1) : ratioB.toFixed(1)
                return (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-muted-foreground">{metric.label}</span>
                      {winner && (
                        <Badge variant="secondary" className="text-[10px] bg-shopee/10 text-shopee border-0">
                          Link {winner} leads — {ratioVal}x
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">A</span>
                          <span className={`font-semibold ${winner === 'A' ? 'metric-positive' : ''}`}>{metric.format(metric.a)}</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${winner === 'A' ? 'bg-green-500' : 'bg-muted-foreground/30'}`} style={{ width: `${aPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">B</span>
                          <span className={`font-semibold ${winner === 'B' ? 'metric-positive' : ''}`}>{metric.format(metric.b)}</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${winner === 'B' ? 'bg-green-500' : 'bg-muted-foreground/30'}`} style={{ width: `${bPct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg text-center">
              {(() => {
                const aScore = linkA.earnings + linkA.conversions * 10
                const bScore = linkB.earnings + linkB.conversions * 10
                const winnerLink = aScore > bScore ? linkA : linkB
                const ratio = aScore > bScore ? (aScore / bScore).toFixed(1) : (bScore / aScore).toFixed(1)
                return (
                  <p className="text-sm">
                    <span className="font-semibold">{winnerLink.name}</span>
                    {' '}is the overall winner — performing <span className="metric-highlight">{ratio}x</span> better
                  </p>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {!linkA || !linkB && (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            <GitCompareArrows className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select two links above to start comparing</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
