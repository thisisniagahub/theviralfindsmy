'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Volume2, VolumeX, ChevronDown } from 'lucide-react'
import type { Language } from './language-toggle'

// ===== Types =====
export interface ActivityEvent {
  id: string
  timestamp: number
  agentId: string
  agentName: string
  agentEmoji: string
  type: 'status_change' | 'task_start' | 'task_complete' | 'commission_earned' | 'error' | 'collaboration' | 'pipeline_step'
  detail: string
  metadata?: Record<string, unknown>
}

interface ActivityMonitorProps {
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

// ===== Event Type Config =====
const EVENT_TYPES: Record<ActivityEvent['type'], { color: string; icon: string; label: Record<string, string> }> = {
  status_change: { color: '#3b82f6', icon: '🔄', label: { en: 'Status', cn: '状态', jp: 'ステータス' } },
  task_start: { color: '#f97316', icon: '▶️', label: { en: 'Started', cn: '开始', jp: '開始' } },
  task_complete: { color: '#22c55e', icon: '✅', label: { en: 'Completed', cn: '完成', jp: '完了' } },
  commission_earned: { color: '#FFD700', icon: '💰', label: { en: 'Commission', cn: '佣金', jp: 'コミッション' } },
  error: { color: '#ef4444', icon: '🐛', label: { en: 'Error', cn: '错误', jp: 'エラー' } },
  collaboration: { color: '#ec4899', icon: '🤝', label: { en: 'Collab', cn: '协作', jp: 'コラボ' } },
  pipeline_step: { color: '#a855f7', icon: '🔗', label: { en: 'Pipeline', cn: '流水线', jp: 'パイプライン' } },
}

// ===== Status change detector =====
function useActivityGenerator(agents: ActivityMonitorProps['agents']) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [totalCommission, setTotalCommission] = useState(0)
  const prevStatusRef = useRef<Record<string, string>>({})

  useEffect(() => {
    // Detect status changes
    agents.forEach((agent) => {
      const prevStatus = prevStatusRef.current[agent.agentId]
      if (prevStatus && prevStatus !== agent.status) {
        const eventType: ActivityEvent['type'] = agent.status === 'error' ? 'error' : 'status_change'
        const event: ActivityEvent = {
          id: `evt-${Date.now()}-${agent.agentId}`,
          timestamp: Date.now(),
          agentId: agent.agentId,
          agentName: agent.name,
          agentEmoji: agent.emoji,
          type: eventType,
          detail: `${prevStatus} → ${agent.status}`,
        }
        setEvents((prev) => [event, ...prev].slice(0, 100))
      }
      prevStatusRef.current[agent.agentId] = agent.status
    })
  }, [agents])

  // Generate simulated events periodically
  useEffect(() => {
    if (agents.length === 0) return

    const interval = setInterval(() => {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)]
      if (!randomAgent) return

      const eventTypes: ActivityEvent['type'][] = ['task_complete', 'commission_earned', 'collaboration', 'pipeline_step']
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const commission = type === 'commission_earned' ? parseFloat((Math.random() * 15 + 1).toFixed(2)) : 0

      if (commission > 0) {
        setTotalCommission((prev) => prev + commission)
      }

      const detailMap: Record<ActivityEvent['type'], string> = {
        status_change: 'Status updated',
        task_start: `Started: ${randomAgent.detail || 'New task'}`,
        task_complete: `Completed task #${randomAgent.tasksCompleted + 1}`,
        commission_earned: `+RM ${commission.toFixed(2)}`,
        error: 'Encountered an issue',
        collaboration: `Working with team`,
        pipeline_step: `Pipeline step completed`,
      }

      const event: ActivityEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        agentId: randomAgent.agentId,
        agentName: randomAgent.name,
        agentEmoji: randomAgent.emoji,
        type,
        detail: detailMap[type],
      }

      setEvents((prev) => [event, ...prev].slice(0, 100))
    }, 4000 + Math.random() * 6000)

    return () => clearInterval(interval)
  }, [agents])

  return { events, totalCommission }
}

