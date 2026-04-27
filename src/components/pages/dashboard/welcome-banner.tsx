'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatRM } from './dashboard-shared'

interface WelcomeBannerProps {
  totalEarnings: number
  todayStr: string
  onExportCSV: () => void
  onExportPDF: () => void
}

export function WelcomeBanner({ totalEarnings, todayStr, onExportCSV, onExportPDF }: WelcomeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 shadow-sm bg-gradient-to-r from-shopee/5 via-shopee/10 to-shopee/5 dark:from-shopee/10 dark:via-shopee/20 dark:to-shopee/10 overflow-hidden relative card-shine">
        {/* Decorative gradient blob on right side */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-shopee/10 dark:bg-shopee/20 blur-2xl pointer-events-none" />
        <div className="absolute right-8 bottom-0 w-24 h-24 rounded-full bg-shopee/5 dark:bg-shopee/15 blur-xl pointer-events-none" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">Welcome back, Ahmad! 👋</h1>
              <p className="text-sm text-muted-foreground mt-1">{todayStr}</p>
              <p className="text-sm text-shopee font-medium mt-2">
                You earned <span className="font-bold metric-money">{formatRM(totalEarnings)}</span> this month — keep up the great work!
              </p>
              {/* Today's Goal Progress Bar */}
              <div className="mt-3 p-3 bg-white/60 dark:bg-card/60 rounded-lg border border-border/40">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-muted-foreground">Today's Goal</span>
                  <span className="font-semibold text-shopee">RM 73.50 / RM 100.00</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-shopee to-shopee-gold"
                    initial={{ width: 0 }}
                    animate={{ width: '73.5%' }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">73.5% of daily target reached</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/80 dark:bg-card/80">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onExportCSV}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onExportPDF}>
                    <Printer className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
