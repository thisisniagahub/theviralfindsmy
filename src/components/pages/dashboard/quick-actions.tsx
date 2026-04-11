'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link2, BarChart3, FileText, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'

interface QuickActionsProps {
  onSetPage: (page: string) => void
  onExportCSV: () => void
}

export function QuickActions({ onSetPage, onExportCSV }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Link2, label: 'Create Link', desc: 'Generate new affiliate link', page: 'links', primary: true },
              { icon: BarChart3, label: 'View Campaigns', desc: 'Manage your campaigns', page: 'campaigns', primary: false },
              { icon: FileText, label: 'Generate Report', desc: 'Download analytics report', action: 'report', primary: false },
              { icon: Wallet, label: 'Request Payout', desc: 'Cash out your earnings', page: 'earnings', primary: false },
            ].map((item) => {
              const Icon = item.icon
              const page = item.page as string
              return (
                <Button
                  key={item.label}
                  variant={item.primary ? 'outline' : 'outline'}
                  className={`h-auto p-4 flex-col items-start gap-2 group ${item.primary ? 'btn-shopee-outline' : 'hover:border-shopee/30 hover:bg-shopee/5'}`}
                  onClick={() => {
                    if (item.action === 'report') {
                      onExportCSV()
                    } else {
                      onSetPage(page)
                    }
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <Icon className={`w-5 h-5 ${item.primary ? 'text-shopee' : 'text-muted-foreground group-hover:text-shopee'} transition-colors`} />
                  </motion.div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
