'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Zap } from 'lucide-react'
import type { Language } from './language-toggle'

// ===== Types =====
interface AgentChatPanelProps {
  agents: Array<{
    agentId: string
    name: string
    emoji: string
    status: string
    detail: string
    tasksCompleted: number
  }>
  language: Language
  onSetAgentStatus?: (agentId: string, status: string) => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'agent' | 'system'
  agentId?: string
  agentName?: string
  agentEmoji?: string
  content: string
  timestamp: number
  isStreaming?: boolean
}

// ===== Quick Commands =====
const QUICK_COMMANDS = [
  { id: 'kaji', label: { en: '🔍 Kaji Pasaran', cn: '🔍 研究市场', jp: '🔍 市場調査' }, agentId: 'product-scout', prompt: 'Kaji pasaran Shopee Malaysia hari ini. Apa produk yang sedang trending?' },
  { id: 'ayat', label: { en: '✍️ Buat Ayat', cn: '✍️ 写文案', jp: '✍️ コピー作成' }, agentId: 'content-writer', prompt: 'Buat ayat pemasaran yang menarik untuk produk affiliate Shopee.' },
  { id: 'format', label: { en: '📊 Format JSON', cn: '📊 格式化', jp: '📊 フォーマット' }, agentId: 'seo-optimizer', prompt: 'Format dan analisis data affiliate dalam bentuk JSON yang kemas.' },
  { id: 'pipeline', label: { en: '🔗 Run Pipeline', cn: '🔗 运行流水线', jp: '🔗 パイプライン実行' }, agentId: '__pipeline__', prompt: '' },
]

// ===== Agent-specific responses (demo mode) =====
const DEMO_RESPONSES: Record<string, string[]> = {
  'product-scout': [
    '📊 Saya sudah scan pasaran — 3 produk trending hari ini: TWS Earbuds (5K+ sold), Portable Blender (3K+ sold), dan LED Ring Light (2K+ sold). Semua ada commission rate 5-8%.',
    '🔍 Trend terkini: Beauty products naik 34% minggu ini! Top category: Skincare K-bean. Saya recommend focus pada serum dan sunscreen.',
    '📈 Data menunjukkan weekend sales 2.5x higher. Produk travel bag dan phone accessories paling laku pada Jumaat-Minggu.',
  ],
  'content-writer': [
    '✍️ Ayat ready! "Promo GILA! 🤑 TWS Earbuds harga RM29.90 je — bass power, battery 24jam! Klik link bio sekarang! 🔥 #ShopeeMY #TWS #Promo"',
    '📝 Copy untuk TikTok: "Best gila earbuds ni! 🎵 Bass dia power, charging sekali boleh pakai 24 jam. Harga pun murah gila 😱 Kepo lebih? Swipe up! 👆"',
    '💡 Tip content: Use hook "Harga GILA" + emoji 😱 + specific benefit. Malay audience respond better to casual tone dengan slang.',
  ],
  'seo-optimizer': [
    '📊 Data formatted! JSON output:\n```json\n{\n  "trending_products": 3,\n  "avg_commission": "6.2%",\n  "top_category": "Beauty",\n  "recommended_action": "Focus on K-beauty products"\n}\n```',
    '🔧 SEO optimization complete. Keywords: "tws earbuds murah", "earbuds wireless terbaik", "headphone bluetooth". Search volume: 12K/month.',
  ],
  'analytics-agent': [
    '📈 Analytics report: Conversion rate naik 12% minggu ini. Top performing link: TWS Earbuds (8.5% CVR). Average order value: RM45.60.',
  ],
  'link-builder': [
    '🔗 Link generated! Short URL: tvl.my/tws-earbuds. QR code ready. Tracking pixel embedded.',
  ],
  'campaign-master': [
    '📋 Campaign strategy: Run flash sale promo 3 hari. Budget RM50. Expected ROI: 3.2x. Best time: Friday 8PM - Saturday 12AM.',
  ],
  'review-monitor': [
    '⭐ Review summary: 4.8/5 average rating. Top feedback: "Bass power", "Battery tahan lama". 2 complaints about shipping — perlu address.',
  ],
  'payout-checker': [
    '💰 Payout status: RM 312.50 available for withdrawal. Next payout date: 28th. Commission pending: RM 45.80.',
  ],
}

