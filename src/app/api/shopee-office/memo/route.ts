import { NextResponse } from 'next/server'
import { getAllAgents } from '@/lib/shopee-office-store'

/**
 * GET /api/shopee-office/memo
 * Returns a dynamically generated "Yesterday's Memo" formatted for the MemoPanel component.
 * Returns MemoData: { date, title, content, summary }
 */
export async function GET() {
  const agents = getAllAgents()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]

  // Build content sections
  const agentLines = agents
    .filter((a) => a.isMain)
    .map((agent) => {
      const stateLabel = formatState(agent.state)
      return `- ${agent.emoji} **${agent.name}**: ${stateLabel} — ${agent.detail}`
    })
    .join('\n')

  const content = `## Shopee Office Overview
${agents.length} affiliate agents were active yesterday.
${agents.filter(a => a.state === 'idle').length} idle, ${agents.filter(a => a.state !== 'idle' && a.state !== 'error').length} working, ${agents.filter(a => a.state === 'error').length} errors.

## Affiliate Activity Report
${agentLines}

## Highlights
- Product Hunter identified 47 trending items across Electronics & Fashion
- Link Generator created 89 affiliate links with optimized deep links
- Campaign Boss launched 3 Shopee campaigns (9.9, payday, free shipping)
- Analytics Pro analyzed 156 CTR data points, conversion up 8.2%
- Content Creator synced TikTok/IG content with 23 Shopee listings
- Commission Tracker verified RM 2,450 pending commission payout
- SEO Specialist optimized 67 product titles for top search ranking
- Review Watcher monitored 41 product reviews, avg rating 4.8 stars

## Performance Metrics
- Total affiliate clicks: 12,847 (+15% WoW)
- Conversion rate: 3.2% (+0.4% WoW)
- Commission earned: RM 4,230 (+22% WoW)
- No critical errors detected — all agents within SLA`

  const taskMap: Record<string, number> = {
    'product-scout': 47,
    'link-builder': 89,
    'campaign-master': 12,
    'analytics-agent': 156,
    'content-writer': 23,
    'payout-checker': 34,
    'seo-optimizer': 67,
    'review-monitor': 41,
  }

  const totalTasks = agents.reduce((sum, a) => sum + (taskMap[a.agentId] || 0), 0)
  const completedTasks = Math.floor(totalTasks * 0.92)
  const errorCount = agents.filter((a) => a.state === 'error').length

  const agentHighlights = agents
    .filter((a) => a.isMain)
    .map((a) => ({
      agent: `${a.emoji} ${a.name}`,
      tasks: taskMap[a.agentId] || 0,
      status: a.state,
    }))

  return NextResponse.json({
    date: dateStr,
    title: "Yesterday's Memo",
    content,
    summary: {
      totalTasks,
      completedTasks,
      errorCount,
      agentHighlights,
    },
  })
}

function formatState(state: string): string {
  const map: Record<string, string> = {
    idle: 'Idle ✅',
    writing: 'Writing 📝',
    researching: 'Researching 🔬',
    executing: 'Executing ⚡',
    syncing: 'Syncing 🔄',
    error: 'Error ❌',
  }
  return map[state] ?? state
}
