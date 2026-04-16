import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { requireAuth } from '@/lib/api-auth'
import {
  addCronJob,
  listCronJobs,
  removeCronJob,
} from '@/lib/openclaw'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  try {
    const jobs = await listCronJobs()
    return NextResponse.json(jobs)
  } catch (error) {
    console.error('OpenClaw cron GET error:', error)
    return NextResponse.json({ error: 'Failed to list cron jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // 1. Check auth
  const { auth, error } = await requireAuth()
  if (error) return error

  // 2. Check rate limit
  const rateLimited = await withRateLimit(request, RATE_LIMITS.ai)
  if (rateLimited) return rateLimited

  try {
    const body = await request.json()

    if (typeof body.name !== 'string' || typeof body.schedule !== 'string' || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'name, schedule, and message are required' }, { status: 400 })
    }

    const result = await addCronJob({
      name: body.name,
      schedule: body.schedule,
      message: body.message,
      session: body.session === 'isolated' ? 'isolated' : 'main',
      tz: typeof body.tz === 'string' ? body.tz : undefined,
      announce: typeof body.announce === 'boolean' ? body.announce : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('OpenClaw cron POST error:', error)
    return NextResponse.json({ error: 'Failed to add cron job' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  // 1. Check auth
  const { auth, error } = await requireAuth()
  if (error) return error

  // 2. Check rate limit
  const rateLimited = await withRateLimit(request, RATE_LIMITS.mutation)
  if (rateLimited) return rateLimited

  try {
    // HTTP DELETE should not have a request body — use query parameter instead
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 })
    }

    const result = await removeCronJob(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('OpenClaw cron DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove cron job' }, { status: 500 })
  }
}
