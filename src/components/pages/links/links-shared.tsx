'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import {
  DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Download, QrCode } from 'lucide-react'

export interface Link {
  id: string; name: string; productUrl: string; affiliateUrl: string; productName: string | null
  productImage: string | null; productPrice: number | null; clicks: number; conversions: number
  earnings: number; status: string; shortCode: string; category: string | null
  campaign: { id: string; name: string } | null; createdAt: string; expiresAt: string | null
  dailyClicks: number[]; expiresIn: number | null; isExpired: boolean; expiryStatus: 'none' | 'active' | 'expiring_soon' | 'expired'
}

export interface LinksResponse {
  links: Link[]
  campaigns: { id: string; name: string }[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface LinkStats {
  dailyClicks: { date: string; clicks: number }[]
}

export const statusColors: Record<string, string> = {
  active: 'badge-dot badge-dot-success',
  paused: 'badge-dot badge-dot-warning',
  expired: 'badge-dot badge-dot-error',
}

// Sparkline chart component
export function SparklineChart({ data, total }: { data: number[]; total: number }) {
  const [hovered, setHovered] = useState(false)
  const w = 80
  const h = 28
  const pad = 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((val, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (val - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })

  const linePoints = points.join(' ')

  // Fill area: start from bottom-left, trace the line, end at bottom-right
  const fillPoints = `${pad},${h - pad} ${linePoints} ${w - pad},${h - pad}`

  // Determine trend color
  const firstHalf = data.slice(0, 3).reduce((a, b) => a + b, 0) / 3
  const secondHalf = data.slice(4).reduce((a, b) => a + b, 0) / 3
  const trendColor = secondHalf > firstHalf * 1.05 ? '#22C55E' : secondHalf < firstHalf * 0.95 ? '#EF4444' : '#EE4D2D'
  const gradId = `spark-fill-${Math.random().toString(36).slice(2, 8)}`

  // Generate date labels for tooltip
  const now = new Date()
  const dateLabels = data.map((_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })
  })

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-20 h-7">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity={0.2} />
            <stop offset="100%" stopColor={trendColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <polygon points={fillPoints} fill={`url(#${gradId})`} />
        <polyline
          points={linePoints}
          fill="none"
          stroke={trendColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {hovered && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-popover text-popover-foreground border border-border rounded-md shadow-lg text-[10px] whitespace-nowrap pointer-events-none">
          <div className="font-medium">{dateLabels[0]} — {dateLabels[6]}</div>
          <div className="text-muted-foreground">Total: {total.toLocaleString()} clicks</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
        </div>
      )}
    </div>
  )
}

// Renders product image: real <img> for /products/ paths, colored placeholder fallback
export function ProductImageThumb({ src, size = 36, className = '' }: { src: string; size?: number; className?: string }) {
  const isRealImage = src.startsWith('/products/')
  if (isRealImage) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={`rounded-md object-cover flex-shrink-0 ${className}`}
      />
    )
  }
  // Colored block fallback
  const colors = ['bg-shopee/20', 'bg-blue-500/20', 'bg-pink-500/20', 'bg-purple-500/20', 'bg-green-500/20', 'bg-amber-500/20']
  const idx = src.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return (
    <div className={`${colors[idx]} rounded-md flex items-center justify-center flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <span className="text-muted-foreground text-xs">📦</span>
    </div>
  )
}

// Share Dialog Component
export function ShareDialog({ link }: { link: Link }) {
  const { toast } = useToast()
  const price = link.productPrice || 0
  const originalPrice = price ? (price * 1.3).toFixed(2) : '0.00'
  const shareMessage = `🔥 Check out this deal! ${link.productName || link.name} - RM ${price.toFixed(2)} (was RM ${originalPrice})\n\nShop now: ${link.affiliateUrl}`
  const encodedText = encodeURIComponent(shareMessage)
  const encodedUrl = encodeURIComponent(link.affiliateUrl)

  const copyMessage = () => {
    navigator.clipboard.writeText(shareMessage)
    toast({ title: 'Message copied!', description: 'Share message copied to clipboard.' })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Share This Deal</DialogTitle>
        <DialogDescription>Share this product with your audience</DialogDescription>
      </DialogHeader>
      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border">
        {link.productImage && (
          <ProductImageThumb src={link.productImage} size={64} className="w-16 h-16 rounded-lg" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{link.productName || link.name}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-bold metric-money">RM {price.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground line-through">RM {originalPrice}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{shareMessage}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => window.open(`https://wa.me/?text=${encodedText}`, '_blank')}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </Button>
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank')}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          Telegram
        </Button>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </Button>
        <Button variant="outline" onClick={copyMessage}>
          <Copy className="w-4 h-4 mr-2" /> Copy Message
        </Button>
      </div>
    </>
  )
}

// QR Code Dialog Component
export function QRCodeDialog({ link }: { link: Link }) {
  const { toast } = useToast()
  const [qrSvg, setQrSvg] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Fetch QR code on mount
  const fetchQr = useCallback(async (url: string) => {
    setLoading(true)
    setQrSvg('')
    try {
      const res = await fetch('/api/links/qr-code?url=' + encodeURIComponent(url))
      if (res.ok) {
        const data = await res.json()
        setQrSvg(data.svg)
      }
    } catch {
      // fallback: placeholder shown
    } finally {
      setLoading(false)
    }
  }, [])

  // Trigger fetch on mount
  const [fetched, setFetched] = useState(false)
  if (!fetched) {
    setFetched(true)
    fetchQr(link.affiliateUrl)
  }

  const downloadSvg = () => {
    if (!qrSvg) return
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${link.shortCode || 'qrcode'}.svg`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'QR code downloaded!' })
  }

  const copyLink = () => {
    navigator.clipboard.writeText(link.affiliateUrl)
    toast({ title: 'Link copied to clipboard!' })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-shopee" />
          QR Code
        </DialogTitle>
        <DialogDescription>Scan this QR code to visit your affiliate link</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center gap-4 py-4">
        <div className="p-4 bg-white rounded-xl border border-border shadow-sm">
          {loading ? (
            <div className="w-52 h-52 bg-muted rounded-lg animate-pulse flex items-center justify-center">
              <QrCode className="w-8 h-8 text-muted-foreground" />
            </div>
          ) : qrSvg ? (
            <div
              className="w-52 h-52 [&_svg]:w-full [&_svg]:h-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : (
            <div className="w-52 h-52 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
              Failed to generate QR code
            </div>
          )}
        </div>

        <div className="text-center max-w-xs">
          <p className="text-sm font-semibold truncate">{link.productName || link.name}</p>
          {link.productPrice && (
            <p className="text-sm metric-money font-bold mt-1">
              RM {link.productPrice.toFixed(2)}
            </p>
          )}
        </div>

        <div className="w-full p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Affiliate URL</p>
          <code className="text-xs break-all">{link.affiliateUrl}</code>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="outline" className="flex-1" onClick={downloadSvg} disabled={!qrSvg}>
          <Download className="w-4 h-4 mr-1.5" /> Download SVG
        </Button>
        <Button variant="outline" className="flex-1" onClick={copyLink}>
          <Copy className="w-4 h-4 mr-1.5" /> Copy Link
        </Button>
      </DialogFooter>
    </>
  )
}
