'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Language } from './language-toggle'

// ===== Types =====
export interface TimelineEvent {
  id: string
  agentId: string
  agentName: string
  emoji: string
  type: 'status_change' | 'task_complete' | 'commission' | 'error' | 'sync' | 'link_created' | 'campaign'
  message: string
  timestamp: string
  value?: string
}

interface ActivityTimelineProps {
  agents: Array<{
    agentId: string
    name: string
    emoji: string
    status: string
    detail: string
    tasksCompleted: number
  }>
  language: Language
}

// ===== Event Generator =====
const COMMISSION_EVENTS = [
  'Earned RM 12.50 from Wireless Earbuds',
  'Earned RM 8.90 from Face Mask Pack',
  'Earned RM 45.00 from Samsung Galaxy Tab',
  'Earned RM 23.00 from Smart Watch',
  'Earned RM 6.70 from Phone Case',
  'Earned RM 34.50 from Running Shoes',
  'Earned RM 15.80 from Laneige Serum',
  'Earned RM 9.20 from USB-C Cable',
]

const TASK_EVENTS = [
  'Scanned 15 trending products in Electronics',
  'Generated 8 affiliate deep links',
  'Optimized 12 product titles for SEO',
  'Analyzed CTR data: +8.2% this week',
  'Synced 23 IG posts to Shopee listings',
  'Launched campaign: 9.9 Mega Sale',
  'Verified RM 2,450 pending commissions',
  'Monitored 41 product reviews',
]

const STATUS_CHANGE_MESSAGES: Record<string, Record<string, string>> = {
  idle: { en: 'went idle', cn: '进入空闲', jp: '待機中' },
  writing: { en: 'started writing content', cn: '开始写作内容', jp: 'コンテンツ執筆開始' },
  researching: { en: 'began researching trends', cn: '开始研究趋势', jp: 'トレンド調査開始' },
  executing: { en: 'started executing tasks', cn: '开始执行任务', jp: 'タスク実行開始' },
  syncing: { en: 'syncing with Shopee API', cn: '正在与Shopee API同步', jp: 'Shopee APIと同期中' },
  error: { en: 'encountered an error!', cn: '遇到错误！', jp: 'エラー発生！' },
}

const LINK_EVENTS = [
  'Created affiliate link for: iPhone 15 Case',
  'Created affiliate link for: AirPods Pro 2',
  'Created affiliate link for: SK-II Facial Treatment',
  'Created affiliate link for: Nike Running Shoes',
  'Created affiliate link for: Portable Blender',
]

const CAMPAIGN_EVENTS = [
  'Launched "9.9 Mega Sale" campaign',
  'A/B test: Variant B wins +12% CTR',
  'Campaign "Payday Sale" went live',
  'Scheduled "Free Shipping Day" campaign',
]

// ===== Translations =====
const translations = {
  en: { title: 'Activity Feed', live: 'LIVE', clear: 'Clear', noActivity: 'Waiting for agent activity...' },
  cn: { title: '活动动态', live: '实时', clear: '清除', noActivity: '等待代理活动...' },
  jp: { title: 'アクティビティ', live: 'ライブ', clear: 'クリア', noActivity: 'エージェントの活動を待機中...' },
}

// ===== Event Type Colors & Icons =====
const EVENT_STYLES: Record<string, { color: string; icon: string; bg: string }> = {
  status_change: { color: '#3b82f6', icon: '🔄', bg: 'rgba(59,130,246,0.08)' },
  task_complete: { color: '#22c55e', icon: '✅', bg: 'rgba(34,197,94,0.08)' },
  commission: { color: '#FFD700', icon: '💰', bg: 'rgba(255,215,0,0.08)' },
  error: { color: '#ef4444', icon: '❌', bg: 'rgba(239,68,68,0.08)' },
  sync: { color: '#06b6d4', icon: '🔄', bg: 'rgba(6,182,212,0.08)' },
  link_created: { color: '#4ECDC4', icon: '🔗', bg: 'rgba(78,205,196,0.08)' },
  campaign: { color: '#EE4D2D', icon: '🎯', bg: 'rgba(238,77,45,0.08)' },
}

