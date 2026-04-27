'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  Wallet,
  TrendingUp,
  CheckCircle,
  MousePointerClick,
  Link2,
  Eye,
  Target,
  BarChart3,
  FileText,
  Trash2,
  Radio,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// --- Types ---

interface ActivityItem {
  id: string
  activityType: 'click' | 'conversion' | 'payout' | 'link' | 'system' | 'campaign'
  title: string
  description: string
  timestamp: string
  icon: string
  color: string
  time?: string
}

interface ActivityApiResponse {
  activities: Array<{
    id: string
    type: string
    title: string
    description: string
    timestamp: string
    icon: string
    time?: string
    metadata?: Record<string, unknown>
  }>
}

// --- Constants ---

const MAX_ITEMS = 20

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Wallet,
  TrendingUp,
  CheckCircle,
  MousePointerClick,
  Link2,
  Eye,
  Target,
  BarChart3,
  FileText,
}

const colorMap: Record<string, string> = {
  click: '#3B82F6',
  conversion: '#22C55E',
  payout: '#EE4D2D',
  link: '#8B5CF6',
  system: '#6B7280',
  campaign: '#F59E0B',
}

// --- Helpers ---

function generateId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'Yesterday'
  return `${diffDay} days ago`
}

function mapApiToActivity(item: ActivityApiResponse['activities'][0]): ActivityItem {
  const typeColor = colorMap[item.type] || '#6B7280'
  return {
    id: item.id,
    activityType: item.type as ActivityItem['activityType'],
    title: item.title,
    description: item.description,
    timestamp: item.timestamp,
    icon: item.icon,
    color: typeColor,
    time: item.time || getRelativeTime(item.timestamp),
  }
}

// --- Component ---

interface ActivityStreamProps {
  open: boolean
  onClose: () => void
}

export function ActivityStream({ open, onClose: _onClose }: ActivityStreamProps) {
  // Fetch initial activities from API
  const { data } = useQuery({
    queryKey: ['activity-stream-initial'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/activity?limit=10')
        if (!res.ok) return null
        const json: ActivityApiResponse = await res.json()
        return json
      } catch {
        return null
      }
    },
    staleTime: Infinity,
  })

  // Derive initial activities from API data
  const initialActivities = useMemo<ActivityItem[]>(() => {
    if (data?.activities && data.activities.length > 0) {
      return data.activities.map(mapApiToActivity)
    }
    return []
  }, [data])

  // Socket activities arrive in real-time; track them separately
  const [socketActivities, setSocketActivities] = useState<ActivityItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Merge: socket activities on top, then API activities (de-duplicated)
  const activities = useMemo(() => {
    const apiIds = new Set(initialActivities.map((a) => a.id))
    const dedupedSocket = socketActivities.filter((a) => !apiIds.has(a.id))
    const merged = [...dedupedSocket, ...initialActivities]
    return merged.slice(0, MAX_ITEMS)
  }, [socketActivities, initialActivities])

  // Connect to Socket.IO for live activity events
  useEffect(() => {
    if (!open) return

    const socket: Socket = io('/?XTransformPort=3004', {
      transports: ['websocket', 'polling'],
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', () => {
      setIsConnected(false)
    })

    socket.on('activity', (event: Omit<ActivityItem, 'id'>) => {
      const newActivity: ActivityItem = {
        ...event,
        id: generateId(),
        time: getRelativeTime(event.timestamp),
      }
      setSocketActivities((prev) => {
        const updated = [newActivity, ...prev]
        return updated.length > MAX_ITEMS ? updated.slice(0, MAX_ITEMS) : updated
      })

      // Scroll to top to show new item
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0
      }
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [open])

  const clearAll = useCallback(() => {
    setSocketActivities([])
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute right-0 top-full mt-2 w-[360px] glass-card shadow-xl border border-border/50 z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-shopee" />
              <h3 className="text-sm font-semibold">Activity Stream</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="live-indicator">Live</span>
              {!isConnected && (
                <span className="text-[10px] text-muted-foreground">(connecting...)</span>
              )}
            </div>
          </div>

          {/* Activity List */}
          <div
            ref={scrollRef}
            className="max-h-[400px] overflow-y-auto custom-scrollbar"
          >
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Radio className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Real-time activities will appear here
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {activities.map((item) => {
                  const IconComponent = iconMap[item.icon] || TrendingUp
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="flex items-start gap-3 px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                      style={{ borderLeft: `2px solid ${item.color}` }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <IconComponent
                          className="w-4 h-4"
                          style={{ color: item.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {item.time || getRelativeTime(item.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          {activities.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/20">
              <span className="text-[11px] text-muted-foreground">
                {activities.length} activit{activities.length === 1 ? 'y' : 'ies'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                onClick={clearAll}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
