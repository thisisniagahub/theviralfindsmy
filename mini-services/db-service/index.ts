/**
 * Database Microservice (port 3005)
 *
 * Bypasses Next.js 16 + Turbopack compilation issue where Prisma hangs.
 * Uses the parent project's generated Prisma client.
 */

// Import from parent project's generated Prisma client directly
import { PrismaClient } from '../../node_modules/.prisma/client/index.js'
import {
  createLinkBody,
  updateLinkBody,
  createCampaignBody,
  createPayoutBody,
  createGoalBody,
  updateGoalBody,
  updateGoalProgressBody,
  analyticsQuerySchema,
  updateSettingsBody,
  validateBody,
} from './validations.js'

const db = new PrismaClient({
  log: ['warn', 'error'],
})

const PORT = 3005
const DB_SERVICE_SECRET = process.env.DB_SERVICE_SECRET
if (!DB_SERVICE_SECRET) {
  console.error('DB_SERVICE_SECRET is required for security')
  console.error('Generate one with: openssl rand -base64 32')
  console.error('Add to .env: DB_SERVICE_SECRET=your-generated-secret')
  throw new Error('DB_SERVICE_SECRET is required for database service authentication')
}

async function getBody(req: Request): Promise<Record<string, unknown>> {
  try { return await req.json() } catch { return {} }
}

function validateRequestBody<T>(schema: any, body: unknown): T {
  try {
    return validateBody(schema, body)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw error
  }
}

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
])

function json(data: unknown, status = 200, req?: Request): Response {
  let origin = 'http://localhost:3000'
  if (req) {
    const reqOrigin = req.headers.get('origin') || ''
    if (ALLOWED_ORIGINS.has(reqOrigin)) origin = reqOrigin
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

function checkAuth(req: Request): Response | null {
  // Health endpoint is public
  const url = new URL(req.url)
  if (url.pathname === '/health') return null

  // Always enforce auth
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  if (token !== DB_SERVICE_SECRET) {
    return json({ error: 'Unauthorized: Invalid or missing DB_SERVICE_SECRET' }, 401, req)
  }
  return null
}

/**
 * Extract the authenticated userId from the request.
 * In production, this would come from a JWT or session token.
 * For now, we use the DB_SERVICE_SECRET as a shared secret and
 * accept userId from a custom header set by the Next.js frontend.
 */
function getAuthenticatedUserId(req: Request): string | null {
  return req.headers.get('x-user-id')
}

/**
 * Strip userId from request body to prevent mass assignment.
 * userId is derived from authentication context, not from request body.
 */
function stripUserIdFromBody(body: Record<string, unknown>): Record<string, unknown> {
  const { userId: _, ...cleanBody } = body
  return cleanBody
}

function toDateOrUndefined(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  return new Date(String(value))
}

function getAnalyticsStartDate(period: string, now = new Date()): Date {
  const startDate = new Date(now)
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7)
      break
    case '90d':
      startDate.setDate(startDate.getDate() - 90)
      break
    case 'month':
      startDate.setDate(1)
      break
    case 'all':
      return new Date(2020, 0, 1)
    default:
      startDate.setDate(startDate.getDate() - 30)
      break
  }
  return startDate
}

function normalizeSource(referer: string | null): string {
  if (!referer) return 'Direct'
  try {
    const url = new URL(referer)
    return url.hostname.replace(/^www\./, '') || 'Direct'
  } catch {
    const trimmed = referer.trim()
    return trimmed.length > 40 ? trimmed.slice(0, 40) : trimmed
  }
}