// ===== Component =====
export function AgentChatPanel({ agents, language, onSetAgentStatus }: AgentChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.agentId || '')
  const [isTyping, setIsTyping] = useState(false)
  const [isPipelineRunning, setIsPipelineRunning] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const selectedAgent = agents.find((a) => a.agentId === selectedAgentId)

  // Send message
  const sendMessage = useCallback(async (text: string, agentId?: string) => {
    const targetAgentId = agentId || selectedAgentId
    if (!text.trim() || !targetAgentId) return

    const targetAgent = agents.find((a) => a.agentId === targetAgentId)
    if (!targetAgent) return

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])

    // Set agent to working state
    onSetAgentStatus?.(targetAgentId, 'writing')
    setIsTyping(true)

    // Map UI agent IDs to NiagaBot agent IDs
    const agentIdToNiagaBot: Record<string, string> = {
      'product-scout': 'niagaresearch',
      'content-writer': 'niagamarketing',
      'seo-optimizer': 'niagacomputer',
      'analytics-agent': 'niagaresearch',
      'link-builder': 'niagacomputer',
      'campaign-master': 'niagamarketing',
      'review-monitor': 'niagaresearch',
      'payout-checker': 'niagacomputer',
    }

    const niagaBotId = agentIdToNiagaBot[targetAgentId] || 'niagaresearch'
    let responseText = ''

    try {
      const res = await fetch('/api/openclaw/a2a-proxy?path=/agents/' + niagaBotId + '/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (res.ok) {
        const data = await res.json()
        responseText = data.response || data.output || 'NiagaBot response received.'
      } else {
        // Fallback to demo response if NiagaBot is unavailable
        const demoResponses = DEMO_RESPONSES[targetAgentId] || ['⚠️ NiagaBot offline. Using cached response.']
        responseText = '⚠️ [Offline Mode] ' + demoResponses[Math.floor(Math.random() * demoResponses.length)]
      }
    } catch {
      // Network error — use demo fallback
      const demoResponses = DEMO_RESPONSES[targetAgentId] || ['⚠️ Connection error.']
      responseText = '⚠️ [Offline] ' + demoResponses[Math.floor(Math.random() * demoResponses.length)]
    }

    // Add agent response
    const agentMsg: ChatMessage = {
      id: `msg-${Date.now()}-agent`,
      role: 'agent',
      agentId: targetAgentId,
      agentName: targetAgent.name,
      agentEmoji: targetAgent.emoji,
      content: responseText,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, agentMsg])
    setIsTyping(false)

    // Return agent to idle
    onSetAgentStatus?.(targetAgentId, 'idle')
  }, [selectedAgentId, agents, onSetAgentStatus])

  // Run pipeline
  const runPipeline = useCallback(async () => {
    setIsPipelineRunning(true)

    // System message
    setMessages((prev) => [...prev, {
      id: `msg-${Date.now()}-sys`,
      role: 'system',
      content: '🔗 A2A Pipeline started: niagaresearch → niagamarketing → niagacomputer',
      timestamp: Date.now(),
    }])

    // Call real A2A pipeline via proxy
    try {
      const res = await fetch('/api/openclaw/a2a-proxy?path=/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'Kaji pasaran Shopee Malaysia, buat ayat pemasaran, dan format sebagai JSON.' }),
      })

      if (res.ok) {
        const result = await res.json()

        // Display each pipeline step
        if (result.pipeline && Array.isArray(result.pipeline)) {
          for (const step of result.pipeline) {
            const agent = agents.find((a) => {
              const mapping: Record<string, string> = {
                'niagaresearch': 'product-scout',
                'niagamarketing': 'content-writer',
                'niagacomputer': 'seo-optimizer',
              }
              return a.agentId === (mapping[step.agent] || step.agent)
            })

            onSetAgentStatus?.(agent?.agentId || step.agent, 'executing')

            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-pipeline-${step.agent}`,
              role: 'agent',
              agentId: agent?.agentId || step.agent,
              agentName: agent?.name || step.agent,
              agentEmoji: agent?.emoji || '🤖',
              content: step.output || 'Processing...',
              timestamp: Date.now(),
            }])

            onSetAgentStatus?.(agent?.agentId || step.agent, 'idle')
          }
        }
      } else {
        throw new Error('Pipeline request failed')
      }
    } catch (err) {
      // Fallback to demo pipeline
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: '⚠️ NiagaBot pipeline unavailable. Using demo mode. Error: ' + String(err),
        timestamp: Date.now(),
      }])

      const agents_demo = ['product-scout', 'content-writer', 'seo-optimizer']
      const labels = ['🔍 Research', '✍️ Content', '📊 Format']

      for (let i = 0; i < agents_demo.length; i++) {
        const agentId = agents_demo[i]
        const agent = agents.find((a) => a.agentId === agentId)
        if (!agent) continue

        onSetAgentStatus?.(agentId, 'executing')
        setIsTyping(true)

        await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1500))

        const demoResponses = DEMO_RESPONSES[agentId] || ['✅ Step completed.']
        const response = demoResponses[Math.floor(Math.random() * demoResponses.length)]

        setMessages((prev) => [...prev, {
          id: `msg-${Date.now()}-pipeline-${i}`,
          role: 'agent',
          agentId,
          agentName: agent.name,
          agentEmoji: agent.emoji,
          content: `${labels[i]}\n${response}`,
          timestamp: Date.now(),
        }])

        onSetAgentStatus?.(agentId, 'idle')
      }
    }

    setIsTyping(false)
    setIsPipelineRunning(false)

    setMessages((prev) => [...prev, {
      id: `msg-${Date.now()}-sys-done`,
      role: 'system',
      content: '✅ Pipeline completed! All 3 agents finished their tasks.',
      timestamp: Date.now(),
    }])
  }, [agents, onSetAgentStatus])

  const handleSend = useCallback(() => {
    if (input.trim()) {
      sendMessage(input)
      setInput('')
    }
  }, [input, sendMessage])

  const handleQuickCommand = useCallback((cmd: typeof QUICK_COMMANDS[0]) => {
    if (cmd.agentId === '__pipeline__') {
      runPipeline()
    } else {
      setSelectedAgentId(cmd.agentId)
      sendMessage(cmd.prompt, cmd.agentId)
    }
  }, [sendMessage, runPipeline])

  const translations = {
    en: { title: 'Agent Chat', placeholder: 'Type a message...', send: 'Send', pipeline: 'Run Pipeline', typing: 'is typing...' },
    cn: { title: '代理聊天', placeholder: '输入消息...', send: '发送', pipeline: '运行流水线', typing: '正在输入...' },
    jp: { title: 'エージェントチャット', placeholder: 'メッセージを入力...', send: '送信', pipeline: 'パイプライン実行', typing: '入力中...' },
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
          💬 {t.title}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: '#22c55e22', color: '#22c55e' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
          {selectedAgent && (
            <span style={{ fontSize: 10, color: '#888', fontWeight: 'normal' }}>
              → {selectedAgent.emoji} {selectedAgent.name}
            </span>
          )}
        </span>
        <button
          className="shopee-btn"
          onClick={runPipeline}
          disabled={isPipelineRunning}
          style={{ fontSize: 9, padding: '2px 10px', borderColor: isPipelineRunning ? '#eab308' : '#a855f7' }}
        >
          {isPipelineRunning ? (
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-flex' }}>
              <Zap size={10} />
            </motion.span>
          ) : (
            <Zap size={10} />
          )}
          {t.pipeline}
        </button>
      </div>

      {/* Quick Commands */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd.id}
            className="shopee-btn"
            onClick={() => handleQuickCommand(cmd)}
            style={{ fontSize: 9, padding: '3px 8px' }}
          >
            {cmd.label[language as 'en' | 'cn' | 'jp']}
          </button>
        ))}
      </div>

      {/* Agent selector */}
      <div className="flex items-center gap-1 mb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {agents.filter((a) => a.status !== 'offline').map((agent) => (
          <button
            key={agent.agentId}
            className={`shopee-btn ${selectedAgentId === agent.agentId ? 'shopee-btn-active' : ''}`}
            onClick={() => setSelectedAgentId(agent.agentId)}
            style={{ fontSize: 9, padding: '2px 8px', whiteSpace: 'nowrap' }}
          >
            {agent.emoji} {agent.name}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div
        ref={listRef}
        className="shopee-agents-list"
        style={{ maxHeight: 240, background: '#0d1020', borderRadius: 4, padding: 8 }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#555', fontFamily: 'monospace', fontSize: 11 }}>
            💬 Start a conversation with an agent...
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                marginBottom: 8,
                padding: '6px 10px',
                borderRadius: 6,
                background: msg.role === 'user' ? '#1a2e3e' : msg.role === 'system' ? '#1a1a2e' : '#1e1e30',
                borderLeft: `3px solid ${msg.role === 'user' ? '#3b82f6' : msg.role === 'system' ? '#eab308' : '#22c55e'}`,
                fontSize: 11,
                fontFamily: 'monospace',
                color: msg.role === 'system' ? '#eab308' : '#ddd',
              }}
            >
              {msg.role === 'agent' && msg.agentEmoji && (
                <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>
                  {msg.agentEmoji} {msg.agentName}
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{msg.content}</div>
              <div style={{ fontSize: 8, color: '#555', marginTop: 2, textAlign: 'right' }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div style={{ padding: '6px 10px', fontSize: 10, color: '#888', fontFamily: 'monospace' }}>
            <span className="flex items-center gap-1">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                {selectedAgent?.emoji || '🤖'}
              </motion.span>
              {selectedAgent?.name || 'Agent'} {t.typing}
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          placeholder={t.placeholder}
          className="flex-1 bg-[#0d1020] border border-[#2a2d3e] rounded px-3 py-1.5 text-[11px] font-mono text-[#e0e0e0] focus:outline-none focus:border-[#EE4D2D]"
        />
        <button
          className="shopee-btn"
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          style={{ padding: '4px 12px' }}
        >
          <Send size={12} />
        </button>
      </div>
    </motion.div>
  )
}
