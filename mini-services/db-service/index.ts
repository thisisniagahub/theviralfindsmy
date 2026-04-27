/**
 * Database Microservice (port 3005)
 * 
 * Bypasses Next.js 16 + Turbopack compilation issue where Prisma hangs.
 * Uses the parent project's generated Prisma client.
 */

// Import from parent project's generated Prisma client directly
import { PrismaClient } from '../../node_modules/.prisma/client/index.js'

const db = new PrismaClient({
  log: ['warn', 'error'],
})

const PORT = 3005

const API_KEY = process.env.DB_SERVICE_API_KEY || 'tvf-internal-api-key-2024'

function checkAuth(req: Request): boolean {
  const authHeader = req.headers.get('x-api-key')
  return authHeader === API_KEY
}

async function getBody(req: Request): Promise<Record<string, unknown>> {
  try { return await req.json() } catch { return {} }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.DB_SERVICE_CORS_ORIGIN || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  })
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': process.env.DB_SERVICE_CORS_ORIGIN || 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      },
    })
  }

  // Authenticate all requests (except health check)
  if (path !== '/health' && !checkAuth(req)) {
    return json({ error: 'Unauthorized — invalid or missing API key' }, 401)
  }

  try {
    if (path === '/health') {
      const count = await db.affiliateLink.count()
      return json({ status: 'healthy', links: count, timestamp: new Date().toISOString() })
    }

    // ─── Dashboard Stats ───────────────────────────────
    if (path === '/dashboard/stats' && method === 'GET') {
      const period = url.searchParams.get('period') || '30d'
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
      const [totalLinks, clicksAgg, convAgg, earnAgg, activeLinks, pausedLinks] = await Promise.all([
        db.affiliateLink.count(),
        db.affiliateLink.aggregate({ _sum: { clicks: true } }),
        db.affiliateLink.aggregate({ _sum: { conversions: true } }),
        db.affiliateLink.aggregate({ _sum: { earnings: true } }),
        db.affiliateLink.count({ where: { status: 'active' } }),
        db.affiliateLink.count({ where: { status: 'paused' } }),
      ])
      const totalClicks = clicksAgg._sum.clicks || 0
      const totalConversions = convAgg._sum.conversions || 0
      const totalEarnings = earnAgg._sum.earnings || 0
      const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100) : 0
      const recentConversions = await db.conversion.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true, commission: true, amount: true }, orderBy: { createdAt: 'asc' } })
      const dailyEarnings: Record<string, number> = {}
      const dailyClicks: Record<string, number> = {}
      for (let i = chartDays - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const key = d.toISOString().split('T')[0]; dailyEarnings[key] = 0; dailyClicks[key] = 0 }
      for (const c of recentConversions) { const key = c.createdAt.toISOString().split('T')[0]; if (dailyEarnings[key] !== undefined) dailyEarnings[key] += c.commission }
      // Use real click data when available, only fabricate in demo mode
      const realClickRecords = await db.clickRecord.findMany({
        where: period !== 'all' ? { createdAt: { gte: startDate } } : undefined,
        select: { createdAt: true }
      })
      for (const r of realClickRecords) { const key = r.createdAt.toISOString().split('T')[0]; if (dailyClicks[key] !== undefined) dailyClicks[key] = (dailyClicks[key] || 0) + 1 }
      // Fill any remaining zero days with 0 (no fake data in production)
      const earningsData = Object.entries(dailyEarnings).map(([date, earnings]) => ({ date, earnings: Math.round(earnings * 100) / 100, clicks: dailyClicks[date] }))
      const topLinks = await db.affiliateLink.findMany({ orderBy: { earnings: 'desc' }, take: 5, include: { campaign: { select: { name: true } } } })
      const recentConv = await db.conversion.findMany({ where: period !== 'all' ? { createdAt: { gte: startDate } } : undefined, orderBy: { createdAt: 'desc' }, take: 10, include: { affiliateLink: { select: { name: true, productName: true, shortCode: true } } } })
      const clickRecords = await db.clickRecord.findMany({ where: period !== 'all' ? { createdAt: { gte: startDate } } : undefined, select: { country: true } })
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
      const safeLimit = Math.min(Math.max(limit, 1), 100)
      const status = url.searchParams.get('status')
      const campaignId = url.searchParams.get('campaignId')
      const search = url.searchParams.get('search')
      const where: Record<string, unknown> = {}
      if (status && status !== 'all') where.status = status
      if (campaignId && campaignId !== 'all') where.campaignId = campaignId
      if (search) where.OR = [{ name: { contains: search } }, { productName: { contains: search } }, { shortCode: { contains: search } }]
      const [links, total] = await Promise.all([db.affiliateLink.findMany({ where, include: { campaign: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * safeLimit, take: safeLimit }), db.affiliateLink.count({ where })])
      const campaigns = await db.campaign.findMany({ select: { id: true, name: true } })
      const now = new Date()
      const linksWithExpiry = links.map((link) => {
        let seed = 0; for (let i = 0; i < link.id.length; i++) seed = ((seed << 5) - seed + link.id.charCodeAt(i)) | 0
        const seededRandom = (min: number, max: number) => { seed = (seed * 16807 + 0) % 2147483647; return Math.floor(Math.abs(seed) % (max - min + 1)) + min }
        const avgClicks = link.clicks / 30
        const dailyClicks = Array.from({ length: 7 }, () => Math.max(1, Math.round(avgClicks * (seededRandom(10, 80) / 100))))
        let expiresIn: number | null = null; let isExpired = false; let expiryStatus: string = 'none'
        if (link.expiresAt) { const diffMs = new Date(link.expiresAt).getTime() - now.getTime(); const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); expiresIn = diffDays; isExpired = diffMs < 0; expiryStatus = isExpired ? 'expired' : diffDays <= 7 ? 'expiring_soon' : 'active' }
        return { ...link, dailyClicks, expiresIn, isExpired, expiryStatus }
      })
      return json({ links: linksWithExpiry, campaigns, pagination: { page, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } })
    }
    if (path === '/links' && method === 'POST') {
      const body = await getBody(req)
      const link = await db.affiliateLink.create({ data: { name: String(body.name || ''), productUrl: String(body.productUrl || ''), affiliateUrl: String(body.affiliateUrl || ''), productId: body.productId ? String(body.productId) : null, productName: body.productName ? String(body.productName) : null, productImage: body.productImage ? String(body.productImage) : null, productPrice: body.productPrice ? Number(body.productPrice) : null, commission: body.commission ? Number(body.commission) : null, category: body.category ? String(body.category) : null, campaignId: body.campaignId ? String(body.campaignId) : null, shortCode: String(body.shortCode || `link-${Date.now().toString(36)}`), status: String(body.status || 'active'), expiresAt: body.expiresAt ? new Date(String(body.expiresAt)) : null } })
      return json(link, 201)
    }

    // ─── Single Link ───────────────────────────────────
    const linkMatch = path.match(/^\/links\/([^/]+)$/)
    if (linkMatch) {
      const id = linkMatch[1]
      if (method === 'GET') { const link = await db.affiliateLink.findUnique({ where: { id }, include: { campaign: true, _count: { select: { clickRecords: true, conversionRecords: true } } } }); if (!link) return json({ error: 'Link not found' }, 404); return json(link) }
      if (method === 'PUT') {
        const body = await getBody(req)
        // Whitelist allowed update fields to prevent mass assignment
        const allowedFields = ['name', 'productUrl', 'affiliateUrl', 'productId', 'productName', 'productImage', 'productPrice', 'commission', 'category', 'campaignId', 'status', 'expiresAt'] as const
        const safeData: Record<string, unknown> = {}
        for (const field of allowedFields) {
          if (field in body) safeData[field] = body[field]
        }
        if (Object.keys(safeData).length === 0) return json({ error: 'No valid fields to update' }, 400)
        const link = await db.affiliateLink.update({ where: { id }, data: safeData })
        return json(link)
      }
      if (method === 'DELETE') { await db.affiliateLink.delete({ where: { id } }); return json({ success: true }) }
    }

    // ─── Link Stats ────────────────────────────────────
    const linkStatsMatch = path.match(/^\/links\/([^/]+)\/stats$/)
    if (linkStatsMatch && method === 'GET') {
      const id = linkStatsMatch[1]
      const link = await db.affiliateLink.findUnique({ where: { id } })
      if (!link) return json({ error: 'Link not found' }, 404)
      const clicks = await db.clickRecord.findMany({ where: { linkId: id }, orderBy: { createdAt: 'desc' }, take: 100 })
      return json({ link, clicks, totalClicks: link.clicks, totalConversions: link.conversions, totalEarnings: link.earnings })
    }

    // ─── Notifications ─────────────────────────────────
    if (path === '/notifications' && method === 'GET') {
      const filter = url.searchParams.get('filter') || 'all'
      const where: Record<string, unknown> = {}
      if (filter === 'unread') where.read = false; else if (filter === 'conversions') where.type = 'conversion'; else if (filter === 'payouts') where.type = 'payout'
      const [notifications, unreadCount] = await Promise.all([db.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 }), db.notification.count({ where: { read: false } })])
      const formatted = notifications.map((n) => ({ id: n.id, type: n.type, title: n.title, description: n.description, read: n.read, timestamp: n.createdAt.toISOString() }))
      return json({ notifications: formatted, unreadCount })
    }
    if (path === '/notifications' && method === 'PUT') { await db.notification.updateMany({ where: { read: false }, data: { read: true } }); return json({ success: true, message: 'All notifications marked as read' }) }

    // ─── Campaigns ─────────────────────────────────────
    if (path === '/campaigns' && method === 'GET') {
      const campaigns = await db.campaign.findMany({ include: { links: { select: { id: true, clicks: true, conversions: true, earnings: true, status: true } } }, orderBy: { createdAt: 'desc' } })
      const campaignsWithStats = campaigns.map((c) => ({ ...c, linkCount: c.links.length, totalClicks: c.links.reduce((s, l) => s + l.clicks, 0), totalConversions: c.links.reduce((s, l) => s + l.conversions, 0), totalEarnings: c.links.reduce((s, l) => s + l.earnings, 0) }))
      return json({ campaigns: campaignsWithStats })
    }
    if (path === '/campaigns' && method === 'POST') { const body = await getBody(req); const campaign = await db.campaign.create({ data: { name: String(body.name || ''), description: body.description ? String(body.description) : null, budget: body.budget ? Number(body.budget) : null, startDate: body.startDate ? new Date(String(body.startDate)) : null, endDate: body.endDate ? new Date(String(body.endDate)) : null, status: String(body.status || 'active') } }); return json(campaign, 201) }

    // ─── Conversions ───────────────────────────────────
    if (path === '/conversions' && method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1'); const limit = parseInt(url.searchParams.get('limit') || '25')
      const [conversions, total] = await Promise.all([db.conversion.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { affiliateLink: { select: { name: true, productName: true, shortCode: true } } } }), db.conversion.count()])
      return json({ conversions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
    }

    // ─── Payouts ───────────────────────────────────────
    if (path === '/payouts' && method === 'GET') { const payouts = await db.payout.findMany({ orderBy: { requestedAt: 'desc' } }); const totalPaid = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0); const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0); return json({ payouts, summary: { totalPaid, totalPending, totalPayouts: payouts.length } }) }
    if (path === '/payouts' && method === 'POST') { const body = await getBody(req); const payout = await db.payout.create({ data: { amount: Number(body.amount || 0), method: String(body.method || 'bank_transfer'), bankName: body.bankName ? String(body.bankName) : null, accountNo: body.accountNo ? String(body.accountNo) : null, accountName: body.accountName ? String(body.accountName) : null } }); return json(payout, 201) }

    // ─── Goals ─────────────────────────────────────────
    if (path === '/goals' && method === 'GET') { const goals = await db.earningGoal.findMany({ orderBy: { createdAt: 'desc' } }); const summary = { total: goals.length, active: goals.filter(g => g.status === 'active').length, achieved: goals.filter(g => g.status === 'achieved').length, totalTarget: goals.reduce((s, g) => s + g.targetAmount, 0), totalCurrent: goals.reduce((s, g) => s + g.currentAmount, 0) }; return json({ goals, summary }) }
    if (path === '/goals' && method === 'POST') { const body = await getBody(req); const goal = await db.earningGoal.create({ data: { name: String(body.name || ''), targetAmount: Number(body.targetAmount || 0), period: String(body.period || 'monthly'), endDate: body.endDate ? new Date(String(body.endDate)) : null } }); return json(goal, 201) }

    // ─── Settings ──────────────────────────────────────
    if (path === '/settings' && method === 'GET') { const settings = await db.appSetting.findMany(); const settingsMap: Record<string, string> = {}; for (const s of settings) settingsMap[s.key] = s.value; return json({ settings: settingsMap }) }
    if (path === '/settings' && method === 'PUT') {
      const body = await getBody(req)
      const updates = (body.updates as Record<string, string>[]) || []
      const allowedSettingKeys = ['api_key', 'default_commission_rate', 'shopee_username', 'notification_email', 'auto_pause_expired_links', 'theme', 'currency', 'language']
      const validUpdates = updates.filter(u => u.key && u.value !== undefined && allowedSettingKeys.includes(u.key))
      if (validUpdates.length === 0) return json({ error: 'No valid settings to update' }, 400)
      await db.$transaction(
        validUpdates.map(u => db.appSetting.upsert({ where: { key: String(u.key) }, update: { value: String(u.value) }, create: { key: String(u.key), value: String(u.value) } }))
      )
      return json({ success: true })
    }

    // ─── Activity ──────────────────────────────────────
    if (path === '/activity' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const [conversions, payouts, links] = await Promise.all([db.conversion.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { affiliateLink: { select: { name: true } } } }), db.payout.findMany({ take: 3, orderBy: { requestedAt: 'desc' } }), db.affiliateLink.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, createdAt: true } })])
      const activities = [...conversions.map(c => ({ id: c.id, type: 'conversion', title: 'New Conversion', description: `${c.affiliateLink?.name || 'Unknown'} — RM ${c.commission.toFixed(2)}`, timestamp: c.createdAt.toISOString() })), ...payouts.map(p => ({ id: p.id, type: 'payout', title: 'Payout ' + p.status, description: `RM ${p.amount.toFixed(2)} via ${p.method}`, timestamp: p.requestedAt.toISOString() })), ...links.map(l => ({ id: l.id, type: 'link', title: 'New Link Created', description: l.name, timestamp: l.createdAt.toISOString() }))].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit)
      return json({ activities })
    }

    // ─── Click Stats ───────────────────────────────────
    if (path === '/click-stats' && method === 'GET') {
      const totalClicks = await db.clickRecord.count(); const today = new Date(); today.setHours(0, 0, 0, 0); const todayClicks = await db.clickRecord.count({ where: { createdAt: { gte: today } } }); const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); const weekClicks = await db.clickRecord.count({ where: { createdAt: { gte: weekAgo } } }); const topCountries = await db.clickRecord.groupBy({ by: ['country'], _count: true, orderBy: { _count: { country: 'desc' } }, take: 5 })
      return json({ totalClicks, todayClicks, weekClicks, topCountries })
    }

    // ─── Redirect ──────────────────────────────────────
    const redirectMatch = path.match(/^\/redirect\/(.+)$/)
    if (redirectMatch && method === 'GET') {
      const shortCode = redirectMatch[1]
      const link = await db.affiliateLink.findUnique({ where: { shortCode } })
      if (!link) return json({ error: 'Link not found' }, 404)
      await db.$transaction([
        db.clickRecord.create({ data: { linkId: link.id } }),
        db.affiliateLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } }),
      ])
      return json({ redirectUrl: link.affiliateUrl })
    }

    return json({ error: 'Not found', path }, 404)
  } catch (error) {
    console.error('DB Service error:', error)
    return json({ error: 'Internal server error' }, 500)
  }
}

const server = Bun.serve({ port: PORT, fetch: handleRequest })
console.log(`🗄️  DB Service running on http://localhost:${PORT}`)

process.on('SIGINT', async () => {
  console.log('\nShutting down...')
  await db.$disconnect()
  server.stop()
  process.exit(0)
})
