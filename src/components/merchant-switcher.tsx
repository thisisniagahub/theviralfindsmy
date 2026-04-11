'use client'

import { useState } from 'react'
import { ChevronDown, ShoppingBag } from 'lucide-react'

export type MerchantId = 'shopee' | 'lazada' | 'tiktok' | 'amazon'

interface MerchantDef {
  id: MerchantId
  name: string
  color: string
  bgColor: string
  icon: string
}

const MERCHANTS: MerchantDef[] = [
  { id: 'shopee', name: 'Shopee', color: '#EE4D2D', bgColor: '#EE4D2D10', icon: '🛍️' },
  { id: 'lazada', name: 'Lazada', color: '#0F146D', bgColor: '#0F146D10', icon: '🛒' },
  { id: 'tiktok', name: 'TikTok Shop', color: '#000000', bgColor: '#00000010', icon: '🎵' },
  { id: 'amazon', name: 'Amazon', color: '#FF9900', bgColor: '#FF990010', icon: '📦' },
]

interface MerchantSwitcherProps {
  currentMerchant: MerchantId
  onChange: (merchant: MerchantId) => void
}

export function MerchantSwitcher({ currentMerchant, onChange }: MerchantSwitcherProps) {
  const [open, setOpen] = useState(false)
  const current = MERCHANTS.find(m => m.id === currentMerchant) || MERCHANTS[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
      >
        <span>{current.icon}</span>
        <span className="font-medium">{current.name}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-[180px]">
            {MERCHANTS.map((merchant) => (
              <button
                key={merchant.id}
                onClick={() => { onChange(merchant.id); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted transition-colors text-sm text-left"
                style={{
                  backgroundColor: merchant.id === currentMerchant ? merchant.bgColor : undefined,
                }}
              >
                <span>{merchant.icon}</span>
                <span className="font-medium">{merchant.name}</span>
                {merchant.id === currentMerchant && (
                  <span className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: merchant.color }} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
