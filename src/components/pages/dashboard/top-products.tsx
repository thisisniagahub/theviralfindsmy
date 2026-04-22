'use client'

import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatRM, type DashboardData } from './dashboard-shared'

interface TopProductsProps {
  topLinks: DashboardData['topLinks']
  onNavigate: (page: string) => void
}

export function TopProducts({ topLinks, onNavigate }: TopProductsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.9 }}
    >
      <Card className="border-border/50 shadow-sm glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span>🛍️</span> Top Products
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-shopee hover:text-shopee-dark"
              onClick={() => onNavigate('analytics')}
            >
              View All <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {topLinks?.slice(0, 5).map((link, index) => {
              const category = link.category || 'Electronics'
              const topEarning = (topLinks?.[0]?.earnings || 1)
              const progressPct = (link.earnings / topEarning) * 100
              const catBadgeColor: Record<string, string> = {
                Electronics: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                Fashion: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
                Beauty: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                Home: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                Health: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                Food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
              }
              const catImageColor: Record<string, string> = {
                Electronics: 'bg-blue-500',
                Fashion: 'bg-pink-500',
                Beauty: 'bg-purple-500',
                Home: 'bg-amber-500',
                Health: 'bg-green-500',
                Food: 'bg-orange-500',
              }
              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.9 + index * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-muted-foreground font-medium w-4 text-center flex-shrink-0">{index + 1}</span>
                  {link.productImage && link.productImage.startsWith('/products/') ? (
                    <Image src={link.productImage} alt={link.productName || link.name} width={40} height={40} className="rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-lg ${catImageColor[category] || 'bg-gray-400'} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-lg">📦</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium truncate max-w-[140px]">{link.productName || link.name}</p>
                      <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 flex-shrink-0 ${catBadgeColor[category] || ''}`}>
                        {category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-shopee"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.6, delay: 1 + index * 0.06 }}
                        />
                      </div>
                      <span className="text-[13px] font-bold metric-money flex-shrink-0">{formatRM(link.earnings)}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
