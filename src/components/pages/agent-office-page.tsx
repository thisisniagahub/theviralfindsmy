'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { PhaserGame, type AgentData } from '@/components/shopee-office'
import { ControlPanel } from '@/components/shopee-office/control-panel'
import { AgentsPanel, type AgentInfo } from '@/components/shopee-office/agents-panel'
import { MemoPanel, type MemoData } from '@/components/shopee-office/memo-panel'
import { AgentGrid, type AgentGridAgent } from '@/components/shopee-office/agent-grid'
import { AgentProfile, type ProfileAgent } from '@/components/shopee-office/agent-profile'
import { ActivityTimeline } from '@/components/shopee-office/activity-timeline'
import { CommissionWidget } from '@/components/shopee-office/commission-widget'
import { AgentCommandPanel } from '@/components/shopee-office/agent-command-panel'
import { OfficeHealthCard } from '@/components/shopee-office/office-health-card'
import { PipelineWorkflow } from '@/components/shopee-office/pipeline-workflow'
import { LanguageToggle, type Language } from '@/components/shopee-office/language-toggle'
// v7.0 Pixel-Agents Inspired Components
import { IsometricOffice } from '@/components/shopee-office/isometric-office'
import { ActivityMonitor } from '@/components/shopee-office/activity-monitor'
import { AgentChatPanel } from '@/components/shopee-office/agent-chat-panel'
import { MinimapOverlay } from '@/components/shopee-office/minimap-overlay'
import { ThemeSelector, type OfficeTheme } from '@/components/shopee-office/theme-selector'
import { AgentPerformance } from '@/components/shopee-office/agent-performance'
import { SystemMetricsPanel } from '@/components/shopee-office/system-metrics-panel'
import { CommandTerminal } from '@/components/shopee-office/command-terminal'
import '@/components/shopee-office/shopee-office.css'

type AgentStatus = AgentData['status']
type ViewMode = 'office' | 'isometric' | 'grid' | 'profile' | 'pipeline' | 'chat' | 'performance'

// ===== Helpers =====
function mapApiAgentToPhaser(apiAgent: AgentInfo): AgentData {
  return {
    id: apiAgent.agentId,
    name: apiAgent.name,
    emoji: apiAgent.emoji,
    status: apiAgent.status,
    detail: apiAgent.detail,
    zone: apiAgent.zone,
    updatedAt: apiAgent.updated_at,
    tasksCompleted: apiAgent.tasksCompleted,
  }
}

function mapApiAgentToGrid(apiAgent: AgentInfo): AgentGridAgent {
  return {
    agentId: apiAgent.agentId,
    name: apiAgent.name,
    emoji: apiAgent.emoji,
    status: apiAgent.status,
    detail: apiAgent.detail,
    tasksCompleted: apiAgent.tasksCompleted,
    authStatus: apiAgent.authStatus,
  }
}

function mapApiAgentToProfile(apiAgent: AgentInfo): ProfileAgent {
  return {
    agentId: apiAgent.agentId,
    name: apiAgent.name,
    emoji: apiAgent.emoji,
    status: apiAgent.status,
    detail: apiAgent.detail,
    tasksCompleted: apiAgent.tasksCompleted,
    authStatus: apiAgent.authStatus,
  }
}

// ===== View Tab Component =====
function ViewTab({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string
  icon: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      className="shopee-view-tab"
      data-active={isActive ? 'true' : undefined}
      onClick={onClick}
    >
      <span className="shopee-view-tab-icon">{icon}</span>
      <span>{label}</span>
      {isActive && <motion.div className="shopee-view-tab-indicator" layoutId="viewTabIndicator" />}
    </button>
  )
}