// ===== Component =====
export function ActivityTimeline({ agents, language }: ActivityTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLive, _setIsLive] = useState(true)
  const prevStatusRef = useRef<Record<string, string>>({})
  const prevTasksRef = useRef<Record<string, number>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const t = translations[language]

  // Generate events from agent state changes (using queueMicrotask to avoid sync setState in effect)
  useEffect(() => {
    const newEvents: TimelineEvent[] = []

    agents.forEach((agent) => {
      const prevStatus = prevStatusRef.current[agent.agentId]
      const prevTasks = prevTasksRef.current[agent.agentId]

      // Status change event
      if (prevStatus && prevStatus !== agent.status) {
        const msg = STATUS_CHANGE_MESSAGES[agent.status]?.[language] || agent.status
        newEvents.push({
          id: `status-${agent.agentId}-${Date.now()}`,
          agentId: agent.agentId,
          agentName: agent.name,
          emoji: agent.emoji,
          type: 'status_change',
          message: `${agent.name} ${msg}`,
          timestamp: new Date().toISOString(),
        })
      }

      // Task completion event
      if (prevTasks !== undefined && agent.tasksCompleted > prevTasks) {
        const taskMsg = TASK_EVENTS[Math.floor(Math.random() * TASK_EVENTS.length)]
        newEvents.push({
          id: `task-${agent.agentId}-${Date.now()}`,
          agentId: agent.agentId,
          agentName: agent.name,
          emoji: agent.emoji,
          type: 'task_complete',
          message: taskMsg,
          timestamp: new Date().toISOString(),
        })
      }

      // Random commission event on executing state
      if (agent.status === 'executing' && prevStatus !== 'executing' && Math.random() > 0.5) {
        const commMsg = COMMISSION_EVENTS[Math.floor(Math.random() * COMMISSION_EVENTS.length)]
        newEvents.push({
          id: `comm-${Date.now()}-${Math.random()}`,
          agentId: agent.agentId,
          agentName: agent.name,
          emoji: agent.emoji,
          type: 'commission',
          message: commMsg,
          timestamp: new Date().toISOString(),
          value: commMsg.match(/RM [\d.]+/)?.[0],
        })
      }

      // Update refs
      prevStatusRef.current[agent.agentId] = agent.status
      prevTasksRef.current[agent.agentId] = agent.tasksCompleted
    })

    if (newEvents.length > 0) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setEvents((prev) => [...newEvents, ...prev].slice(0, 50))
      })
    }
  }, [agents, language])

  // Generate random ambient events
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      if (agents.length === 0) return

      const activeAgents = agents.filter((a) => a.status !== 'idle' && a.status !== 'error')
      if (activeAgents.length === 0) return

      const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)]
      const eventTypes: Array<{ type: TimelineEvent['type']; messages: string[] }> = [
        { type: 'commission', messages: COMMISSION_EVENTS },
        { type: 'link_created', messages: LINK_EVENTS },
        { type: 'campaign', messages: CAMPAIGN_EVENTS },
        { type: 'sync', messages: ['Synced product catalog with Shopee', 'Updated pricing data from API', 'Refreshed commission rates'] },
      ]

      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const message = eventType.messages[Math.floor(Math.random() * eventType.messages.length)]

      setEvents((prev) => [
        {
          id: `ambient-${Date.now()}-${Math.random()}`,
          agentId: agent.agentId,
          agentName: agent.name,
          emoji: agent.emoji,
          type: eventType.type,
          message,
          timestamp: new Date().toISOString(),
          value: eventType.type === 'commission' ? message.match(/RM [\d.]+/)?.[0] : undefined,
        },
        ...prev,
      ].slice(0, 50))
    }, 4000 + Math.random() * 3000)

    return () => clearInterval(interval)
  }, [isLive, agents])

  // Auto-scroll to top on new events
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [events.length])

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString(language === 'cn' ? 'zh-CN' : language === 'jp' ? 'ja-JP' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div
      className="shopee-office-panel"
      style={{ flex: '1 1 100%', minWidth: 0 }}
    >
      <div className="shopee-panel-title flex items-center justify-between">
        <span className="flex items-center gap-2">
          📡 {t.title}
          {isLive && (
            <motion.span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold"
              style={{
                background: 'rgba(34,197,94,0.15)',
                color: '#22c55e',
                border: '1px solid rgba(34,197,94,0.3)',
              }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {t.live}
            </motion.span>
          )}
        </span>
        <button
          className="shopee-btn text-[9px] px-2 py-1"
          onClick={() => setEvents([])}
        >
          {t.clear}
        </button>
      </div>

      <div
        ref={containerRef}
        className="shopee-agents-list"
        style={{ maxHeight: 280 }}
      >
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-600 text-xs font-mono"
            >
              {t.noActivity}
            </motion.div>
          ) : (
            events.map((event) => {
              const style = EVENT_STYLES[event.type] || EVENT_STYLES.status_change
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex items-start gap-2 px-2 py-2 rounded-md mb-1"
                  style={{
                    background: style.bg,
                    borderLeft: `3px solid ${style.color}`,
                  }}
                >
                  <span className="text-sm mt-0.5 flex-shrink-0">{event.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 10, color: style.color, fontWeight: 'bold', fontFamily: 'monospace' }}>
                        {style.icon} {event.agentName}
                      </span>
                      {event.value && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                          style={{
                            background: 'rgba(255,215,0,0.15)',
                            color: '#FFD700',
                            border: '1px solid rgba(255,215,0,0.3)',
                          }}
                        >
                          {event.value}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: '#999', fontFamily: 'monospace', marginTop: 2, lineHeight: 1.4 }}>
                      {event.message}
                    </p>
                  </div>
                  <span style={{ fontSize: 8, color: '#555', fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {formatTime(event.timestamp)}
                  </span>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
