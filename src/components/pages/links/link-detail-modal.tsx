'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Link2, MousePointerClick, TrendingUp, DollarSign, CheckCircle2, Calendar, Copy, QrCode, Share2, Pencil, Pause, Play } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis } from 'recharts'
import { type Link, type LinkStats, statusColors, ProductImageThumb } from './links-shared'

interface LinkDetailModalProps {
  link: Link
  linkStats: LinkStats | undefined
  convRate: string
  onClose: () => void
  onCopyLink: (url: string) => void
  onQrCode: (link: Link) => void
  onShare: (link: Link) => void
  onEdit: (link: Link) => void
  onToggleStatus: (link: Link) => void
}

export function LinkDetailModal({ link, linkStats, convRate, onClose, onCopyLink, onQrCode, onShare, onEdit, onToggleStatus }: LinkDetailModalProps) {
  return (
    <Dialog open={!!link} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {link.productImage && (
              <ProductImageThumb src={link.productImage} size={40} className="w-10 h-10 rounded-lg" />
            )}
            <div className="min-w-0">
              <div className="truncate">{link.name}</div>
              <div className="text-sm font-normal text-muted-foreground truncate">{link.productName}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <code className="text-sm truncate flex-1">{link.affiliateUrl}</code>
          <Button variant="outline" size="sm" className="h-7 px-2 flex-shrink-0" onClick={() => onCopyLink(link.affiliateUrl)}>
            <Copy className="w-3 h-3 mr-1" /> Copy
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: MousePointerClick, label: 'Clicks', value: link.clicks.toLocaleString(), color: 'text-blue-600' },
            { icon: TrendingUp, label: 'Conversions', value: link.conversions.toString(), color: 'text-green-600' },
            { icon: DollarSign, label: 'Earnings', value: `RM ${link.earnings.toFixed(2)}`, color: 'text-shopee' },
            { icon: CheckCircle2, label: 'Conv. Rate', value: `${convRate}%`, color: 'text-purple-600' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="text-center p-2 rounded-lg bg-muted/30">
                <Icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                <div className="text-sm font-bold">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            )
          })}
        </div>

        {linkStats?.dailyClicks && linkStats.dailyClicks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Clicks (Last 7 Days)</p>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={linkStats.dailyClicks}>
                  <defs>
                    <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EE4D2D" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EE4D2D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                  <Area type="monotone" dataKey="clicks" stroke="#EE4D2D" fill="url(#sparkGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Created {new Date(link.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <Badge variant="secondary" className={`text-[10px] px-2.5 py-0.5 ${statusColors[link.status] || ''}`}>
            {link.status}
          </Badge>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onCopyLink(link.affiliateUrl)}>
            <Copy className="w-4 h-4 mr-1.5" /> Copy Link
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => { onQrCode(link); onClose() }}>
            <QrCode className="w-4 h-4 mr-1.5" /> QR Code
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => { onShare(link); onClose() }}>
            <Share2 className="w-4 h-4 mr-1.5" /> Share
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => { onEdit(link); onClose() }}>
            <Pencil className="w-4 h-4 mr-1.5" /> Edit
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onToggleStatus(link)}
          >
            {link.status === 'active' ? (
              <><Pause className="w-4 h-4 mr-1.5" /> Pause</>
            ) : (
              <><Play className="w-4 h-4 mr-1.5" /> Activate</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
