/**
 * Shopee AMS API — Affiliate Marketing Service endpoints
 *
 * GET  /api/shopee/ams                        — Campaign products + summary
 * GET  /api/shopee/ams?view=available         — Products not in campaigns
 * GET  /api/shopee/ams?view=optimization      — Shopee AI suggestions
 * GET  /api/shopee/ams?view=summary           — Dashboard summary
 * GET  /api/shopee/ams?view=task&id=TASK_ID   — Batch task status
 * POST /api/shopee/ams                        — Manage campaign products
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAmsConfigured } from '@/lib/shopee/ams-client'
import {
  getCampaignProducts,
  getAvailableProducts,
  getOptimizationSuggestions,
  getAmsDashboardSummary,
  getBatchTaskStatus,
  batchAddToCampaign,
  batchEditCampaignProducts,
  batchRemoveFromCampaign,
  updateAutoAddSettings,
} from '@/lib/shopee/ams'

/** POST body validation schemas */
const addToCampaignSchema = z.object({
  action: z.literal('add'),
  items: z.array(z.object({
    itemId: z.number(),
    commissionRate: z.number().min(0.1).max(50),
  })).min(1).max(100),
})

const editCampaignSchema = z.object({
  action: z.literal('edit'),
  items: z.array(z.object({
    itemId: z.number(),
    commissionRate: z.number().min(0.1).max(50),
  })).min(1).max(100),
})

const removeCampaignSchema = z.object({
  action: z.literal('remove'),
  itemIds: z.array(z.number()).min(1).max(100),
})

const autoAddSchema = z.object({
  action: z.literal('auto_add'),
  enabled: z.boolean(),
  commissionRate: z.number().min(0.1).max(50).optional(),
})

const postBodySchema = z.discriminatedUnion('action', [
  addToCampaignSchema,
  editCampaignSchema,
  removeCampaignSchema,
  autoAddSchema,
])

export async function GET(request: Request) {
  if (!isAmsConfigured()) {
    return NextResponse.json(
      {
        error: 'Shopee AMS not configured',
        hint: 'Set SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_SHOP_ID, and SHOPEE_ACCESS_TOKEN in .env',
      },
      { status: 503 },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') ?? 'campaign'
    const pageSize = Number(searchParams.get('pageSize') ?? 20)
    const cursor = searchParams.get('cursor') ?? undefined

    switch (view) {
      case 'campaign': {
        const sortBy = searchParams.get('sortBy') as 'commission_rate' | '-commission_rate' | null
        const searchType = searchParams.get('searchType') as 'ITEM_NAME' | 'ITEM_ID' | null
        const searchContent = searchParams.get('searchContent') ?? undefined

        const result = await getCampaignProducts({
          pageSize,
          cursor,
          ...(sortBy && { sortBy }),
          ...(searchType && { searchType }),
          ...(searchContent && { searchContent }),
        })
        return NextResponse.json(result)
      }

      case 'available': {
        const result = await getAvailableProducts({ pageSize, cursor })
        return NextResponse.json(result)
      }

      case 'optimization': {
        const result = await getOptimizationSuggestions({ pageSize, cursor })
        return NextResponse.json(result)
      }

      case 'summary': {
        const summary = await getAmsDashboardSummary()
        if (!summary) {
          return NextResponse.json(
            { error: 'Failed to fetch AMS summary' },
            { status: 500 },
          )
        }
        return NextResponse.json(summary)
      }

      case 'task': {
        const taskId = searchParams.get('id')
        if (!taskId) {
          return NextResponse.json(
            { error: 'Task ID required (use ?view=task&id=TASK_ID)' },
            { status: 400 },
          )
        }
        const task = await getBatchTaskStatus(taskId)
        if (!task) {
          return NextResponse.json(
            { error: 'Task not found' },
            { status: 404 },
          )
        }
        return NextResponse.json(task)
      }

      default:
        return NextResponse.json(
          { error: `Unknown view: ${view}. Use: campaign, available, optimization, summary, task` },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('[API] Shopee AMS GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AMS data' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  if (!isAmsConfigured()) {
    return NextResponse.json(
      { error: 'Shopee AMS not configured' },
      { status: 503 },
    )
  }

  try {
    const body = await request.json()
    const validated = postBodySchema.parse(body)

    switch (validated.action) {
      case 'add': {
        const result = await batchAddToCampaign(validated.items)
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        return NextResponse.json(result, { status: 201 })
      }

      case 'edit': {
        const result = await batchEditCampaignProducts(validated.items)
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        return NextResponse.json(result)
      }

      case 'remove': {
        const result = await batchRemoveFromCampaign(validated.itemIds)
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        return NextResponse.json(result)
      }

      case 'auto_add': {
        const result = await updateAutoAddSettings(
          validated.enabled,
          validated.commissionRate,
        )
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        return NextResponse.json({ success: true })
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 },
      )
    }
    console.error('[API] Shopee AMS POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process AMS action' },
      { status: 500 },
    )
  }
}
