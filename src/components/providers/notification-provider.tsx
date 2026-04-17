'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import type { NotificationEvent } from '@/lib/notification-types'

interface NotificationContextValue {
  /** Whether the socket is currently connected to the notification service */
  isConnected: boolean
  /** The most recent notification event received */
  latestNotification: NotificationEvent | null
  /** Full history of notifications received during this session */
  notifications: NotificationEvent[]
  /** Manually clear the notification history */
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  isConnected: false,
  latestNotification: null,
  notifications: [],
  clearNotifications: () => { },
})

const MAX_NOTIFICATIONS = 100

const typeToastConfig: Record<
  NotificationEvent['type'],
  { icon: string; description: string }
> = {
  conversion: { icon: '💰', description: 'Commission earned!' },
  click: { icon: '🖱️', description: 'New click on your link' },
  payout: { icon: '💸', description: 'Payout credited' },
  milestone: { icon: '🏆', description: 'Milestone reached!' },
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [latestNotification, setLatestNotification] =
    useState<NotificationEvent | null>(null)
  const [notifications, setNotifications] = useState<NotificationEvent[]>([])
  const socketRef = useRef<Socket | null>(null)

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setLatestNotification(null)
  }, [])

  useEffect(() => {
    // Notification sockets are optional in local dev.
    // Only auto-connect when a public URL is configured, otherwise keep the UI quiet.
    const socketUrl = process.env.NEXT_PUBLIC_NOTIFICATION_URL?.trim()
      || (process.env.NODE_ENV === 'production'
        ? 'https://shopee.gangniaga.my/?XTransformPort=3004'
        : '')

    if (!socketUrl) {
      return
    }

    const socket: Socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
      timeout: 15000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      console.warn('[NotificationProvider] Connected to notification service')
    })

    socket.on('disconnect', (reason) => {
      setIsConnected(false)
      console.warn(
        `[NotificationProvider] Disconnected from notification service: ${reason}`
      )
    })

    socket.on('connect_error', (error) => {
      setIsConnected(false)
      // Suppress timeout errors in production — service is optional
      if (error.message !== 'timeout') {
        console.warn('[NotificationProvider] Connection error:', error.message)
      }
    })

    socket.on('connected', (data: { message: string }) => {
      console.warn('[NotificationProvider] Server acknowledged:', data.message)
    })

    socket.on('notification', (event: NotificationEvent) => {
      // Update state
      setLatestNotification(event)
      setNotifications((prev) => {
        const updated = [event, ...prev]
        // Keep only the most recent notifications to avoid unbounded memory growth
        return updated.length > MAX_NOTIFICATIONS
          ? updated.slice(0, MAX_NOTIFICATIONS)
          : updated
      })

      // Show Sonner toast
      const config = typeToastConfig[event.type] || typeToastConfig.click
      toast(config.icon + ' ' + event.title, {
        description: event.message,
        duration: 5000,
      })
    })

    // Cleanup on unmount
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const value: NotificationContextValue = {
    isConnected,
    latestNotification,
    notifications,
    clearNotifications,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      'useNotification must be used within a <NotificationProvider>'
    )
  }
  return context
}
