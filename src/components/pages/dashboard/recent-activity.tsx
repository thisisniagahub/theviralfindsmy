'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { motion } from 'framer-motion'
import { formatRM, statusColor, type DashboardData } from './dashboard-shared'

interface RecentActivityProps {
  topLinks: DashboardData['topLinks']
  recentConversions: DashboardData['recentConversions']
}

export function RecentActivity({ topLinks, recentConversions }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.8 }}
    >
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Links & Conversions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="top-links">
            <TabsList className="mb-3">
              <TabsTrigger value="top-links" className="text-xs">Top Links</TabsTrigger>
              <TabsTrigger value="conversions" className="text-xs">Recent Conversions</TabsTrigger>
            </TabsList>

            <TabsContent value="top-links">
              <div className="overflow-x-auto table-scroll-mobile"><Table className="min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Clicks</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Conv.</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLinks?.map((link, idx) => (
                    <TableRow key={link.id} className={`table-row-hover ${idx % 2 === 1 ? 'even:bg-muted/30' : ''}`}>
                      <TableCell className="font-medium text-[13px] max-w-[160px] truncate">{link.name}</TableCell>
                      <TableCell className="text-right text-[13px]">{link.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-[13px] hidden sm:table-cell">{link.conversions}</TableCell>
                      <TableCell className="text-right text-[13px] font-medium metric-money">{formatRM(link.earnings)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </TabsContent>

            <TabsContent value="conversions">
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                <div className="overflow-x-auto table-scroll-mobile"><Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
                      <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                      <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Comm.</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentConversions?.map((conv, idx) => (
                      <TableRow key={conv.id} className={`table-row-hover ${idx % 2 === 1 ? 'even:bg-muted/30' : ''}`}>
                        <TableCell className="font-medium text-[13px] max-w-[140px] truncate">
                          {conv.affiliateLink?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right text-[13px]">{formatRM(conv.amount)}</TableCell>
                        <TableCell className="text-right text-[13px] font-medium metric-positive hidden sm:table-cell">{formatRM(conv.commission)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ${statusColor[conv.status] || ''}`}>
                            {conv.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
