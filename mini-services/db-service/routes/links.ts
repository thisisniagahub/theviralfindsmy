/**
 * DB Service — Links routes
 */
import { PrismaClient } from '../../../node_modules/.prisma/client/index.js'
import { createLinkBody, updateLinkBody, validateBody } from '../validations.js'
import { json, getAuthenticatedUserId, stripUserIdFromBody, getBody } from '../middleware.js'

export function createLinkRoutes(db: PrismaClient) {
  async function getLinks(url: URL, req: Request): Promise<Response> {
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

    const [links, total] = await Promise.all([
      db.affiliateLink.findMany({
        where,
        include: { campaign: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.affiliateLink.count({ where }),
    ])

    const campaigns = await db.campaign.findMany({ select: { id: true, name: true } })
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Fetch real click data for all links
    const linkIds = links.map((l) => l.id)
    const recentClicks = await db.clickRecord.findMany({
      where: { linkId: { in: linkIds }, createdAt: { gte: sevenDaysAgo } },
      select: { linkId: true, createdAt: true },
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
      let expiresIn: number | null = null
      let isExpired = false
      let expiryStatus: string = 'none'
      if (link.expiresAt) {
        const diffMs = new Date(link.expiresAt).getTime() - now.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        expiresIn = diffDays
        isExpired = diffMs < 0
        expiryStatus = isExpired ? 'expired' : diffDays <= 7 ? 'expiring_soon' : 'active'
      }
      return { ...link, dailyClicks, expiresIn, isExpired, expiryStatus }
    })

    return json({
      links: linksWithExpiry,
      campaigns,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  }

  async function createLink(reqBody: Promise<Record<string, unknown>>, req: Request): Promise<Response> {
    const rawBody = await reqBody
    const authenticatedUserId = getAuthenticatedUserId(req)
    if (!authenticatedUserId) return json({ error: 'userId required (x-user-id header)' }, 400, req)

    const cleanBody = stripUserIdFromBody(rawBody)
    const body = validateBody(createLinkBody, cleanBody)

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
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })
    return json(link, 201)
  }

  async function getLink(id: string, req: Request): Promise<Response> {
    const linkUserId = new URL(req.url).searchParams.get('userId')
    const link = await db.affiliateLink.findUnique({
      where: { id },
      include: {
        campaign: true,
        _count: { select: { clickRecords: true, conversionRecords: true } },
      },
    })
    if (!link) return json({ error: 'Link not found' }, 404)
    if (linkUserId && link.userId !== linkUserId) return json({ error: 'Forbidden' }, 403)
    return json(link)
  }

  async function updateLink(id: string, reqBody: Promise<Record<string, unknown>>, req: Request): Promise<Response> {
    const authenticatedUserId = getAuthenticatedUserId(req)
    if (!authenticatedUserId) return json({ error: 'userId required (x-user-id header)' }, 400, req)

    const existing = await db.affiliateLink.findUnique({ where: { id } })
    if (!existing) return json({ error: 'Link not found' }, 404)
    if (existing.userId !== authenticatedUserId) return json({ error: 'Forbidden' }, 403)

    const rawBody = await reqBody
    const cleanBody = stripUserIdFromBody(rawBody)
    const body = validateBody(updateLinkBody, cleanBody)

    const link = await db.affiliateLink.update({ where: { id }, data: body })
    return json(link)
  }

  async function deleteLink(id: string, req: Request): Promise<Response> {
    const deleteUserId = getAuthenticatedUserId(req)
    if (deleteUserId) {
      const existing = await db.affiliateLink.findUnique({ where: { id } })
      if (!existing) return json({ error: 'Link not found' }, 404)
      if (existing.userId !== deleteUserId) return json({ error: 'Forbidden' }, 403)
    }
    await db.affiliateLink.delete({ where: { id } })
    return json({ success: true })
  }

  async function getLinkStats(id: string, req: Request): Promise<Response> {
    const linkUserId = new URL(req.url).searchParams.get('userId')
    const link = await db.affiliateLink.findUnique({ where: { id } })
    if (!link) return json({ error: 'Link not found' }, 404)
    if (linkUserId && link.userId !== linkUserId) return json({ error: 'Forbidden' }, 403)

    const clicks = await db.clickRecord.findMany({
      where: { linkId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return json({
      link,
      clicks,
      totalClicks: link.clicks,
      totalConversions: link.conversions,
      totalEarnings: link.earnings,
    })
  }

  return { getLinks, createLink, getLink, updateLink, deleteLink, getLinkStats }
}
