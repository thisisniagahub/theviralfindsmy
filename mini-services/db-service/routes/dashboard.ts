/**
 * DB Service — Dashboard routes
 */
import { PrismaClient } from '../../../node_modules/.prisma/client/index.js'
import { json } from '../middleware.js'

export function createDashboardRoutes(db: PrismaClient) {
  async function getStats(url: URL, req: Request): Promise<Response> {
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
      orderBy: { createdAt: 'asc' },
    })

    const dailyEarnings: Record<string, number> = {}
    const dailyClicks: Record<string, number> = {}
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      dailyEarnings[key] = 0
      dailyClicks[key] = 0
    }
    for (const c of recentConversions) {
      const key = c.createdAt.toISOString().split('T')[0]
      if (dailyEarnings[key] !== undefined) dailyEarnings[key] += c.commission
    }

    // Fetch real click data
    const allClicks = await db.clickRecord.findMany({
      where: userId
        ? { createdAt: { gte: startDate }, affiliateLink: { userId } }
        : { createdAt: { gte: startDate } },
      select: { linkId: true, createdAt: true },
    })
    const clicksByDate: Record<string, number> = {}
    for (const click of allClicks) {
      const key = click.createdAt.toISOString().split('T')[0]
      clicksByDate[key] = (clicksByDate[key] || 0) + 1
    }
    for (const key of Object.keys(dailyClicks)) {
      dailyClicks[key] = clicksByDate[key] || 0
    }

    const earningsData = Object.entries(dailyEarnings).map(([date, earnings]) => ({
      date,
      earnings: Math.round(earnings * 100) / 100,
      clicks: dailyClicks[date],
    }))

    const topLinks = await db.affiliateLink.findMany({
      where: userWhere,
      orderBy: { earnings: 'desc' },
      take: 5,
      include: { campaign: { select: { name: true } } },
    })

    const recentConv = await db.conversion.findMany({
      where: userId
        ? (period !== 'all' ? { createdAt: { gte: startDate }, affiliateLink: { userId } } : { affiliateLink: { userId } })
        : (period !== 'all' ? { createdAt: { gte: startDate } } : undefined),
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { affiliateLink: { select: { name: true, productName: true, shortCode: true } } },
    })

    const clickRecords = await db.clickRecord.findMany({
      where: userId
        ? (period !== 'all' ? { createdAt: { gte: startDate }, affiliateLink: { userId } } : { affiliateLink: { userId } })
        : (period !== 'all' ? { createdAt: { gte: startDate } } : undefined),
      select: { country: true },
    })
    const countryMap: Record<string, number> = {}
    for (const r of clickRecords) {
      const country = r.country || 'Unknown'
      countryMap[country] = (countryMap[country] || 0) + 1
    }
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
    if (performanceScore >= 90) performanceGrade = 'A'
    else if (performanceScore >= 80) performanceGrade = 'B'
    else if (performanceScore >= 70) performanceGrade = 'C'
    else if (performanceScore >= 60) performanceGrade = 'D'

    return json({
      totalLinks,
      totalClicks,
      totalConversions,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      earningsData,
      topLinks,
      recentConversions: recentConv,
      countryData,
      period,
      performanceScore,
      performanceGrade,
      scoreBreakdown,
    })
  }

  return { getStats }
}