async function buildAnalyticsResponse(userId: string, period: string) {
  const now = new Date()
  const startDate = getAnalyticsStartDate(period, now)
  const chartDays = Math.min(
    period === 'all' ? 90 : period === '90d' ? 90 : period === 'month' ? now.getDate() : 30,
    90
  )

  const [topLinks, links, recentClicks, recentConversions] = await Promise.all([
    db.affiliateLink.findMany({
      where: { userId },
      orderBy: { earnings: 'desc' },
      take: 5,
      include: { campaign: { select: { name: true } } },
    }),
    db.affiliateLink.findMany({
      where: { userId },
      select: { category: true, clicks: true, conversions: true, earnings: true },
    }),
    db.clickRecord.findMany({
      where: { createdAt: { gte: startDate }, affiliateLink: { userId } },
      select: { createdAt: true, referer: true, device: true, country: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.conversion.findMany({
      where: { createdAt: { gte: startDate }, affiliateLink: { userId } },
      select: { createdAt: true, commission: true, amount: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const dailyClicks: Record<string, number> = {}
  const dailyConversions: Record<string, number> = {}
  const dailyEarnings: Record<string, number> = {}
  for (let i = chartDays - 1; i >= 0; i--) {
    const day = new Date(now)
    day.setDate(day.getDate() - i)
    const key = day.toISOString().split('T')[0]
    dailyClicks[key] = 0
    dailyConversions[key] = 0
    dailyEarnings[key] = 0
  }

  for (const click of recentClicks) {
    const key = click.createdAt.toISOString().split('T')[0]
    if (dailyClicks[key] !== undefined) dailyClicks[key] += 1
  }

  for (const conversion of recentConversions) {
    const key = conversion.createdAt.toISOString().split('T')[0]
    if (dailyConversions[key] !== undefined) dailyConversions[key] += 1
    if (dailyEarnings[key] !== undefined) dailyEarnings[key] += Number(conversion.commission)
  }

  const performanceData = Object.keys(dailyClicks).map((date) => ({
    date,
    clicks: dailyClicks[date] || 0,
    conversions: dailyConversions[date] || 0,
    earnings: Math.round((dailyEarnings[date] || 0) * 100) / 100,
  }))

  const sourceMap: Record<string, number> = {}
  const deviceMap: Record<string, number> = {}
  const heatmap: { day: number; hour: number; clicks: number }[] = []
  const sourceClicks = await db.clickRecord.findMany({
    where: { createdAt: { gte: startDate }, affiliateLink: { userId } },
    select: { referer: true, device: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  for (const click of sourceClicks) {
    const source = normalizeSource(click.referer)
    sourceMap[source] = (sourceMap[source] || 0) + 1
    const device = (click.device || 'Unknown').trim() || 'Unknown'
    deviceMap[device] = (deviceMap[device] || 0) + 1
  }

  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 6)
  const weekClicks = await db.clickRecord.findMany({
    where: { createdAt: { gte: weekStart }, affiliateLink: { userId } },
    select: { createdAt: true },
  })
  const heatmapCounts: Record<string, number> = {}
  for (const click of weekClicks) {
    const day = (click.createdAt.getDay() + 6) % 7
    const hour = click.createdAt.getHours()
    const key = `${day}:${hour}`
    heatmapCounts[key] = (heatmapCounts[key] || 0) + 1
  }
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}:${hour}`
      heatmap.push({ day, hour, clicks: heatmapCounts[key] || 0 })
    }
  }

  const categoryMap: Record<string, { clicks: number; conversions: number; earnings: number }> = {}
  for (const link of links) {
    const category = link.category || 'Uncategorized'
    if (!categoryMap[category]) {
      categoryMap[category] = { clicks: 0, conversions: 0, earnings: 0 }
    }
    categoryMap[category].clicks += Number(link.clicks || 0)
    categoryMap[category].conversions += Number(link.conversions || 0)
    categoryMap[category].earnings += Number(link.earnings || 0)
  }

  const totalClicks = recentClicks.length
  const totalConversions = recentConversions.length
  const sourceData = Object.entries(sourceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
  const deviceData = Object.entries(deviceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
  const categoryData = Object.entries(categoryMap)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5)
  const topProducts = topLinks.map((link) => ({
    id: link.id,
    name: link.name,
    productName: link.productName,
    category: link.category,
    clicks: Number(link.clicks || 0),
    conversions: Number(link.conversions || 0),
    earnings: Number(link.earnings || 0),
    campaign: link.campaign,
  }))
  const funnelData = [
    { stage: 'Page Views', count: totalClicks, color: '#EE4D2D' },
    { stage: 'Add to Cart', count: Math.floor(totalClicks * 0.35), color: '#FF6742' },
    { stage: 'Purchase', count: Math.floor(totalClicks * 0.12), color: '#FFB347' },
    { stage: 'Completed', count: totalConversions, color: '#22C55E' },
  ]

  return {
    performanceData,
    topProducts,
    sourceData,
    deviceData,
    categoryData,
    funnelData,
    heatmap,
  }
}

/**
 * Verify that a resource belongs to the given userId.
 * Returns true if the resource exists and matches, false otherwise.
 */
async function verifyOwnership(table: string, id: string, userId: string): Promise<boolean> {
  const model = (db as any)[table]
  if (!model) return false
  const record = await model.findUnique({ where: { id } })
  return record?.userId === userId
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  if (method === 'OPTIONS') {
    const reqOrigin = req.headers.get('origin') || ''
    const origin = ALLOWED_ORIGINS.has(reqOrigin) ? reqOrigin : 'http://localhost:3000'
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // Auth check (skips /health)
  const authError = checkAuth(req)
  if (authError) return authError

  try {
    if (path === '/health') {
      const count = await db.affiliateLink.count()
      return json({ status: 'healthy', links: count, timestamp: new Date().toISOString() })
  }

  // ─── Analytics ──────────────────────────────────────
  if (path === '/analytics' && method === 'GET') {
    const userId = getAuthenticatedUserId(req)
    if (!userId) return json({ error: 'userId required (x-user-id header)' }, 400, req)
    const query = validateRequestBody<typeof analyticsQuerySchema>(analyticsQuerySchema, {
      period: url.searchParams.get('period') || undefined,
    })
    return json(await buildAnalyticsResponse(userId, query.period))
  }

    // ─── User Endpoints ──────────────────────────────────
    if (path === '/users/upsert' && method === 'POST') {
      const rawBody = await getBody(req)
      const { email, name, image } = rawBody as { email: string; name?: string; image?: string }
      if (!email) return json({ error: 'Email is required' }, 400, req)
      const adminEmail = process.env.ADMIN_EMAIL
      const isAdmin = adminEmail ? email === adminEmail : false
      const user = await db.user.upsert({
        where: { email },
        update: {
          name: name ?? undefined,
          image: image ?? undefined,
        },
        create: {
          email,
          name: name ?? null,
          image: image ?? null,
          role: isAdmin ? 'ADMIN' : 'USER',
        },
      })
      return json(user, 200, req)
    }

    if (path === '/users/me' && method === 'GET') {
      const userId = url.searchParams.get('userId')
      if (!userId) return json({ error: 'userId query parameter is required' }, 400, req)
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) return json({ error: 'User not found' }, 404, req)
      return json(user, 200, req)
    }

    // ─── Dashboard Stats ───────────────────────────────
    if (path === '/dashboard/stats' && method === 'GET') {
      const period = url.searchParams.get('period') || '30d'
      const userId = url.searchParams.get('userId')
      const now = new Date()
      let startDate: Date
      let days: number
      switch (period) {
        case '7d': days = 7; startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); break
        case '90d': days = 90; startDate = new Date(now); startDate.setDate(startDate.getDate() - 90); break
        case 'month': days = now.getDate(); startDate = new Date(now.getFullYear(), now.getMonth(), 1); break
        case 'all': days = 365; startDate = new Date(2020, 0, 1); break
        default: days = 30; startDate = new Date(now); startDate.setDate(startDate.getDate() - 30); break
      }
      const chartDays = Math.min(days, 90)
      const userWhere = userId ? { userId } : {}
      const [totalLinks, clicksAgg, convAgg, earnAgg, activeLinks, pausedLinks] = await Promise.all([
        db.affiliateLink.count({ where: userWhere }),
        db.affiliateLink.aggregate({ _sum: { clicks: true }, where: userWhere }),
        db.affiliateLink.aggregate({ _sum: { conversions: true }, where: userWhere }),
        db.affiliateLink.aggregate({ _sum: { earnings: true }, where: userWhere }),
        db.affiliateLink.count({ where: { ...userWhere, status: 'active' } }),
        db.affiliateLink.count({ where: { ...userWhere, status: 'paused' } }),
      ])
      const totalClicks = clicksAgg._sum.clicks || 0
      const totalConversions = convAgg._sum.conversions || 0
      const totalEarnings = earnAgg._sum.earnings || 0
      const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100) : 0
      const recentConversions = await db.conversion.findMany({
        where: userId
          ? { createdAt: { gte: startDate }, affiliateLink: { userId } }
          : { createdAt: { gte: startDate } },
        select: { createdAt: true, commission: true, amount: true },
        orderBy: { createdAt: 'asc' }
      })
      const dailyEarnings: Record<string, number> = {}
      const dailyClicks: Record<string, number> = {}
      for (let i = chartDays - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const key = d.toISOString().split('T')[0]; dailyEarnings[key] = 0; dailyClicks[key] = 0 }
      for (const c of recentConversions) { const key = c.createdAt.toISOString().split('T')[0]; if (dailyEarnings[key] !== undefined) dailyEarnings[key] += c.commission }

      // Fetch real click data instead of Math.random()
      const allClicks = await db.clickRecord.findMany({
        where: userId
          ? { createdAt: { gte: startDate }, affiliateLink: { userId } }
          : { createdAt: { gte: startDate } },
        select: { linkId: true, createdAt: true }
      })
      const clicksByDate: Record<string, number> = {}
      for (const click of allClicks) {
        const key = click.createdAt.toISOString().split('T')[0]
        clicksByDate[key] = (clicksByDate[key] || 0) + 1
      }
      for (const key of Object.keys(dailyClicks)) {
        dailyClicks[key] = clicksByDate[key] || 0
      }
      const earningsData = Object.entries(dailyEarnings).map(([date, earnings]) => ({ date, earnings: Math.round(earnings * 100) / 100, clicks: dailyClicks[date] }))
      const topLinks = await db.affiliateLink.findMany({ where: userWhere, orderBy: { earnings: 'desc' }, take: 5, include: { campaign: { select: { name: true } } } })
      const recentConv = await db.conversion.findMany({
        where: userId
          ? (period !== 'all' ? { createdAt: { gte: startDate }, affiliateLink: { userId } } : { affiliateLink: { userId } })
          : (period !== 'all' ? { createdAt: { gte: startDate } } : undefined),
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { affiliateLink: { select: { name: true, productName: true, shortCode: true } } }
      })
      const clickRecords = await db.clickRecord.findMany({
        where: userId
          ? (period !== 'all' ? { createdAt: { gte: startDate }, affiliateLink: { userId } } : { affiliateLink: { userId } })
          : (period !== 'all' ? { createdAt: { gte: startDate } } : undefined),
        select: { country: true }
      })
      const countryMap: Record<string, number> = {}
      for (const r of clickRecords) { const country = r.country || 'Unknown'; countryMap[country] = (countryMap[country] || 0) + 1 }
      const countryData = Object.entries(countryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
      const epc = totalClicks > 0 ? totalEarnings / totalClicks : 0
      const scoreBreakdown = [
        { label: 'Conversion Rate', earned: conversionRate > 5 ? 20 : conversionRate > 3 ? 10 : 0, max: 20 },
        { label: 'Total Clicks', earned: totalClicks > 5000 ? 20 : totalClicks > 2000 ? 10 : 0, max: 20 },
        { label: 'Total Earnings', earned: totalEarnings > 1000 ? 20 : totalEarnings > 500 ? 10 : 0, max: 20 },
        { label: 'Active Links', earned: activeLinks > 10 ? 15 : activeLinks > 5 ? 8 : 0, max: 15 },
        { label: 'Earnings/Click', earned: epc > 2 ? 15 : epc > 1 ? 8 : 0, max: 15 },
        { label: 'Paused Links', earned: Math.max(0, 10 + (pausedLinks > 3 ? -10 : pausedLinks > 0 ? -5 : 0)), max: 10 },
      ]
      const performanceScore = Math.max(0, Math.min(100, scoreBreakdown.reduce((s, b) => s + b.earned, 0)))
      let performanceGrade = 'F'
      if (performanceScore >= 90) performanceGrade = 'A'; else if (performanceScore >= 80) performanceGrade = 'B'; else if (performanceScore >= 70) performanceGrade = 'C'; else if (performanceScore >= 60) performanceGrade = 'D'
      return json({ totalLinks, totalClicks, totalConversions, totalEarnings: Math.round(totalEarnings * 100) / 100, conversionRate: parseFloat(conversionRate.toFixed(1)), earningsData, topLinks, recentConversions: recentConv, countryData, period, performanceScore, performanceGrade, scoreBreakdown })
    }

    // ─── Links ─────────────────────────────────────────
    if (path === '/links' && method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '10')
      const status = url.searchParams.get('status')
      const campaignId = url.searchParams.get('campaignId')
      const search = url.searchParams.get('search')
      const userId = url.searchParams.get('userId')
      const where: Record<string, unknown> = {}
      if (userId) where.userId = userId
      if (status && status !== 'all') where.status = status
      if (campaignId && campaignId !== 'all') where.campaignId = campaignId
      if (search) where.OR = [{ name: { contains: search } }, { productName: { contains: search } }, { shortCode: { contains: search } }]
      const [links, total] = await Promise.all([db.affiliateLink.findMany({ where, include: { campaign: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), db.affiliateLink.count({ where })])
      const campaigns = await db.campaign.findMany({ select: { id: true, name: true } })
      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Fetch real click data for all links instead of seeded random
      const linkIds = links.map((l) => l.id)
      const recentClicks = await db.clickRecord.findMany({
        where: { linkId: { in: linkIds }, createdAt: { gte: sevenDaysAgo } },
        select: { linkId: true, createdAt: true }
      })

      // Group clicks by linkId and date
      const clicksByLink: Record<string, Record<string, number>> = {}
      for (const click of recentClicks) {
        if (!clicksByLink[click.linkId]) clicksByLink[click.linkId] = {}
        const date = click.createdAt.toISOString().split('T')[0]
        clicksByLink[click.linkId][date] = (clicksByLink[click.linkId][date] || 0) + 1
      }

      const linksWithExpiry = links.map((link) => {
        const dailyClicks = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now)
          d.setDate(d.getDate() - (6 - i))
          const key = d.toISOString().split('T')[0]
          return clicksByLink[link.id]?.[key] || 0
        })
        let expiresIn: number | null = null; let isExpired = false; let expiryStatus: string = 'none'
        if (link.expiresAt) { const diffMs = new Date(link.expiresAt).getTime() - now.getTime(); const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); expiresIn = diffDays; isExpired = diffMs < 0; expiryStatus = isExpired ? 'expired' : diffDays <= 7 ? 'expiring_soon' : 'active' }
        return { ...link, dailyClicks, expiresIn, isExpired, expiryStatus }
      })
      return json({ links: linksWithExpiry, campaigns, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
    }
    if (path === '/links' && method === 'POST') {
      const rawBody = await getBody(req)
      const authenticatedUserId = getAuthenticatedUserId(req)
      if (!authenticatedUserId) return json({ error: 'userId required (x-user-id header)' }, 400, req)
      const cleanBody = stripUserIdFromBody(rawBody)
      const body = validateRequestBody<typeof createLinkBody>(createLinkBody, cleanBody)
      const link = await db.affiliateLink.create({
        data: {
          userId: authenticatedUserId,
          name: body.name,
          productUrl: body.productUrl,
          affiliateUrl: body.affiliateUrl,
          productId: body.productId ?? null,
          productName: body.productName ?? null,
          productImage: body.productImage ?? null,
          productPrice: body.productPrice ?? null,
          commission: body.commission ?? null,
          category: body.category ?? null,
          campaignId: body.campaignId ?? null,
          shortCode: body.shortCode || `link-${Date.now().toString(36)}`,
          status: body.status,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
        }
      })
      return json(link, 201)
    }

    // ─── Single Link ───────────────────────────────────
    const linkMatch = path.match(/^\/links\/([^/]+)$/)
    if (linkMatch) {
      const id = linkMatch[1]
      if (method === 'GET') {
        const linkUserId = url.searchParams.get('userId')
        const link = await db.affiliateLink.findUnique({ where: { id }, include: { campaign: true, _count: { select: { clickRecords: true, conversionRecords: true } } } })
        if (!link) return json({ error: 'Link not found' }, 404)
        if (linkUserId && link.userId !== linkUserId) return json({ error: 'Forbidden' }, 403)
        return json(link)
      }
      if (method === 'PUT') {
        const authenticatedUserId = getAuthenticatedUserId(req)
        if (!authenticatedUserId) return json({ error: 'userId required (x-user-id header)' }, 400, req)
        // Verify ownership
        const existing = await db.affiliateLink.findUnique({ where: { id } })
        if (!existing) return json({ error: 'Link not found' }, 404)
        if (existing.userId !== authenticatedUserId) return json({ error: 'Forbidden' }, 403)
        const rawBody = await getBody(req)
        const cleanBody = stripUserIdFromBody(rawBody)
        const body = validateRequestBody<typeof updateLinkBody>(updateLinkBody, cleanBody)
        const link = await db.affiliateLink.update({ where: { id }, data: body })
        return json(link)
      }
      if (method === 'DELETE') {
        const deleteUserId = getAuthenticatedUserId(req)
        if (deleteUserId) {
          const existing = await db.affiliateLink.findUnique({ where: { id } })
          if (!existing) return json({ error: 'Link not found' }, 404)
          if (existing.userId !== deleteUserId) return json({ error: 'Forbidden' }, 403)
        }
        await db.affiliateLink.delete({ where: { id } })
        return json({ success: true })
      }
    }

    // ─── Link Stats ────────────────────────────────────
    const linkStatsMatch = path.match(/^\/links\/([^/]+)\/stats$/)
    if (linkStatsMatch && method === 'GET') {
      const id = linkStatsMatch[1]
      const linkUserId = url.searchParams.get('userId')
      const link = await db.affiliateLink.findUnique({ where: { id } })
      if (!link) return json({ error: 'Link not found' }, 404)
      if (linkUserId && link.userId !== linkUserId) return json({ error: 'Forbidden' }, 403)
      const clicks = await db.clickRecord.findMany({ where: { linkId: id }, orderBy: { createdAt: 'desc' }, take: 100 })
      return json({ link, clicks, totalClicks: link.clicks, totalConversions: link.conversions, totalEarnings: link.earnings })
    }

    // ─── Notifications ─────────────────────────────────
    if (path === '/notifications' && method === 'GET') {
      const filter = url.searchParams.get('filter') || 'all'
      const userId = url.searchParams.get('userId')
      const where: Record<string, unknown> = {}
      if (userId) where.userId = userId
      if (filter === 'unread') where.read = false; else if (filter === 'conversions') where.type = 'conversion'; else if (filter === 'payouts') where.type = 'payout'
      const [notifications, unreadCount] = await Promise.all([db.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 }), db.notification.count({ where: { ...where, read: false } })])
      const formatted = notifications.map((n) => ({ id: n.id, type: n.type, title: n.title, description: n.description, read: n.read, timestamp: n.createdAt.toISOString() }))
      return json({ notifications: formatted, unreadCount })
    }
    if (path === '/notifications' && method === 'PUT') {
      const authenticatedUserId = getAuthenticatedUserId(req)
      if (authenticatedUserId) {
        await db.notification.updateMany({ where: { userId: authenticatedUserId, read: false }, data: { read: true } })
      } else {
        await db.notification.updateMany({ where: { read: false }, data: { read: true } })
      }
      return json({ success: true, message: 'All notifications marked as read' })
    }

    // ─── Campaigns ─────────────────────────────────────
    if (path === '/campaigns' && method === 'GET') {
      const userId = url.searchParams.get('userId')
      const where = userId ? { userId } : {}
      const campaigns = await db.campaign.findMany({ where, include: { links: { select: { id: true, clicks: true, conversions: true, earnings: true, status: true } } }, orderBy: { createdAt: 'desc' } })
      const campaignsWithStats = campaigns.map((c) => ({ ...c, linkCount: c.links.length, totalClicks: c.links.reduce((s, l) => s + l.clicks, 0), totalConversions: c.links.reduce((s, l) => s + l.conversions, 0), totalEarnings: c.links.reduce((s, l) => s + l.earnings, 0) }))
      return json({ campaigns: campaignsWithStats })
    }
    if (path === '/campaigns' && method === 'POST') {
      const rawBody = await getBody(req)
      const authenticatedUserId = getAuthenticatedUserId(req)
      if (!authenticatedUserId) return json({ error: 'userId required (x-user-id header)' }, 400, req)
      const cleanBody = stripUserIdFromBody(rawBody)
      const body = validateRequestBody<typeof createCampaignBody>(createCampaignBody, cleanBody)
      const campaign = await db.campaign.create({
        data: {
          userId: authenticatedUserId,
          name: body.name,
          description: body.description ?? null,
          budget: body.budget ?? null,
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          status: body.status
        }
      })
      return json(campaign, 201)
    }

    // ─── Conversions ───────────────────────────────────
    if (path === '/conversions' && method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1'); const limit = parseInt(url.searchParams.get('limit') || '25')
      const userId = url.searchParams.get('userId')
      const where = userId ? { affiliateLink: { userId } } : {}
      const [conversions, total] = await Promise.all([
        db.conversion.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { affiliateLink: { select: { name: true, productName: true, shortCode: true } } } }),
        db.conversion.count({ where })
      ])
      return json({ conversions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
    }

    // ─── Payouts ───────────────────────────────────────
    if (path === '/payouts' && method === 'GET') {
      const userId = url.searchParams.get('userId')
      const where = userId ? { userId } : {}
      const payouts = await db.payout.findMany({ where, orderBy: { requestedAt: 'desc' } })
      const totalPaid = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)
      const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
      return json({ payouts, summary: { totalPaid, totalPending, totalPayouts: payouts.length } })
    }
    if (path === '/payouts' && method === 'POST') {
      const rawBody = await getBody(req)
      const authenticatedUserId = getAuthenticatedUserId(req)
      if (!authenticatedUserId) return json({ error: 'userId required (x-user-id header)' }, 400, req)
      const cleanBody = stripUserIdFromBody(rawBody)
      const body = validateRequestBody<typeof createPayoutBody>(createPayoutBody, cleanBody)
      const payout = await db.payout.create({
        data: {
          userId: authenticatedUserId,
          amount: body.amount,
          method: body.method,
          bankName: body.bankName ?? null,
          accountNo: body.accountNo ?? null,
          accountName: body.accountName ?? null,
          note: body.note ?? null
        }
      })
      return json(payout, 201)
    }

    // ─── Goals ─────────────────────────────────────────
    const goalMatch = path.match(/^\/goals\/([^/]+)$/)
    if (goalMatch) {
      const id = goalMatch[1]
      const goal = await db.earningGoal.findUnique({ where: { id } })
      if (!goal) return json({ error: 'Goal not found' }, 404, req)

      const userId = getAuthenticatedUserId(req)
      if (!userId) return json({ error: 'userId required (x-user-id header)' }, 400, req)
      if (goal.userId !== userId) return json({ error: 'Forbidden' }, 403, req)

      if (method === 'GET') {
        return json(goal)
      }

      if (method === 'PUT') {
        const rawBody = await getBody(req)
        const cleanBody = stripUserIdFromBody(rawBody)
        const body = validateRequestBody<typeof updateGoalBody>(updateGoalBody, cleanBody)
        const data: Record<string, unknown> = {}
        if (body.name !== undefined) data.name = body.name
        if (body.targetAmount !== undefined) data.targetAmount = body.targetAmount
        if (body.period !== undefined) data.period = body.period
        if (body.startDate !== undefined) data.startDate = toDateOrUndefined(body.startDate)
        if (body.endDate !== undefined) data.endDate = toDateOrUndefined(body.endDate)
        if (body.status !== undefined) data.status = body.status
        const updated = await db.earningGoal.update({ where: { id }, data })
        return json(updated)
      }

      if (method === 'DELETE') {
        await db.earningGoal.delete({ where: { id } })
        return json({ success: true })
      }
    }

    const goalProgressMatch = path.match(/^\/goals\/([^/]+)\/update-progress$/)
    if (goalProgressMatch && method === 'PUT') {
      const id = goalProgressMatch[1]
      const goal = await db.earningGoal.findUnique({ where: { id } })
      if (!goal) return json({ error: 'Goal not found' }, 404, req)

      const userId = getAuthenticatedUserId(req)
      if (!userId) return json({ error: 'userId required (x-user-id header)' }, 400, req)
      if (goal.userId !== userId) return json({ error: 'Forbidden' }, 403, req)

      const rawBody = await getBody(req)
      const body = validateRequestBody<typeof updateGoalProgressBody>(updateGoalProgressBody, rawBody)
      const updatedAmount = Number(goal.currentAmount) + body.amount
      const status = goal.status === 'cancelled'
        ? 'cancelled'
        : updatedAmount >= Number(goal.targetAmount)
          ? 'completed'
          : 'active'
      const updated = await db.earningGoal.update({
        where: { id },
        data: {
          currentAmount: updatedAmount,
          status,
        },
      })
      return json(updated)
    }

    if (path === '/goals' && method === 'GET') {
      const userId = url.searchParams.get('userId')
      const where = userId ? { userId } : {}
      const goals = await db.earningGoal.findMany({ where, orderBy: { createdAt: 'desc' } })
      const summary = { total: goals.length, active: goals.filter(g => g.status === 'active').length, achieved: goals.filter(g => g.status === 'achieved').length, totalTarget: goals.reduce((s, g) => s + g.targetAmount, 0), totalCurrent: goals.reduce((s, g) => s + g.currentAmount, 0) }
      return json({ goals, summary })
    }
    if (path === '/goals' && method === 'POST') {
      const rawBody = await getBody(req)
      const authenticatedUserId = getAuthenticatedUserId(req)
      if (!authenticatedUserId) return json({ error: 'userId required (x-user-id header)' }, 400, req)
      const cleanBody = stripUserIdFromBody(rawBody)
      const body = validateRequestBody<typeof createGoalBody>(createGoalBody, cleanBody)
      const goal = await db.earningGoal.create({
        data: {
          userId: authenticatedUserId,
          name: body.name,
          targetAmount: body.targetAmount,
          period: body.period,
          endDate: body.endDate ? new Date(body.endDate) : null
        }
      })
      return json(goal, 201)
    }

    // ─── Settings ──────────────────────────────────────
    if (path === '/settings' && method === 'GET') {
      const userId = getAuthenticatedUserId(req) || url.searchParams.get('userId')
      if (!userId) return json({ error: 'userId required (x-user-id header)' }, 400, req)
      const where = userId ? { userId } : {}
      const settings = await db.appSetting.findMany({ where })
      const settingsMap: Record<string, string> = {}
      for (const s of settings) settingsMap[s.key] = s.value
      return json({ settings: settingsMap })
    }
    if (path === '/settings' && method === 'PUT') {
      const authenticatedUserId = getAuthenticatedUserId(req)
      const rawBody = await getBody(req)
      const cleanBody = stripUserIdFromBody(rawBody)
      const body = validateRequestBody<typeof updateSettingsBody>(updateSettingsBody, cleanBody.updates || [])
      const operations = []
      for (const u of body) {
        if (u.key && u.value !== undefined) {
          const where = authenticatedUserId
            ? { userId_key: { userId: authenticatedUserId, key: u.key } }
            : { key: u.key }
          operations.push(
            db.appSetting.upsert({
              where: where as any,
              update: { value: u.value },
              create: { key: u.key, value: u.value, userId: authenticatedUserId || '' },
            })
          )
        }
      }
      if (operations.length > 0) {
        await db.$transaction(operations)
      }
      return json({ success: true })
    }

    // ─── Activity ──────────────────────────────────────
    if (path === '/activity' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const userId = url.searchParams.get('userId')
      const convWhere = userId ? { affiliateLink: { userId } } : {}
      const linkWhere = userId ? { userId } : {}
      const [conversions, payouts, links] = await Promise.all([
        db.conversion.findMany({ where: convWhere, take: 5, orderBy: { createdAt: 'desc' }, include: { affiliateLink: { select: { name: true } } } }),
        db.payout.findMany({ where: userId ? { userId } : {}, take: 3, orderBy: { requestedAt: 'desc' } }),
        db.affiliateLink.findMany({ where: linkWhere, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, createdAt: true } })
      ])
      const activities = [...conversions.map(c => ({ id: c.id, type: 'conversion', title: 'New Conversion', description: `${c.affiliateLink?.name || 'Unknown'} — RM ${c.commission.toFixed(2)}`, timestamp: c.createdAt.toISOString() })), ...payouts.map(p => ({ id: p.id, type: 'payout', title: 'Payout ' + p.status, description: `RM ${p.amount.toFixed(2)} via ${p.method}`, timestamp: p.requestedAt.toISOString() })), ...links.map(l => ({ id: l.id, type: 'link', title: 'New Link Created', description: l.name, timestamp: l.createdAt.toISOString() }))].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit)
      return json({ activities })
    }

    // ─── Click Stats ───────────────────────────────────
    if (path === '/click-stats' && method === 'GET') {
      const userId = url.searchParams.get('userId')
      const where = userId ? { affiliateLink: { userId } } : {}
      const totalClicks = await db.clickRecord.count({ where })
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayClicks = await db.clickRecord.count({ where: userId ? { ...where, createdAt: { gte: today } } : { createdAt: { gte: today } } })
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
      const weekClicks = await db.clickRecord.count({ where: userId ? { ...where, createdAt: { gte: weekAgo } } : { createdAt: { gte: weekAgo } } })
      const topCountries = await db.clickRecord.groupBy({ by: ['country'], _count: true, where, orderBy: { _count: { country: 'desc' } }, take: 5 })
      return json({ totalClicks, todayClicks, weekClicks, topCountries })
    }

    // ─── Redirect ──────────────────────────────────────
    const redirectMatch = path.match(/^\/redirect\/(.+)$/)
    if (redirectMatch && method === 'GET') {
      const shortCode = redirectMatch[1]
      const link = await db.affiliateLink.findUnique({ where: { shortCode } })
      if (!link) return json({ error: 'Link not found' }, 404)
      await db.clickRecord.create({ data: { linkId: link.id } })
      await db.affiliateLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } })
      return json({ redirectUrl: link.affiliateUrl })
    }

    return json({ error: 'Not found', path }, 404)
  } catch (error) {
    // Validation errors return 400
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      console.error('Validation error:', error.message)
      return json({ error: error.message }, 400, req)
    }

    console.error('DB Service error:', error)
    return json({ error: 'Internal database error' }, 500, req)
  }
}

// Bind to 127.0.0.1 ONLY — never expose to the network
const server = Bun.serve({ port: PORT, hostname: '127.0.0.1', fetch: handleRequest })
console.log(`🗄️  DB Service running on http://localhost:${PORT}`)

process.on('SIGINT', async () => {
  console.log('\nShutting down...')
  await db.$disconnect()
  server.stop()
  process.exit(0)
})
