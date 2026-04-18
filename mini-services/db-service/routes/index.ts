/**
 * DB Service — Users routes
 */
import { PrismaClient } from '../../../node_modules/.prisma/client/index.js'
import { json } from '../middleware.js'

export function createUserRoutes(db: PrismaClient) {
  async function upsertUser(body: Record<string, unknown>, req: Request): Promise<Response> {
    const { email, name, image } = body as { email: string; name?: string; image?: string }
    if (!email) return json({ error: 'Email is required' }, 400, req)

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@theviralfinds.my'
    const user = await db.user.upsert({
      where: { email },
      update: { name: name ?? undefined, image: image ?? undefined },
      create: {
        email,
        name: name ?? null,
        image: image ?? null,
        role: email === adminEmail ? 'ADMIN' : 'USER',
      },
    })
    return json(user, 200, req)
  }

  async function getMe(url: URL, req: Request): Promise<Response> {
    const userId = url.searchParams.get('userId')
    if (!userId) return json({ error: 'userId query parameter is required' }, 400, req)
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return json({ error: 'User not found' }, 404, req)
    return json(user, 200, req)
  }

  return { upsertUser, getMe }
}

/**
 * DB Service — Campaigns routes
 */
import { createCampaignBody, validateBody } from '../validations.js'
import { getAuthenticatedUserId, stripUserIdFromBody } from '../middleware.js'

