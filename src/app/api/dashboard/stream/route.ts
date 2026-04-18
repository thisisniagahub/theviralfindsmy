import { NextRequest, NextResponse } from 'next/server'

import {
  getDashboardAuth,
  getDashboardBootstrapData,
} from '@/lib/dashboard-data'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function encodeSseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

function clampNumber(value: string | null, fallback: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.min(Math.floor(parsed), max)
}

export async function GET(request: NextRequest) {
  const auth = await getDashboardAuth()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const period = request.nextUrl.searchParams.get('period') || '30d'
  const activityLimit = clampNumber(request.nextUrl.searchParams.get('activityLimit'), 20, 100)
  const linksLimit = clampNumber(request.nextUrl.searchParams.get('linksLimit'), 50, 200)
  const forecastDays = clampNumber(request.nextUrl.searchParams.get('forecastDays'), 30, 90)
  let closed = false
  let snapshotInterval: ReturnType<typeof setInterval> | null = null
  let pingInterval: ReturnType<typeof setInterval> | null = null

  const cleanup = () => {
    if (closed) {
      return
    }

    closed = true

    if (snapshotInterval) {
      clearInterval(snapshotInterval)
      snapshotInterval = null
    }

    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
  }

  const stream = new ReadableStream({
    cancel() {
      cleanup()
    },
    start(controller) {
      const encoder = new TextEncoder()

      const send = (event: string, data: unknown) => {
        if (closed) {
          return
        }

        controller.enqueue(encoder.encode(encodeSseEvent(event, data)))
      }

      const publishSnapshot = async () => {
        try {
          const snapshot = await getDashboardBootstrapData({
            period,
            activityLimit,
            linksLimit,
            forecastDays,
            auth,
          })

          send('snapshot', snapshot)
        } catch (error) {
          send('sync-error', {
            message: error instanceof Error ? error.message : 'Dashboard live sync failed',
          })
        }
      }

      void publishSnapshot()

      snapshotInterval = setInterval(() => {
        void publishSnapshot()
      }, 20_000)

      pingInterval = setInterval(() => {
        if (closed) {
          return
        }

        controller.enqueue(encoder.encode(':ping\n\n'))
      }, 15_000)

      request.signal.addEventListener('abort', cleanup, { once: true })
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
