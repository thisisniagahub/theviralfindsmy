/**
 * Shopee Affiliate API — GraphQL endpoints
 *
 * GET  /api/shopee/affiliate?view=search&keyword=...    — Search products + commissions
 * GET  /api/shopee/affiliate?view=offers                — Shopee offers for affiliates
 * GET  /api/shopee/affiliate?view=summary               — Dashboard summary
 * POST /api/shopee/affiliate                            — Generate affiliate links
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAffiliateConfigured } from '@/lib/shopee/affiliate-client'
import {
  searchAffiliateProducts,
  generateAffiliateLink,
  batchGenerateAffiliateLinks,
  getShopeeOffers,
  getAffiliateDashboardSummary,
  AffiliateProductSort,
} from '@/lib/shopee/affiliate'

/** POST body schemas */
const generateLinkSchema = z.object({
  action: z.literal('generate_link'),
  url: z.string().url(),
  subIds: z.array(z.string()).max(5).default([]),
})

const batchGenerateSchema = z.object({
  action: z.literal('batch_generate'),
  urls: z.array(z.object({
    url: z.string().url(),
    subIds: z.array(z.string()).max(5).default([]),
  })).min(1).max(50),
})

const postBodySchema = z.discriminatedUnion('action', [
  generateLinkSchema,
  batchGenerateSchema,
])

export async function GET(request: Request) {
  if (!isAffiliateConfigured()) {
    return NextResponse.json(
      {
        error: 'Shopee Affiliate API not configured',
        hint: 'Set SHOPEE_AFFILIATE_APP_ID and SHOPEE_AFFILIATE_SECRET in .env',
        docs: 'https://affiliate.shopee.com.my/open_api/home',
      },
      { status: 503 },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') ?? 'search'

    switch (view) {
      case 'search': {
        const keyword = searchParams.get('keyword')
        if (!keyword) {
          return NextResponse.json(
            { error: 'keyword parameter required (use ?view=search&keyword=phone)' },
            { status: 400 },
          )
        }

        const sortType = Number(searchParams.get('sort') ?? AffiliateProductSort.RELEVANCE)
        const page = Number(searchParams.get('page') ?? 1)
        const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50)

        const result = await searchAffiliateProducts({
          keyword,
          sortType,
          page,
          limit,
        })
        return NextResponse.json(result)
      }

      case 'offers': {
        const page = Number(searchParams.get('page') ?? 1)
        const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50)

        const result = await getShopeeOffers({ page, limit })
        return NextResponse.json(result)
      }

      case 'summary': {
        const keyword = searchParams.get('keyword') ?? 'trending'
        const summary = await getAffiliateDashboardSummary(keyword)
        return NextResponse.json(summary)
      }

      default:
        return NextResponse.json(
          { error: `Unknown view: ${view}. Use: search, offers, summary` },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('[API] Shopee Affiliate GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate data' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  if (!isAffiliateConfigured()) {
    return NextResponse.json(
      {
        error: 'Shopee Affiliate API not configured',
        hint: 'Set SHOPEE_AFFILIATE_APP_ID and SHOPEE_AFFILIATE_SECRET in .env',
      },
      { status: 503 },
    )
  }

  try {
    const body = await request.json()
    const validated = postBodySchema.parse(body)

    switch (validated.action) {
      case 'generate_link': {
        const link = await generateAffiliateLink(validated.url, validated.subIds)
        if (!link) {
          return NextResponse.json(
            { error: 'Failed to generate affiliate link' },
            { status: 500 },
          )
        }
        return NextResponse.json(link, { status: 201 })
      }

      case 'batch_generate': {
        const links = await batchGenerateAffiliateLinks(validated.urls)
        return NextResponse.json({
          generated: links.length,
          requested: validated.urls.length,
          links,
        }, { status: 201 })
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 },
      )
    }
    console.error('[API] Shopee Affiliate POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process affiliate action' },
      { status: 500 },
    )
  }
}
