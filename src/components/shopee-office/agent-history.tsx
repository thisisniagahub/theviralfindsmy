'use client'

import { motion } from 'framer-motion'

const AGENT_HISTORY: Record<string, { text: string; time: string; type: 'success' | 'info' | 'warning' }[]> = {
  'product-scout': [
    { text: 'Found 15 trending items in Electronics', time: '2m ago', type: 'success' },
    { text: 'Alert: Flash Sale starting in 30min', time: '5m ago', type: 'warning' },
    { text: 'Updated product database', time: '12m ago', type: 'info' },
  ],
  'link-builder': [
    { text: 'Created 5 deep links for campaign', time: '1m ago', type: 'success' },
    { text: 'Validated 23 existing links', time: '8m ago', type: 'info' },
    { text: 'Fixed broken link: Phone Case #A12', time: '15m ago', type: 'warning' },
  ],
  'campaign-master': [
    { text: 'Launched "9.9 Mega Sale" campaign', time: '3m ago', type: 'success' },
    { text: 'A/B test results: Variant B +12% CTR', time: '20m ago', type: 'info' },
    { text: 'Budget alert: 72% used this month', time: '1h ago', type: 'warning' },
  ],
  'analytics-agent': [
    { text: 'Generated weekly performance report', time: '4m ago', type: 'success' },
    { text: 'Detected anomaly in click-through data', time: '18m ago', type: 'warning' },
    { text: 'Updated dashboard metrics', time: '35m ago', type: 'info' },
  ],
  'content-writer': [
    { text: 'Published 3 product descriptions', time: '2m ago', type: 'success' },
    { text: 'Optimized IG caption for Beauty set', time: '10m ago', type: 'info' },
    { text: 'Grammar check: 2 issues fixed', time: '25m ago', type: 'warning' },
  ],
  'payout-checker': [
    { text: 'Processed RM 2,340 payout batch', time: '6m ago', type: 'success' },
    { text: 'Verified 45 commission entries', time: '22m ago', type: 'info' },
    { text: 'Flagged suspicious transaction #8901', time: '45m ago', type: 'warning' },
  ],
  'seo-optimizer': [
    { text: 'Optimized 12 product titles', time: '5m ago', type: 'success' },
    { text: 'Rank update: "earbuds" now #3', time: '15m ago', type: 'info' },
    { text: 'Warning: 2 products lost ranking', time: '30m ago', type: 'warning' },
  ],
  'review-monitor': [
    { text: 'Scanned 234 new reviews today', time: '3m ago', type: 'success' },
    { text: 'Negative sentiment spike detected', time: '12m ago', type: 'warning' },
    { text: 'Updated sentiment model v2.1', time: '1h ago', type: 'info' },
  ],
}

function HistoryItem({ activity, index }: { activity: { text: string; time: string; type: 'success' | 'info' | 'warning' }; index: number }) {
  const dotColor = activity.type === 'success' ? '#22c55e' : activity.type === 'warning' ? '#f97316' : '#3b82f6'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.08 }}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderRadius: '4px' }}
    >
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor, boxShadow: `0 0 6px ${dotColor}88`, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activity.text}
        </div>
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#555', whiteSpace: 'nowrap' }}>{activity.time}</span>
    </motion.div>
  )
}

interface AgentHistoryProps {
  agentId: string
  language: string
}

export function AgentHistory({ agentId, language: _language }: AgentHistoryProps) {
  const activities = AGENT_HISTORY[agentId]
  if (!activities) return null

  const t = { recentActivities: 'RECENT ACTIVITIES' }

  return (
    <div style={{ padding: '0 16px 16px', borderTop: '1px solid #1a2040', paddingTop: '12px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3b82f6', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '8px', height: '1px', background: '#3b82f6' }} />
        {t.recentActivities}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {activities.map((activity, i) => (
          <HistoryItem key={i} activity={activity} index={i} />
        ))}
      </div>
    </div>
  )
}
