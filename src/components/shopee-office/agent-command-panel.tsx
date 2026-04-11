'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import type { Language } from './language-toggle'

// ===== Types =====
interface AgentCommandPanelProps {
  agents: Array<{
    agentId: string
    name: string
    emoji: string
    status: string
    detail: string
  }>
  selectedAgentId: string | null
  onSetAgentStatus: (agentId: string, status: string) => void
  language: Language
}

interface ChatMessage {
  id: string
  role: 'user' | 'agent' | 'system'
  content: string
  agentName?: string
  agentEmoji?: string
  timestamp: string
}

// ===== Quick Commands =====
const QUICK_COMMANDS: Array<{ label: string; labelCn: string; labelJp: string; command: string; icon: string }> = [
  { label: 'Find Trending', labelCn: '找趋势', labelJp: 'トレンド検索', command: 'Find trending products on Shopee Malaysia right now', icon: '🔥' },
  { label: 'Generate Link', labelCn: '生成链接', labelJp: 'リンク作成', command: 'Generate an affiliate link for the top selling product', icon: '🔗' },
  { label: 'Analyze CTR', labelCn: '分析点击率', labelJp: 'CTR分析', command: 'Analyze my click-through rate and suggest improvements', icon: '📊' },
  { label: 'Optimize SEO', labelCn: '优化SEO', labelJp: 'SEO最適化', command: 'Optimize my product listings for Shopee search ranking', icon: '⚙️' },
  { label: 'Check Commission', labelCn: '查佣金', labelJp: 'コミッション確認', command: 'Check my pending commissions and recent earnings', icon: '💰' },
  { label: 'Campaign Plan', labelCn: '活动计划', labelJp: 'キャンペーン計画', command: 'Create a campaign plan for the upcoming Shopee sale event', icon: '🎯' },
]

// ===== Agent Response Generator =====
const AGENT_RESPONSES: Record<string, string[]> = {
  'product-scout': [
    '🔍 Found 15 trending products in Electronics! Top pick: TWS Earbuds (RM 29.90) with 4.8★ rating and 12K+ sold.',
    '📊 Trending categories right now: Beauty (+34%), Electronics (+22%), Fashion (+18%). I recommend focusing on the Beauty segment.',
    '⚡ Flash Sale Alert: 3 items matching your criteria start in 45 minutes. Shall I prepare affiliate links?',
  ],
  'link-builder': [
    '🔗 Affiliate link generated! Short URL: shopee.my/abc123 — Deep link enabled for mobile app opening. Commission rate: 5.2%',
    '✅ Created 5 deep links for your top products. All links verified and tracking pixels embedded.',
    '⚠️ Warning: 2 existing links have expired (products delisted). I\'ve marked them for removal.',
  ],
  'campaign-master': [
    '🎯 Campaign "9.9 Mega Sale" is ready! Budget: RM 500, Target: 500 clicks, Expected commission: RM 250+',
    '📈 A/B Test Results: Variant B (emotional headline) outperforms Variant A by +12.3% CTR. Recommend switching.',
    '💡 Suggestion: Run a Free Shipping campaign this weekend — historical data shows 3x conversion rate.',
  ],
  'analytics-agent': [
    '📊 Weekly Report: CTR improved from 6.2% to 8.4% (+35%). Top performer: Beauty category links.',
    '🔍 Conversion funnel analysis shows 68% drop-off at product page. Recommend adding social proof content.',
    '📈 Your affiliate revenue is trending +22% this month. At current rate, projected monthly: RM 6,400.',
  ],
  'content-writer': [
    '✍️ Generated 3 product descriptions with SEO keywords. Ready for review. Engagement score: 8.5/10',
    '📱 Created IG caption: "PROMO HABIS! 🏃‍♀️ Dapatkan [product] hanya RM XX.XX! Link in bio 🔗"',
    '🔄 Synced 15 TikTok product tags with Shopee listings. All affiliate links active.',
  ],
  'payout-checker': [
    '💰 Commission Summary: RM 4,230 total earned | RM 2,450 pending payout | Next payout: March 15',
    '✅ Verified 45 commission entries. No discrepancies found. All tracking is accurate.',
    '⚠️ Notice: Commission rate for Electronics changed from 5% to 4.5% effective next month.',
  ],
  'seo-optimizer': [
    '⚙️ Optimized 12 product titles. New keywords: "murah", "promo", "original". Expected ranking boost: +15%',
    '📈 SEO Score improved from 72 to 88. Top keywords now ranking in Shopee top 10.',
    '💡 Tip: Add "Free Shipping" and "COD" to titles — data shows 23% more clicks with these keywords.',
  ],
  'review-monitor': [
    '⭐ Review Alert: Your promoted Wireless Earbuds received 8 new 5-star reviews today! Average: 4.8★',
    '⚠️ Negative Alert: 2 one-star reviews on USB Cable (quality issue). Recommend pausing that affiliate link.',
    '📊 Sentiment Analysis: 94% positive reviews across all promoted products this week.',
  ],
}

