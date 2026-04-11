/**
 * Client-side event bus for real-time updates via Socket.IO.
 * Connects to the notification service and dispatches typed events to React components.
 */

type EventType =
  | 'agent:state-change'
  | 'pipeline:step-complete'
  | 'pipeline:complete'
  | 'link:click'
  | 'conversion:new'
  | 'goal:achieved'
  | 'notification:new'
  | 'system:health-change'

interface AppEvent {
  type: EventType
  payload: Record<string, unknown>
  timestamp: string
}

type EventHandler = (event: AppEvent) => void

class EventBus {
  private handlers = new Map<EventType, Set<EventHandler>>()
  private globalHandlers = new Set<EventHandler>()

  on(type: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
    return () => this.handlers.get(type)?.delete(handler)
  }

  onAny(handler: EventHandler): () => void {
    this.globalHandlers.add(handler)
    return () => this.globalHandlers.delete(handler)
  }

  emit(event: AppEvent): void {
    this.handlers.get(event.type)?.forEach(h => h(event))
    this.globalHandlers.forEach(h => h(event))
  }

  clear(): void {
    this.handlers.clear()
    this.globalHandlers.clear()
  }
}

export const eventBus = new EventBus()
export type { EventType, AppEvent, EventHandler }
