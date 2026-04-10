'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Wallet,
  Megaphone,
  AlertTriangle,
  CheckCheck,
  DollarSign,
  Info,
  Clock,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Notification {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  read: boolean
}

interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
}

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; borderClass: string }> = {
  conversion: { icon: DollarSign, color: 'text-green-600 bg-green-50 dark:bg-green-900/20', borderClass: 'notification-border-conversion' },
  payout: { icon: Wallet, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', borderClass: 'notification-border-payout' },
  campaign: { icon: Megaphone, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20', borderClass: 'notification-border-campaign' },
  alert: { icon: AlertTriangle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20', borderClass: 'notification-border-alert' },
  system: { icon: Info, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', borderClass: 'notification-border-system' },
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function NotificationsPage() {
  const [filter, setFilter] = useState('all')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', filter],
    queryFn: () => fetch(`/api/notifications?filter=${filter}`).then((r) => r.json()),
  })

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', { method: 'PUT' })
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    queryClient.invalidateQueries({ queryKey: ['notifications-header'] })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-shopee/10 text-shopee">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="w-fit">
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5">
            Unread
            {unreadCount > 0 && (
              <Badge className="h-4 min-w-[16px] px-1 text-[10px] bg-shopee text-white border-0">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notification List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {notifications.map((notif, index) => {
            const config = typeConfig[notif.type] || typeConfig.system
            const Icon = config.icon
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card className={`border-border/50 shadow-sm ${config.borderClass} ${!notif.read ? 'bg-shopee/[0.02] dark:bg-shopee/[0.04]' : ''}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.color} flex-shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium'}`}>{notif.title}</p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-shopee flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notif.description}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {timeAgo(notif.timestamp)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {notifications.length === 0 && (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-8 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
