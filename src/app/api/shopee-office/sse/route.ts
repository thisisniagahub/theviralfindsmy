/**
 * Server-Sent Events stream for real-time office agent updates.
 * Replaces polling with push-based real-time sync.
 *
 * GET /api/shopee-office/sse
 */

import { getAllAgents } from '@/lib/shopee-office-store'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

type OfficeAgentsSnapshot = ReturnType<typeof getAllAgents>

// Track active subscribers
let subscribers: Array<{
  id: string
  send: (event: string, data: unknown) => void
  close: () => void
}> = []

function encodeSseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

// Broadcast updated agent state to all subscribers
export function broadcastOfficeUpdate(agents: OfficeAgentsSnapshot) {
  const payload = { type: 'agents', agents }

  // Remove closed subscribers
  subscribers = subscribers.filter((sub) => {
    try {
      sub.send('agents', payload)
      return true
    } catch {
      sub.close()
      return false
    }
  })
}

function broadcastOfficeSyncError(message: string, details?: unknown) {
  const payload = {
    type: 'sync-error',
    message,
    details,
    source: 'in-process-sync',
  }

  subscribers = subscribers.filter((sub) => {
    try {
      sub.send('sync-error', payload)
      return true
    } catch {
      sub.close()
      return false
    }
  })
}

// Background sync: read the in-process store and broadcast periodically
let syncInterval: ReturnType<typeof setInterval> | null = null

function startSync() {
  if (syncInterval) return
  syncInterval = setInterval(async () => {
    if (subscribers.length === 0) return

    try {
      broadcastOfficeUpdate(getAllAgents())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Background sync failed'
      broadcastOfficeSyncError(message, { source: 'in-process-store' })
    }
  }, 3000)
}

function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

export async function GET() {
  let pingInterval: ReturnType<typeof setInterval> | null = null
  let subscriberId: string | null = null

  const cleanup = () => {
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }

    if (subscriberId) {
      subscribers = subscribers.filter((s) => s.id !== subscriberId)
      subscriberId = null
    }

    if (subscribers.length === 0) {
      stopSync()
    }
  }

  const stream = new ReadableStream({
    cancel() {
      cleanup()
    },
    start(controller) {
      const currentSubscriberId = `sub-${Date.now()}-${randomUUID().slice(0, 8)}`
      subscriberId = currentSubscriberId

      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(new TextEncoder().encode(encodeSseEvent(event, data)))
        } catch {
          // Stream closed, subscriber will be removed
        }
      }

      const close = () => {
        try {
          controller.close()
        } catch {
          // Already closed
        }
      }

      // Send initial state immediately
      const initialAgents = getAllAgents()
      send('agents', { type: 'agents', agents: initialAgents })

      // Add subscriber and start sync if needed
      subscribers.push({ id: currentSubscriberId, send, close })
      startSync()

      // Keep-alive ping every 15s
      pingInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(':ping\n\n'))
        } catch {
          cleanup()
        }
      }, 15000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