// ===== Time formatter =====
function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

// ===== Component =====
export function ActivityMonitor({ agents, language }: ActivityMonitorProps) {
  const { events, totalCommission } = useActivityGenerator(agents)
  const [filter, setFilter] = useState<ActivityEvent['type'] | 'all'>('all')
  const [soundOn, setSoundOn] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)

  const filteredEvents = filter === 'all' ? events : events.filter((e) => e.type === filter)

  const translations = {
    en: { title: 'Activity Monitor', live: 'LIVE', events: 'events', commission: 'Commission', all: 'All', sound: 'Sound' },
    cn: { title: '活动监视器', live: '直播', events: '事件', commission: '佣金', all: '全部', sound: '声音' },
    jp: { title: 'アクティビティモニター', live: 'ライブ', events: 'イベント', commission: 'コミッション', all: 'すべて', sound: 'サウンド' },
  }
  const t = translations[language]

  return (
    <motion.div
      className="shopee-office-panel"
      style={{ flex: '1 1 100%', minWidth: 0 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="shopee-panel-title flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Activity size={14} style={{ color: '#22c55e' }} />
          {t.title}
          <span className="flex items-center gap-1 ml-2">
            <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e', animation: 'dotPulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 8, color: '#22c55e', fontWeight: 'normal' }}>{t.live}</span>
          </span>
          <span style={{ fontSize: 9, color: '#888', fontWeight: 'normal' }}>
            {filteredEvents.length} {t.events}
          </span>
        </span>
        <div className="flex items-center gap-2">
          {/* Commission counter */}
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#FFD700', fontWeight: 'bold', animation: 'counterGlow 2s ease-in-out infinite' }}>
            RM {totalCommission.toFixed(2)}
          </span>
          {/* Sound toggle */}
          <button
            className="shopee-btn"
            onClick={() => setSoundOn(!soundOn)}
            style={{ padding: '2px 6px', fontSize: 10 }}
          >
            {soundOn ? <Volume2 size={10} /> : <VolumeX size={10} />}
          </button>
          {/* Expand toggle */}
          <button
            className="shopee-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ padding: '2px 6px', fontSize: 10 }}
          >
            <ChevronDown size={10} style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        <button
          className={`shopee-btn ${filter === 'all' ? 'shopee-btn-active' : ''}`}
          onClick={() => setFilter('all')}
          style={{ fontSize: 9, padding: '2px 8px' }}
        >
          {t.all}
        </button>
        {Object.entries(EVENT_TYPES).map(([type, config]) => (
          <button
            key={type}
            className={`shopee-btn ${filter === type ? 'shopee-btn-active' : ''}`}
            onClick={() => setFilter(type as ActivityEvent['type'])}
            style={{ fontSize: 9, padding: '2px 8px', borderColor: filter === type ? config.color : undefined }}
          >
            {config.icon}
          </button>
        ))}
      </div>

      {/* Event list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            ref={listRef}
            className="shopee-agents-list"
            style={{ maxHeight: 260 }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filteredEvents.map((event, idx) => {
              const config = EVENT_TYPES[event.type]
              return (
                <motion.div
                  key={event.id}
                  className="shopee-agent-item"
                  style={{
                    borderLeftWidth: 3,
                    borderLeftColor: config.color,
                    marginBottom: 4,
                    padding: '6px 10px',
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: idx < 5 ? idx * 0.03 : 0 }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span style={{ fontSize: 14 }}>{event.agentEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: config.color, fontWeight: 'bold' }}>
                          {config.icon} {config.label[language as 'en' | 'cn' | 'jp']}
                        </span>
                        <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#666' }}>
                          {event.agentName}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {event.detail}
                      </div>
                    </div>
                    <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#555', flexShrink: 0 }}>
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                </motion.div>
              )
            })}

            {filteredEvents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#555', fontFamily: 'monospace', fontSize: 11 }}>
                No activity yet...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