const SYSTEM_RESPONSES = [
  '🤖 Agent is processing your request... Connecting to Shopee API.',
  '⚡ Task queued. Agent will execute in priority order.',
  '🔄 Syncing with Shopee Office database...',
]

// ===== Translations =====
const translations = {
  en: {
    title: 'Agent Command',
    placeholder: 'Send a command to agent...',
    selectAgent: 'Select an agent first',
    quickCommands: 'Quick Commands',
  },
  cn: {
    title: '代理命令',
    placeholder: '向代理发送命令...',
    selectAgent: '请先选择一个代理',
    quickCommands: '快捷命令',
  },
  jp: {
    title: 'エージェントコマンド',
    placeholder: 'エージェントにコマンドを送信...',
    selectAgent: '先にエージェントを選択してください',
    quickCommands: 'クイックコマンド',
  },
}

// ===== Component =====
export function AgentCommandPanel({
  agents,
  selectedAgentId,
  onSetAgentStatus,
  language,
}: AgentCommandPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const t = translations[language]

  const selectedAgent = agents.find((a) => a.agentId === selectedAgentId)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !selectedAgentId || isProcessing) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsProcessing(true)

    // Simulate system thinking
    setTimeout(() => {
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        role: 'system',
        content: SYSTEM_RESPONSES[Math.floor(Math.random() * SYSTEM_RESPONSES.length)],
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, sysMsg])
    }, 500)

    // Simulate agent response after delay
    setTimeout(() => {
      const agentResponses = AGENT_RESPONSES[selectedAgentId] || AGENT_RESPONSES['product-scout']
      const response = agentResponses[Math.floor(Math.random() * agentResponses.length)]

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: response,
        agentName: selectedAgent?.name || 'Agent',
        agentEmoji: selectedAgent?.emoji || '🤖',
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, agentMsg])
      setIsProcessing(false)

      // Auto-set agent to executing when processing a command
      onSetAgentStatus(selectedAgentId, 'executing')
      setTimeout(() => {
        onSetAgentStatus(selectedAgentId, 'idle')
      }, 3000)
    }, 1500 + Math.random() * 1500)
  }, [selectedAgentId, selectedAgent, isProcessing, onSetAgentStatus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickCommand = (command: string) => {
    sendMessage(command)
  }

  return (
    <motion.div
      className="shopee-office-panel"
      style={{ flex: '0 0 340px', minWidth: 300 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="shopee-panel-title flex items-center gap-2">
        <Sparkles size={14} style={{ color: '#7C4DFF' }} />
        {t.title}
        {selectedAgent && (
          <span className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: '#7C4DFF' }}>
            {selectedAgent.emoji} {selectedAgent.name}
          </span>
        )}
      </div>

      {!selectedAgentId ? (
        <div className="text-center py-8 text-gray-600 text-xs font-mono">
          {t.selectAgent}
        </div>
      ) : (
        <>
          {/* Chat Messages */}
          <div
            className="space-y-2 mb-3"
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#7C4DFF44 #141722',
            }}
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: msg.role === 'user' ? '#2a2d3e' : msg.role === 'system' ? '#1a1e2e' : '#7C4DFF22',
                      border: `1px solid ${msg.role === 'agent' ? '#7C4DFF44' : '#2a2d3e'}`,
                      fontSize: 12,
                    }}
                  >
                    {msg.role === 'user' ? <User size={12} color="#888" /> : msg.role === 'system' ? <Bot size={12} color="#555" /> : msg.agentEmoji}
                  </div>

                  {/* Message */}
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-[10px] font-mono leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#7C4DFF22] border border-[#7C4DFF33] text-purple-300'
                        : msg.role === 'system'
                          ? 'bg-[#1a1e2e] border border-[#2a2d3e] text-gray-500'
                          : 'bg-[#141722] border border-[#3a3f55] text-gray-300'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-3"
              >
                <Loader2 size={12} className="animate-spin text-purple-400" />
                <span className="text-[10px] text-purple-400 font-mono">Agent is thinking...</span>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Commands */}
          <div className="mb-3">
            <div style={{ fontSize: 8, color: '#555', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 4 }}>
              {t.quickCommands}
            </div>
            <div className="flex flex-wrap gap-1">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd.command}
                  className="shopee-btn text-[9px] px-2 py-1 flex items-center gap-1"
                  onClick={() => handleQuickCommand(cmd.command)}
                  disabled={isProcessing}
                  style={{ opacity: isProcessing ? 0.5 : 1 }}
                >
                  <span>{cmd.icon}</span>
                  <span>{language === 'cn' ? cmd.labelCn : language === 'jp' ? cmd.labelJp : cmd.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              disabled={isProcessing}
              className="flex-1 bg-[#1a1e2e] border border-[#2a2d3e] rounded px-3 py-2 text-[11px] font-mono text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#7C4DFF55] transition-colors"
            />
            <button
              type="submit"
              disabled={isProcessing || !input.trim()}
              className="flex items-center justify-center w-8 h-8 rounded bg-[#7C4DFF22] border border-[#7C4DFF44] text-purple-400 hover:bg-[#7C4DFF33] hover:border-[#7C4DFF66] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </form>
        </>
      )}
    </motion.div>
  )
}
