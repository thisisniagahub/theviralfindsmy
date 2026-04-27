import { NextResponse } from 'next/server'

interface ActivityEntry {
  id: string
  timestamp: string
  agentId: string
  agentName: string
  agentEmoji: string
  action: string
  status: 'success' | 'info' | 'warning' | 'error'
  category: string
}

const agentNames: Record<string, { name: string; emoji: string }> = {
  'product-scout': { name: 'Product Scout', emoji: '🔍' },
  'link-builder': { name: 'Link Builder', emoji: '🔗' },
  'campaign-master': { name: 'Campaign Master', emoji: '📊' },
  'analytics-agent': { name: 'Analytics Agent', emoji: '📈' },
  'content-writer': { name: 'Content Writer', emoji: '✍️' },
  'payout-checker': { name: 'Payout Checker', emoji: '💰' },
}

const agentActions: Record<string, { actions: string[]; status: ActivityEntry['status'][]; category: string }> = {
  'product-scout': {
    category: 'Discovery',
    actions: [
      'Found 5 trending items in Electronics',
      'Discovered new flash sale on Fashion category',
      'Identified 3 high-commission products in Beauty',
      'Scanned 128 products — 12 new trending items found',
      'Updated trending products list for Home & Living',
      'Found competitor product with 40% discount',
    ],
    status: ['success', 'success', 'info', 'success', 'info', 'success'],
  },
  'link-builder': {
    category: 'Links',
    actions: [
      'Created affiliate link for "Wireless Earbuds Pro"',
      'Generated batch links (8 products)',
      'Updated tracking params for campaign links',
      'Created short link for Ramadan Sale flyer',
      'Verified 23 active affiliate links',
      'Auto-generated links for new trending items',
    ],
    status: ['success', 'success', 'info', 'success', 'info', 'success'],
  },
  'campaign-master': {
    category: 'Campaigns',
    actions: [
      'Activated "Ramadan Mega Sale" campaign',
      'Paused expired "Tech Week" campaign',
      'Updated budget allocation for Beauty campaign',
      'Created new campaign: "Back to School Deals"',
      'Analyzed campaign ROI: +34% vs last month',
      'Scheduled campaign post for 8:00 PM peak hours',
    ],
    status: ['success', 'warning', 'info', 'success', 'success', 'info'],
  },
  'analytics-agent': {
    category: 'Analytics',
    actions: [
      'Processed 1,247 click events from last hour',
      'Generated daily performance report',
      'Detected conversion spike on Electronics (+23%)',
      'Updated revenue tracking: RM 2,847.50 total',
      'Synced device data: 65% mobile, 35% desktop',
      'Alert: Click-to-conversion rate dropped to 2.1%',
    ],
    status: ['success', 'info', 'success', 'success', 'info', 'warning'],
  },
  'content-writer': {
    category: 'Content',
    actions: [
      'Published product review for "Smart Watch Pro"',
      'Drafted 3 Instagram captions for flash sale',
      'Wrote email newsletter (487 subscribers)',
      'Completed SEO-optimized product description',
      'Created comparison article: Earbuds vs Headphones',
      'Scheduled 5 social media posts for this week',
    ],
    status: ['success', 'success', 'success', 'info', 'info', 'success'],
  },
  'payout-checker': {
    category: 'Earnings',
    actions: [
      'Verified RM 284.75 pending payout',
      'Confirmed RM 1,250.00 processed to Maybank',
      'Alert: Payout delay detected (2 days overdue)',
      'Updated monthly earnings: RM 2,847.50',
      'Checked commission for 45 completed orders',
      'Detected refund: RM 12.50 (Order #SH-88321)',
    ],
    status: ['success', 'success', 'warning', 'info', 'info', 'warning'],
  },
}

function generateActivityLog(count: number): ActivityEntry[] {
  const entries: ActivityEntry[] = []
  const agentIds = Object.keys(agentNames)
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const agentId = agentIds[Math.floor(Math.random() * agentIds.length)]
    const agent = agentNames[agentId]
    const actions = agentActions[agentId]
    const actionIndex = Math.floor(Math.random() * actions.actions.length)

    entries.push({
      id: `activity-${Date.now()}-${i}`,
      timestamp: new Date(now - i * 45000 - Math.random() * 30000).toISOString(),
      agentId,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      action: actions.actions[actionIndex],
      status: actions.status[actionIndex],
      category: actions.category,
    })
  }

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export async function GET() {
  const entries = generateActivityLog(50)
  return NextResponse.json({ entries })
}
