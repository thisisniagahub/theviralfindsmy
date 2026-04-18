import { useCallback, useEffect, useRef, useState } from 'react'

import type { DashboardBootstrapData } from '@/lib/dashboard-types'

interface UseDashboardLiveOptions {
  period: string
  enabled?: boolean
  activityLimit?: number
  linksLimit?: number
  forecastDays?: number
  onSnapshot?: (snapshot: DashboardBootstrapData) => void
}

interface UseDashboardLiveReturn {
  connected: boolean
  error: string | null
  lastEventAt: Date | null
  reconnect: () => void
}

export function useDashboardLive({
  period,
  enabled = true,
  activityLimit = 20,
  linksLimit = 50,
  forecastDays = 30,
  onSnapshot,
}: UseDashboardLiveOptions): UseDashboardLiveReturn {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null)
  const [reconnectKey, setReconnectKey] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)
  const snapshotRef = useRef(onSnapshot)

  useEffect(() => {
    snapshotRef.current = onSnapshot
  }, [onSnapshot])

  const reconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setConnected(false)
    setReconnectKey((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams({
      period,
      activityLimit: String(activityLimit),
      linksLimit: String(linksLimit),
      forecastDays: String(forecastDays),
    })

    const eventSource = new EventSource(`/api/dashboard/stream?${params.toString()}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setConnected(true)
      setError(null)
    }

    eventSource.addEventListener('snapshot', (event) => {
      try {
        const snapshot = JSON.parse((event as MessageEvent).data) as DashboardBootstrapData
        snapshotRef.current?.(snapshot)
        setLastEventAt(new Date())
        setConnected(true)
        setError(null)
      } catch {
        setError('Received invalid live dashboard payload')
      }
    })

    eventSource.addEventListener('sync-error', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { message?: string }
        setError(payload.message ?? 'Dashboard live sync failed')
      } catch {
        setError('Dashboard live sync failed')
      }
    })

    eventSource.onerror = () => {
      setConnected(false)
      setError((current) => current ?? 'Live connection interrupted. Falling back to periodic refresh.')
    }

    return () => {
      eventSource.close()
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null
      }
    }
  }, [activityLimit, enabled, forecastDays, linksLimit, period, reconnectKey])

  return {
    connected,
    error,
    lastEventAt,
    reconnect,
  }
}