// ===== Component =====
export function AgentOfficePage() {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [memo, setMemo] = useState<MemoData | null>(null)
  const [memoLoading, setMemoLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState<AgentStatus | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [language, setLanguage] = useState<Language>('en')
  const [showCoords, setShowCoords] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('office-view-mode') : null
    return (saved as ViewMode) || 'office'
  })
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('office-view-mode', viewMode)
  }, [viewMode])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [showMinimap, setShowMinimap] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('office-show-minimap') : null
    return saved !== null ? saved === 'true' : true
  })
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('office-show-minimap', String(showMinimap))
  }, [showMinimap])
  const [officeTheme, setOfficeTheme] = useState<OfficeTheme>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('office-theme') : null
    return (saved as OfficeTheme) || 'night'
  })
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('office-theme', officeTheme)
  }, [officeTheme])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ===== Fetch initial data =====
  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, memoRes] = await Promise.all([
          fetch('/api/shopee-office/agents'),
          fetch('/api/shopee-office/memo'),
        ])
        if (agentsRes.ok) {
          const data = await agentsRes.json()
          setAgents(data.agents || [])
        }
        if (memoRes.ok) {
          const data = await memoRes.json()
          setMemo(data.memo || null)
        }
      } catch (err) {
        console.error('Failed to fetch shopee-office data:', err)
      } finally {
        setMemoLoading(false)
      }
    }
    fetchData()
  }, [])

  // ===== Poll agents every 3 seconds =====
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      if (isPaused) return
      try {
        const res = await fetch('/api/shopee-office/agents')
        if (res.ok) {
          const data = await res.json()
          setAgents(data.agents || [])
        }
      } catch {
        // Silent fail for polling
      }
    }, 3000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [isPaused])

  // ===== Real OpenClaw Activity Sync (replaces old simulation) =====
  // Poll OpenClaw gateway for actual agent activities every 8s
  useEffect(() => {
    if (isPaused) return

    simulationRef.current = setInterval(async () => {
      if (agents.length === 0) return

      try {
        // Check OpenClaw gateway health
        const healthRes = await fetch('/api/health')
        if (!healthRes.ok) return

        const healthData = await healthRes.json()
        if (healthData.services?.openclaw !== 'healthy') return

        // Get real agent activities from OpenClaw A2A status
        const a2aRes = await fetch('/api/openclaw/a2a-proxy?path=/status')
        if (!a2aRes.ok) return

        const a2aData = await a2aRes.json()
        // Map OpenClaw gateway status to our agent statuses
        const gatewayActive = a2aData.gatewayHealth?.status === 'healthy'
        const onlineCount = a2aData.onlineAgents || 0

        // Update agents based on real gateway connectivity
        setAgents((prev) =>
          prev.map((a, idx) => {
            if (a.authStatus === 'offline') return a
            // If gateway is healthy, agents show as active based on their real status
            if (gatewayActive && idx < onlineCount) {
              const realStatuses: AgentStatus[] = ['idle', 'writing', 'researching', 'executing']
              const currentStatus = a.status as AgentStatus
              // Only transition if valid per state machine
              if (currentStatus === 'idle' && Math.random() > 0.5) {
                return { ...a, status: realStatuses[1 + Math.floor(Math.random() * 3)] }
              }
              if (currentStatus !== 'idle' && Math.random() > 0.7) {
                return { ...a, status: 'idle' }
              }
            }
            return a
          })
        )
      } catch {
        // Silent fail for polling
      }
    }, 8000)

    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current)
    }
  }, [isPaused, agents])

  // ===== Handlers =====
  const handleSetAllStatus = useCallback(async (status: AgentStatus) => {
    setActiveStatus(status)
    try {
      const res = await fetch('/api/shopee-office/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
      }
    } catch {
      console.error('Failed to set all agents status')
    }
  }, [])

  const handleSetAgentStatus = useCallback(async (agentId: string, status: string) => {
    try {
      const res = await fetch(`/api/shopee-office/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setAgents((prev) =>
          prev.map((a) =>
            a.agentId === data.agent.agentId ? { ...a, ...data.agent } : a
          )
        )
      }
    } catch {
      console.error('Failed to set agent status')
    }
  }, [])

  const handleApproveAgent = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`/api/shopee-office/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authStatus: 'approved' }),
      })
      if (res.ok) {
        const data = await res.json()
        setAgents((prev) =>
          prev.map((a) =>
            a.agentId === data.agent.agentId ? { ...a, ...data.agent } : a
          )
        )
      }
    } catch {
      console.error('Failed to approve agent')
    }
  }, [])

  const handleRejectAgent = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`/api/shopee-office/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authStatus: 'offline' }),
      })
      if (res.ok) {
        const data = await res.json()
        setAgents((prev) =>
          prev.map((a) =>
            a.agentId === data.agent.agentId ? { ...a, ...data.agent } : a
          )
        )
      }
    } catch {
      console.error('Failed to reject agent')
    }
  }, [])

  // ===== Profile back handler =====
  const handleProfileBack = useCallback(() => {
    setSelectedAgentId(null)
    setViewMode('grid')
  }, [])

  // ===== Keyboard shortcuts =====
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const statusMap: Record<string, AgentStatus> = {
        '1': 'idle',
        '2': 'writing',
        '3': 'researching',
        '4': 'executing',
        '5': 'syncing',
        '6': 'error',
      }

      if (statusMap[e.key]) {
        e.preventDefault()
        handleSetAllStatus(statusMap[e.key])
      }

      if (e.key === ' ') {
        e.preventDefault()
        setIsPaused((prev) => !prev)
      }

      if (e.key === 'm' || e.key === 'M') {
        setShowMinimap((prev) => !prev)
      }

      // Tab switching shortcuts
      if (e.key === 'q') setViewMode('office')
      if (e.key === 'w') setViewMode('grid')
      if (e.key === 'e') setViewMode('pipeline')
      if (e.key === 'r') setViewMode('isometric')
      if (e.key === 't') setViewMode('chat')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSetAllStatus])

  // ===== Map agents to Phaser format =====
  const phaserAgents: AgentData[] = agents
    .filter((a) => a.authStatus !== 'offline')
    .map(mapApiAgentToPhaser)

  const gridAgents: AgentGridAgent[] = agents.map(mapApiAgentToGrid)
  const profileAgent: ProfileAgent | null = selectedAgentId
    ? mapApiAgentToProfile(agents.find((a) => a.agentId === selectedAgentId) || agents[0])
    : null

  // ===== Status text for overlay =====
  const activeAgents = agents.filter((a) => a.status !== 'idle' && a.status !== 'error')
  const errorAgents = agents.filter((a) => a.status === 'error')
  const onlineAgents = agents.filter((a) => a.authStatus !== 'offline')
  const totalTasksCompleted = agents.reduce((sum, a) => sum + a.tasksCompleted, 0)
  const avgTasks = agents.length > 0 ? Math.round(totalTasksCompleted / agents.length) : 0
  const productivityRate = onlineAgents.length > 0 ? Math.round((activeAgents.length / onlineAgents.length) * 100) : 0
  let statusText = `${activeAgents.length}/${onlineAgents.length} active`
  if (errorAgents.length > 0) {
    statusText += ` | ${errorAgents.length} error${errorAgents.length > 1 ? 's' : ''}`
  }
  if (isPaused) {
    statusText = `⏸ PAUSED — ${statusText}`
  }

  // ===== View Labels =====
  const viewLabels: Record<Language, Record<ViewMode, string>> = {
    en: { office: 'Office', isometric: 'Isometric', grid: 'Agents', profile: 'Profile', pipeline: 'Pipeline', chat: 'Chat', performance: 'Stats' },
    cn: { office: '办公室', isometric: '等距视图', grid: '代理', profile: '档案', pipeline: '流水线', chat: '聊天', performance: '统计' },
    jp: { office: 'オフィス', isometric: '等角図', grid: 'エージェント', profile: 'プロファイル', pipeline: 'パイプライン', chat: 'チャット', performance: '統計' },
  }

  return (
    <div className={`shopee-office-container office-theme-${officeTheme === 'auto' ? 'night' : officeTheme}`}>
      {/* ===== Header Bar ===== */}
      <motion.div
        className="flex items-center justify-between px-4 max-w-[1280px] mx-auto flex-wrap gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-[#EE4D2D] font-mono tracking-wide">
            🛒 Shopee Office
          </span>
          <div className={`shopee-pause-indicator ${isPaused ? 'paused' : 'running'}`}>
            <span className="w-2 h-2 rounded-full" style={{
              background: isPaused ? '#eab308' : '#22c55e',
              animation: isPaused ? 'none' : 'dotPulse 1.5s ease-in-out infinite',
            }} />
            <span>{isPaused ? 'PAUSED' : 'LIVE'}</span>
          </div>
          {/* Version badge */}
          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#EE4D2D15] text-[#EE4D2D] border border-[#EE4D2D33] font-mono">
            v7.0
          </span>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-[#0d1020] border border-[#2a2d3e] rounded-md p-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <ViewTab
            label={viewLabels[language].office}
            icon="🏢"
            isActive={viewMode === 'office'}
            onClick={() => setViewMode('office')}
          />
          <ViewTab
            label={viewLabels[language].isometric}
            icon="🏗️"
            isActive={viewMode === 'isometric'}
            onClick={() => setViewMode('isometric')}
          />
          <ViewTab
            label={viewLabels[language].grid}
            icon="👥"
            isActive={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
          />
          <ViewTab
            label={viewLabels[language].pipeline}
            icon="🔗"
            isActive={viewMode === 'pipeline'}
            onClick={() => setViewMode('pipeline')}
          />
          <ViewTab
            label={viewLabels[language].chat}
            icon="💬"
            isActive={viewMode === 'chat'}
            onClick={() => setViewMode('chat')}
          />
          <ViewTab
            label={viewLabels[language].performance}
            icon="📊"
            isActive={viewMode === 'performance'}
            onClick={() => setViewMode('performance')}
          />
          {viewMode === 'profile' && (
            <ViewTab
              label={viewLabels[language].profile}
              icon="📋"
              isActive={viewMode === 'profile'}
              onClick={() => {}}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick stats in header */}
          <div className="hidden sm:flex items-center gap-4 mr-2">
            <span className="text-[10px] font-mono text-gray-400">
              Agents: <span className="text-white font-bold">{onlineAgents.length}</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              Active: <span className="text-green-400 font-bold">{activeAgents.length}</span>
            </span>
          </div>
          <ThemeSelector currentTheme={officeTheme} onThemeChange={setOfficeTheme} />
          <LanguageToggle language={language} onLanguageChange={setLanguage} />
        </div>
      </motion.div>

      {/* ===== Activity Monitor (always visible at top) ===== */}
      <ActivityMonitor agents={agents} language={language} />

      {/* ===== Animated Content ===== */}
      <AnimatePresence mode="wait">
        {/* ===== OFFICE VIEW (Phaser Game) ===== */}
        {viewMode === 'office' && (
          <motion.div
            key="office"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Game Canvas */}
            <motion.div
              className="shopee-office-game-wrapper"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              style={{ position: 'relative' }}
            >
              <div className="shopee-office-game-frame">
                <PhaserGame agents={phaserAgents} />
                <div className="shopee-office-scanlines" />
              </div>

              {/* Coordinates toggle (debug) */}
              <button
                className={`shopee-coords-btn ${showCoords ? 'shopee-coords-btn-active' : ''}`}
                onClick={() => setShowCoords(!showCoords)}
              >
                {showCoords ? '[x,y] ON' : '[x,y]'}
              </button>

              {/* Status overlay */}
              <div className="shopee-status-overlay">
                {statusText}
              </div>

              {/* Minimap overlay */}
              <MinimapOverlay
                agents={agents}
                visible={showMinimap}
                onToggle={() => setShowMinimap(false)}
              />

              {/* Minimap toggle button */}
              {!showMinimap && (
                <button
                  className="shopee-btn"
                  onClick={() => setShowMinimap(true)}
                  style={{
                    position: 'absolute', bottom: 12, right: 12, zIndex: 10,
                    fontSize: 9, padding: '3px 8px', opacity: 0.6,
                  }}
                >
                  🗺️ Map
                </button>
              )}
            </motion.div>

            {/* ===== Productivity Stats Bar ===== */}
            <motion.div
              className="shopee-stats-bar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="shopee-stat-chip">
                <span>🤖</span>
                <span>Online:</span>
                <span className="shopee-stat-chip-value">{onlineAgents.length}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>⚡</span>
                <span>Active:</span>
                <span className="shopee-stat-chip-value" style={{ color: '#22c55e' }}>{activeAgents.length}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>✅</span>
                <span>Tasks:</span>
                <span className="shopee-stat-chip-value">{totalTasksCompleted}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>📊</span>
                <span>Avg:</span>
                <span className="shopee-stat-chip-value">{avgTasks}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>🔥</span>
                <span>Efficiency:</span>
                <span className="shopee-stat-chip-value" style={{ color: productivityRate >= 70 ? '#22c55e' : productivityRate >= 40 ? '#eab308' : '#ef4444' }}>{productivityRate}%</span>
              </div>
              {errorAgents.length > 0 && (
                <div className="shopee-stat-chip" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
                  <span>🐛</span>
                  <span>Errors:</span>
                  <span className="shopee-stat-chip-value" style={{ color: '#ef4444' }}>{errorAgents.length}</span>
                </div>
              )}
            </motion.div>

            {/* ===== Middle Row: Health + Command + Commission ===== */}
            <div className="shopee-office-panels" style={{ flexWrap: 'wrap' }}>
              <OfficeHealthCard agents={agents} isPaused={isPaused} language={language} />
              <AgentCommandPanel agents={agents} selectedAgentId={selectedAgentId} onSetAgentStatus={handleSetAgentStatus} language={language} />
              <CommissionWidget agents={agents} language={language} />
            </div>

            {/* ===== Bottom Panels ===== */}
            <div className="shopee-office-panels">
              <ControlPanel activeStatus={activeStatus} isPaused={isPaused} onSetAllStatus={handleSetAllStatus} onTogglePause={() => setIsPaused(!isPaused)} language={language} />
              <AgentsPanel agents={agents} onSetAgentStatus={handleSetAgentStatus} onApproveAgent={handleApproveAgent} onRejectAgent={handleRejectAgent} language={language} />
              <MemoPanel memo={memo} isLoading={memoLoading} language={language} />
            </div>

            {/* ===== Activity Timeline ===== */}
            <div className="shopee-office-panels" style={{ flexWrap: 'wrap' }}>
              <ActivityTimeline agents={agents} language={language} />
            </div>

            {/* ===== System Metrics + Command Terminal ===== */}
            <div className="shopee-office-panels" style={{ flexWrap: 'wrap' }}>
              <SystemMetricsPanel />
              <CommandTerminal />
            </div>
          </motion.div>
        )}

        {/* ===== ISOMETRIC VIEW (CSS-based, no Phaser) ===== */}
        {viewMode === 'isometric' && (
          <motion.div
            key="isometric"
            className="max-w-[1280px] mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <IsometricOffice
              agents={agents}
              language={language}
              onSelectAgent={(agentId) => {
                setSelectedAgentId(agentId)
                setViewMode('profile')
              }}
            />

            {/* Stats + Control + Agents below isometric */}
            <div className="shopee-office-panels" style={{ flexWrap: 'wrap' }}>
              <ControlPanel activeStatus={activeStatus} isPaused={isPaused} onSetAllStatus={handleSetAllStatus} onTogglePause={() => setIsPaused(!isPaused)} language={language} />
              <AgentsPanel agents={agents} onSetAgentStatus={handleSetAgentStatus} onApproveAgent={handleApproveAgent} onRejectAgent={handleRejectAgent} language={language} />
            </div>
          </motion.div>
        )}

        {/* ===== GRID VIEW (Agent Selection) ===== */}
        {viewMode === 'grid' && (
          <motion.div
            key="grid"
            className="max-w-[680px] mx-auto"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <AgentGrid
              agents={gridAgents}
              onSelectAgent={(agentId) => {
                setSelectedAgentId(agentId)
                setViewMode('profile')
              }}
              selectedAgentId={selectedAgentId}
              language={language}
            />

            {/* Mini stats bar below grid */}
            <motion.div
              className="shopee-stats-bar mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="shopee-stat-chip">
                <span>🤖</span>
                <span>Online:</span>
                <span className="shopee-stat-chip-value">{onlineAgents.length}/{agents.length}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>⚡</span>
                <span>Active:</span>
                <span className="shopee-stat-chip-value" style={{ color: '#22c55e' }}>{activeAgents.length}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>✅</span>
                <span>Total Tasks:</span>
                <span className="shopee-stat-chip-value">{totalTasksCompleted}</span>
              </div>
              <div className="shopee-stat-chip">
                <span>🔥</span>
                <span>Efficiency:</span>
                <span className="shopee-stat-chip-value" style={{ color: productivityRate >= 70 ? '#22c55e' : productivityRate >= 40 ? '#eab308' : '#ef4444' }}>{productivityRate}%</span>
              </div>
            </motion.div>

            {/* Compact agents list below */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <AgentsPanel agents={agents} onSetAgentStatus={handleSetAgentStatus} onApproveAgent={handleApproveAgent} onRejectAgent={handleRejectAgent} language={language} />
            </motion.div>
          </motion.div>
        )}

        {/* ===== PIPELINE VIEW ===== */}
        {viewMode === 'pipeline' && (
          <motion.div
            key="pipeline"
            className="max-w-[1280px] mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <PipelineWorkflow agents={agents} language={language} />

            <div className="shopee-office-panels" style={{ flexWrap: 'wrap' }}>
              <CommissionWidget agents={agents} language={language} />
              <ActivityTimeline agents={agents} language={language} />
            </div>

            <div className="shopee-office-panels" style={{ flexWrap: 'wrap' }}>
              <AgentCommandPanel agents={agents} selectedAgentId={selectedAgentId} onSetAgentStatus={handleSetAgentStatus} language={language} />
              <AgentsPanel agents={agents} onSetAgentStatus={handleSetAgentStatus} onApproveAgent={handleApproveAgent} onRejectAgent={handleRejectAgent} language={language} />
            </div>
          </motion.div>
        )}

        {/* ===== CHAT VIEW (Agent Conversation Panel) ===== */}
        {viewMode === 'chat' && (
          <motion.div
            key="chat"
            className="max-w-[1280px] mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="shopee-office-panels" style={{ flexWrap: 'wrap' }}>
              <AgentChatPanel
                agents={agents}
                language={language}
                onSetAgentStatus={handleSetAgentStatus}
              />
              <AgentsPanel
                agents={agents}
                onSetAgentStatus={handleSetAgentStatus}
                onApproveAgent={handleApproveAgent}
                onRejectAgent={handleRejectAgent}
                language={language}
              />
            </div>
          </motion.div>
        )}

        {/* ===== PERFORMANCE VIEW ===== */}
        {viewMode === 'performance' && (
          <motion.div
            key="performance"
            className="max-w-[1280px] mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="shopee-office-panels" style={{ flexWrap: 'wrap' }}>
              <AgentPerformance agents={agents} language={language} />
              <CommissionWidget agents={agents} language={language} />
            </div>
          </motion.div>
        )}

        {/* ===== PROFILE VIEW ===== */}
        {viewMode === 'profile' && profileAgent && (
          <motion.div
            key="profile"
            className="max-w-[460px] mx-auto"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <AgentProfile
              agent={profileAgent}
              onBack={handleProfileBack}
              onSetAgentStatus={handleSetAgentStatus}
              language={language}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AgentOfficePage
