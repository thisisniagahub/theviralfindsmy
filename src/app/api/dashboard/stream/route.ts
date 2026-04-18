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

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      let closed = false

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

      const snapshotInterval = setInterval(() => {
        void publishSnapshot()
      }, 20_000)

      const pingInterval = setInterval(() => {
        if (closed) {
          return
        }

        controller.enqueue(encoder.encode(':ping\n\n'))
      }, 15_000)

      return () => {
        closed = true
        clearInterval(snapshotInterval)
        clearInterval(pingInterval)
      }
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
