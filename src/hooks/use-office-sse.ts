/**
 * React hook for subscribing to office agent updates via Server-Sent Events.
 * Replaces polling with real-time push updates.
 */

import { useEffect, useRef, useState, useCallback } from 'react'

import type { AgentData } from '@/components/shopee-office/phaser-game'

interface UseOfficeSSEOptions {
  enabled?: boolean
  onReconnect?: () => void
  onError?: (error: Event) => void
}

interface UseOfficeSSEReturn {
  agents: AgentData[]
  connected: boolean
  lastEventAt: Date | null
  reconnect: () => void
}

export function useOfficeSSE({
  enabled = true,
  onReconnect,
  onError,
}: UseOfficeSSEOptions = {}): UseOfficeSSEReturn {
  const [agents, setAgents] = useState<AgentData[]>([])
  const [connected, setConnected] = useState(false)
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onReconnectRef = useRef(onReconnect)
  const onErrorRef = useRef(onError)

  // Keep refs in sync
  useEffect(() => {
    onReconnectRef.current = onReconnect
    onErrorRef.current = onError
  }, [onReconnect, onError])

  const reconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnected(false)
    // Will reconnect via useEffect
  }, [])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    let es: EventSource | null = null

    try {
      es = new EventSource('/api/shopee-office/sse')
      eventSourceRef.current = es

      es.onopen = () => {
        setConnected(true)
      }

      es.addEventListener('agents', (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.agents) {
            setAgents(data.agents)
            setLastEventAt(new Date())
          }
        } catch {
          // Parse error, skip
        }
      })

      es.addEventListener('sync-error', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as {
            message?: string
            source?: string
            details?: unknown
          }

          onErrorRef.current?.(
            new CustomEvent('sync-error', {
              detail: {
                message: payload.message ?? 'Shopee Office background sync failed',
                source: payload.source ?? 'in-process-sync',
                details: payload.details,
              },
            })
          )
        } catch {
          onErrorRef.current?.(new CustomEvent('sync-error'))
        }
      })

      es.onerror = () => {
        setConnected(false)
        onErrorRef.current?.(new Event('error'))

        // Reconnect after delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null
          onReconnectRef.current?.()
        }, 3000)
      }
    } catch {
      // Connection failed
    }

    return () => {
      if (es) {
        es.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [enabled])

  return {
    agents,
    connected,
    lastEventAt,
    reconnect,
  }
}
