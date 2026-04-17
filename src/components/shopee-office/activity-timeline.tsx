'use client'

import { useState, useEffect } from 'react'
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
    agentId?: string
    name?: string
    emoji?: string
  }>
  language: Language
  isCompact?: boolean
}

function createInitialEvents(): TimelineEvent[] {
  return [
    { id: '1', agentId: 'product-scout', agentName: 'Product Scout', emoji: '🔍', type: 'sync', message: 'Syncing trend data with Shopee API...', timestamp: new Date().toISOString() },
    { id: '2', agentId: 'content-writer', agentName: 'Content Writer', emoji: '✍️', type: 'task_complete', message: 'Completed 5 TikTok copy drafts.', timestamp: new Date(Date.now() - 5000).toISOString() },
    { id: '3', agentId: 'seo-optimizer', agentName: 'SEO Optimizer', emoji: '🚀', type: 'commission', message: 'Generated RM 12.50 in estimated yield.', timestamp: new Date(Date.now() - 10000).toISOString() },
  ]
}

export function ActivityTimeline({ agents, language: _language, isCompact }: ActivityTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(createInitialEvents)
  
  // Simulation logic
  useEffect(() => {
    const interval = setInterval(() => {
      const agent = agents[Math.floor(Math.random() * agents.length)] || { agentId: 'system', name: 'SYSTEM', emoji: '🤖' }
      const types: TimelineEvent['type'][] = ['status_change', 'task_complete', 'commission', 'link_created', 'campaign']
      const type = types[Math.floor(Math.random() * types.length)]
      
      const newEvent: TimelineEvent = {
        id: Date.now().toString(),
        agentId: agent.agentId || 'system',
        agentName: agent.name || 'SYSTEM',
        emoji: agent.emoji || '🤖',
        type,
        message: type === 'commission' ? `Yield increased by RM ${(Math.random() * 5).toFixed(2)}` : `Operational status updated to ${type}`,
        timestamp: new Date().toISOString(),
      }

      setEvents(prev => [newEvent, ...prev].slice(0, 20))
    }, 8000)

    return () => clearInterval(interval)
  }, [agents])

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }

  if (isCompact) {
    return (
      <div className="p-6 space-y-4 font-mono text-[10px]">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-start justify-between gap-3 group border-b border-white/5 pb-2 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <span className="text-[#EE4D2D] font-black uppercase tracking-tighter whitespace-nowrap">
                    [{event.agentName.split(' ')[0]}]
                  </span>
                  <span className="text-zinc-400 leading-tight">
                    {event.message}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[8px] text-zinc-600 font-bold tabular-nums">
                  {formatTime(event.timestamp)}
                </span>
                {event.type === 'commission' && (
                  <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <AnimatePresence initial={false}>
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
          >
            <div className={`w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-xl`}>
              {event.emoji}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-black text-white uppercase tracking-widest text-xs">{event.agentName}</span>
                <span className="text-[10px] text-zinc-500 tabular-nums">{formatTime(event.timestamp)}</span>
              </div>
              <p className="text-zinc-400 text-sm mt-1">{event.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
