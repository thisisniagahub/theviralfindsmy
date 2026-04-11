'use client'

import { useEffect, useCallback, useState } from 'react'
import { eventBus, type EventType, type AppEvent } from '@/lib/event-bus'

export function useEventBus(type: EventType, handler: (event: AppEvent) => void) {
  useEffect(() => {
    return eventBus.on(type, handler)
  }, [type, handler])
}

export function useEventLog(maxEvents = 50) {
  const [events, setEvents] = useState<AppEvent[]>([])

  useEffect(() => {
    return eventBus.onAny((event) => {
      setEvents(prev => [event, ...prev].slice(0, maxEvents))
    })
  }, [maxEvents])

  const clear = useCallback(() => setEvents([]), [])
  return { events, clear }
}
