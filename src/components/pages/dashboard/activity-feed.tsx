'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Clock, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { iconMap, type ActivityApiResponse } from './dashboard-shared'
import { TrendingUp } from 'lucide-react'

interface ActivityFeedProps {
  activityItems: ActivityApiResponse[]
  activityOpen: boolean
  onActivityOpenChange: (open: boolean) => void
  isActivityFetching: boolean
  onRefetchActivity: () => void
  onSetPage: (page: string) => void
}

export function ActivityFeed({ activityItems, activityOpen, onActivityOpenChange, isActivityFetching, onRefetchActivity, onSetPage }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 1.2 }}
    >
      <Card className="border-border/50 shadow-sm">
        <Collapsible open={activityOpen} onOpenChange={onActivityOpenChange}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${activityOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2">
                {/* Live indicator dot */}
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">Live</span>
                </div>
                {/* Refresh button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onRefetchActivity()}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isActivityFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-0.5">
                {activityItems.length === 0 && (
                  <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                    {isActivityFetching ? 'Loading...' : 'No recent activity'}
                  </div>
                )}
                {activityItems.map((item, index) => {
                  const IconComponent = iconMap[item.icon] || TrendingUp
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`flex items-start gap-3 p-2.5 rounded-lg ${item.borderClass} hover:bg-muted/50 transition-colors`}
                    >
                      <div className={`p-1.5 rounded-md ${item.color} flex-shrink-0 mt-0.5`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium leading-tight">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span className="hidden sm:inline">{item.time}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-shopee text-xs hover:text-shopee-dark"
                onClick={() => onSetPage('notifications')}
              >
                View All <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}