export function createCampaignRoutes(db: PrismaClient) {
  async function getCampaigns(url: URL, req: Request): Promise<Response> {
    const userId = url.searchParams.get('userId')
    const where = userId ? { userId } : {}
    const campaigns = await db.campaign.findMany({
      where,
      include: { links: { select: { id: true, clicks: true, conversions: true, earnings: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const campaignsWithStats = campaigns.map((c) => ({
      ...c,
      linkCount: c.links.length,
      totalClicks: c.links.reduce((s, l) => s + l.clicks, 0),
      totalConversions: c.links.reduce((s, l) => s + l.conversions, 0),
      totalEarnings: c.links.reduce((s, l) => s + l.earnings, 0),
    }))
    return json({ campaigns: campaignsWithStats })
  }

  async function createCampaign(reqBody: Promise<Record<string, unknown>>, req: Request): Promise<Response> {
    const rawBody = await reqBody
    const authenticatedUserId = getAuthenticatedUserId(req)
    if (!authenticatedUserId) return json({ error: 'userId required (x-user-id header)' }, 400, req)

    const cleanBody = stripUserIdFromBody(rawBody)
    const body = validateBody(createCampaignBody, cleanBody)

    const campaign = await db.campaign.create({
      data: {
        userId: authenticatedUserId,
        name: body.name,
        description: body.description ?? null,
        budget: body.budget ?? null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: body.status,
      },
    })
    return json(campaign, 201)
  }

  return { getCampaigns, createCampaign }
}

/**
 * DB Service — Conversions routes
 */
export function createConversionRoutes(db: PrismaClient) {
  async function getConversions(url: URL, req: Request): Promise<Response> {
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '25')
    const userId = url.searchParams.get('userId')
    const where = userId ? { affiliateLink: { userId } } : {}

    const [conversions, total] = await Promise.all([
      db.conversion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { affiliateLink: { select: { name: true, productName: true, shortCode: true } } },
      }),
      db.conversion.count({ where }),
    ])
    return json({ conversions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  }

  return { getConversions }
}

/**
 * DB Service — Payouts routes
 */
import { createPayoutBody } from '../validations.js'

export function createPayoutRoutes(db: PrismaClient) {
  async function getPayouts(url: URL, req: Request): Promise<Response> {
    const userId = url.searchParams.get('userId')
    const where = userId ? { userId } : {}
    const payouts = await db.payout.findMany({ where, orderBy: { requestedAt: 'desc' } })
    const totalPaid = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)
    const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
    return json({ payouts, summary: { totalPaid, totalPending, totalPayouts: payouts.length } })
  }

  async function createPayout(reqBody: Promise<Record<string, unknown>>, req: Request): Promise<Response> {
    const rawBody = await reqBody
    const authenticatedUserId = getAuthenticatedUserId(req)
    if (!authenticatedUserId) return json({ error: 'userId required (x-user-id header)' }, 400, req)

    const cleanBody = stripUserIdFromBody(rawBody)
    const body = validateBody(createPayoutBody, cleanBody)

    const payout = await db.payout.create({
      data: {
        userId: authenticatedUserId,
        amount: body.amount,
        method: body.method,
        bankName: body.bankName ?? null,
        accountNo: body.accountNo ?? null,
        accountName: body.accountName ?? null,
        note: body.note ?? null,
      },
    })
    return json(payout, 201)
  }

  return { getPayouts, createPayout }
}

/**
 * DB Service — Goals routes
 */
import { createGoalBody } from '../validations.js'

export function createGoalRoutes(db: PrismaClient) {
  async function getGoals(url: URL, req: Request): Promise<Response> {
    const userId = url.searchParams.get('userId')
    const where = userId ? { userId } : {}
    const goals = await db.earningGoal.findMany({ where, orderBy: { createdAt: 'desc' } })
    const summary = {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      achieved: goals.filter(g => g.status === 'achieved').length,
      totalTarget: goals.reduce((s, g) => s + g.targetAmount, 0),
      totalCurrent: goals.reduce((s, g) => s + g.currentAmount, 0),
    }
    return json({ goals, summary })
  }

  async function createGoal(reqBody: Promise<Record<string, unknown>>, req: Request): Promise<Response> {
    const rawBody = await reqBody
    const authenticatedUserId = getAuthenticatedUserId(req)
    if (!authenticatedUserId) return json({ error: 'userId required (x-user-id header)' }, 400, req)

    const cleanBody = stripUserIdFromBody(rawBody)
    const body = validateBody(createGoalBody, cleanBody)

    const goal = await db.earningGoal.create({
      data: {
        userId: authenticatedUserId,
        name: body.name,
        targetAmount: body.targetAmount,
        period: body.period,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    })
    return json(goal, 201)
  }

  return { getGoals, createGoal }
}

/**
 * DB Service — Settings routes
 */
import { updateSettingsBody } from '../validations.js'

export function createSettingsRoutes(db: PrismaClient) {
  async function getSettings(url: URL, req: Request): Promise<Response> {
    const userId = url.searchParams.get('userId')
    const where = userId ? { userId } : {}
    const settings = await db.appSetting.findMany({ where })
    const settingsMap: Record<string, string> = {}
    for (const s of settings) settingsMap[s.key] = s.value
    return json({ settings: settingsMap })
  }

  async function updateSettings(reqBody: Promise<Record<string, unknown>>, req: Request): Promise<Response> {
    const authenticatedUserId = getAuthenticatedUserId(req)
    const rawBody = await reqBody
    const cleanBody = stripUserIdFromBody(rawBody)
    const body = validateBody(updateSettingsBody, (cleanBody as any).updates || [])

    const operations = []
    for (const u of body) {
      if (u.key && u.value !== undefined) {
        const where = authenticatedUserId ? { userId: authenticatedUserId, key: u.key } : { key: u.key }
        operations.push(
          db.appSetting.upsert({
            where,
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

  return { getSettings, updateSettings }
}

/**
 * DB Service — Notifications routes
 */
export function createNotificationRoutes(db: PrismaClient) {
  async function getNotifications(url: URL, req: Request): Promise<Response> {
    const filter = url.searchParams.get('filter') || 'all'
    const userId = url.searchParams.get('userId')
    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (filter === 'unread') where.read = false
    else if (filter === 'conversions') where.type = 'conversion'
    else if (filter === 'payouts') where.type = 'payout'

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 }),
      db.notification.count({ where: { ...where, read: false } }),
    ])
    const formatted = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      description: n.description,
      read: n.read,
      timestamp: n.createdAt.toISOString(),
    }))
    return json({ notifications: formatted, unreadCount })
  }

  async function markAllRead(req: Request): Promise<Response> {
    const authenticatedUserId = getAuthenticatedUserId(req)
    if (authenticatedUserId) {
      await db.notification.updateMany({ where: { userId: authenticatedUserId, read: false }, data: { read: true } })
    } else {
      await db.notification.updateMany({ where: { read: false }, data: { read: true } })
    }
    return json({ success: true, message: 'All notifications marked as read' })
  }

  return { getNotifications, markAllRead }
}

/**
 * DB Service — Activity routes
 */
export function createActivityRoutes(db: PrismaClient) {
  async function getActivity(url: URL, req: Request): Promise<Response> {
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const userId = url.searchParams.get('userId')
    const convWhere = userId ? { affiliateLink: { userId } } : {}
    const linkWhere = userId ? { userId } : {}

    const [conversions, payouts, links] = await Promise.all([
      db.conversion.findMany({ where: convWhere, take: 5, orderBy: { createdAt: 'desc' }, include: { affiliateLink: { select: { name: true } } } }),
      db.payout.findMany({ where: userId ? { userId } : {}, take: 3, orderBy: { requestedAt: 'desc' } }),
      db.affiliateLink.findMany({ where: linkWhere, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, createdAt: true } }),
    ])

    const activities = [
      ...conversions.map(c => ({
        id: c.id,
        type: 'conversion',
        title: 'New Conversion',
        description: `${c.affiliateLink?.name || 'Unknown'} — RM ${c.commission.toFixed(2)}`,
        timestamp: c.createdAt.toISOString(),
      })),
      ...payouts.map(p => ({
        id: p.id,
        type: 'payout',
        title: 'Payout ' + p.status,
        description: `RM ${p.amount.toFixed(2)} via ${p.method}`,
        timestamp: p.requestedAt.toISOString(),
      })),
      ...links.map(l => ({
        id: l.id,
        type: 'link',
        title: 'New Link Created',
        description: l.name,
        timestamp: l.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit)

    return json({ activities })
  }

  return { getActivity }
}

/**
 * DB Service — Click Stats routes
 */
export function createClickStatsRoutes(db: PrismaClient) {
  async function getClickStats(url: URL, req: Request): Promise<Response> {
    const userId = url.searchParams.get('userId')
    const where = userId ? { affiliateLink: { userId } } : {}

    const totalClicks = await db.clickRecord.count({ where })
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayClicks = await db.clickRecord.count({
      where: userId ? { ...where, createdAt: { gte: today } } : { createdAt: { gte: today } },
    })
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekClicks = await db.clickRecord.count({
      where: userId ? { ...where, createdAt: { gte: weekAgo } } : { createdAt: { gte: weekAgo } },
    })
    const topCountries = await db.clickRecord.groupBy({
      by: ['country'],
      _count: true,
      where,
      orderBy: { _count: { country: 'desc' } },
      take: 5,
    })

    return json({ totalClicks, todayClicks, weekClicks, topCountries })
  }

  return { getClickStats }
}

/**
 * DB Service — Redirect routes
 */
export function createRedirectRoutes(db: PrismaClient) {
  async function redirect(shortCode: string, req: Request): Promise<Response> {
    const link = await db.affiliateLink.findUnique({ where: { shortCode } })
    if (!link) return json({ error: 'Link not found' }, 404)
    await db.clickRecord.create({ data: { linkId: link.id } })
    await db.affiliateLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } })
    return json({ redirectUrl: link.affiliateUrl })
  }

  return { redirect }
}
