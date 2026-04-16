'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/error-boundary'
import { IsometricOffice } from '@/components/shopee-office'
import { StudioProvider } from '@/components/shopee-office/lib/store'
import GameHud from '@/components/shopee-office/hud/GameHud'
import {
  Zap,
  LayoutGrid,
  Users,
  MessageCircle,
  Info,
  Settings,
  LogOut,
  AlertTriangle,
  Send,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   AgentOfficePage — "Unified Mega Workspace"
   ═══════════════════════════════════════════════════════════════
   Stitch-matched layout with LIVE Phaser canvas (not a static image).
   Layout: icon-only sidebar + full-bleed Phaser game + floating HUD panels.
   Color tokens: bg #25262B, panel #2D2E33, sidebar #202125, accent #FF7020
*/

// Dynamic import for Phaser (client-only, heavy module)
const PhaserGame = dynamic(() => import('@/components/shopee-office/phaser-game'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 z-0 flex items-center justify-center" style={{ background: '#25262B' }}>
      <div className="flex flex-col items-center gap-4">
        <span className="text-4xl animate-bounce">🛒</span>
        <span className="text-lg font-bold text-white font-mono">Loading Shopee Office...</span>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#FF7020] rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  ),
})

// ─── Sidebar Nav Items ───
const navItems = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { id: 'activity', icon: Zap, label: 'Activity' },
  { id: 'agents', icon: Users, label: 'Agents' },
  { id: 'conversations', icon: MessageCircle, label: 'Conversations' },
  { id: 'info', icon: Info, label: 'Information' },
]

// ─── Mock Activity Events ───
const activityEvents = [
  { id: 1, type: 'warning', label: 'High-Priority Events', sub: '[NiagaResearch] Analyzing Shopee trends...', color: 'yellow' },
  { id: 2, type: 'critical', label: 'High-Priority Events', sub: '[NiagaMarketing] Campaign optimization alert', color: 'red' },
  { id: 3, type: 'info', label: 'Conversation Events', sub: '[NiagaComputer] Sync complete', color: 'gray' },
]

const detailedEvents = [
  { id: 1, label: 'High-priority Events', sub: 'High priority events events', color: 'orange' },
  { id: 2, label: 'High-priority Events', sub: 'High priority events events', color: 'red' },
]

// ─── Mock Chat Messages ───
const chatMessages = [
  { agent: 'NiagaResearch', msg: 'Analyzing Shopee trends for electronics...', time: '10:33 AM' },
  { agent: 'NiagaMarketing', msg: 'Optimizing campaign for flash sale...', time: '10:52 AM' },
  { agent: 'NiagaComputer', msg: 'Synchronizing data with Shopee API...', time: '10:52 AM' },
]

// ─── Agent Data for Phaser ───
const agents = [
  { id: 'product-scout', name: 'NiagaResearch', emoji: '🔍', status: 'researching' as const, detail: 'Analyzing Shopee trends...', zone: 'work' as const, updatedAt: new Date().toISOString(), tasksCompleted: 12 },
  { id: 'content-writer', name: 'NiagaMarketing', emoji: '✍️', status: 'writing' as const, detail: 'Optimizing campaign copy...', zone: 'work' as const, updatedAt: new Date().toISOString(), tasksCompleted: 8 },
  { id: 'seo-optimizer', name: 'NiagaComputer', emoji: '⚙️', status: 'executing' as const, detail: 'Synchronizing with API...', zone: 'sync' as const, updatedAt: new Date().toISOString(), tasksCompleted: 24 },
  { id: 'link-builder', name: 'NiagaOps', emoji: '🔗', status: 'idle' as const, detail: 'Standing by...', zone: 'rest' as const, updatedAt: new Date().toISOString(), tasksCompleted: 6 },
]

export function AgentOfficePage() {
  const [activeNav, setActiveNav] = useState('activity')
  const [chatInput, setChatInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  return (
    <StudioProvider>
      <div className="fixed inset-0 flex overflow-hidden font-sans"
           style={{ background: '#25262B', color: '#E0E0E0' }}>

        {/* ═══ SIDEBAR (w-16, icon-only) ═══ */}
        <aside className="w-16 flex flex-col items-center py-4 shrink-0 z-20"
               style={{ background: '#202125', borderRight: '1px solid #3F4045' }}>

          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-md flex items-center justify-center mb-8 cursor-pointer"
            style={{ background: '#FF7020', boxShadow: '0 4px 12px rgba(255,112,32,0.25)' }}
          >
            <Zap className="w-6 h-6 text-white" fill="currentColor" />
          </motion.div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 flex-1 w-full">
            {navItems.map((item) => {
              const isActive = activeNav === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  title={item.label}
                  className={`w-full flex justify-center py-3 transition-colors relative ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-[#9BA1A6] hover:text-white hover:bg-white/5'
                  }`}
                  style={isActive ? { borderLeft: '2px solid #FF7020' } : { borderLeft: '2px solid transparent' }}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-[#FF7020]' : ''}`} />
                </button>
              )
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto flex flex-col gap-1 w-full">
            <button title="Settings" className="w-full flex justify-center py-3 text-[#9BA1A6] hover:text-white hover:bg-white/5 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button title="Logout" className="w-full flex justify-center py-3 text-[#9BA1A6] hover:text-white hover:bg-white/5 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-full flex justify-center py-4 text-[#FF7020]">
              <Zap className="w-5 h-5" fill="currentColor" />
            </div>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT AREA ═══ */}
        <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden">

          {/* Header Overlay */}
          <header className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <h1 className="text-2xl font-bold tracking-wide text-white drop-shadow-md">
                TheViralFinds: Unified Mega Workspace
              </h1>
              <p className="text-sm text-gray-300 mt-1 drop-shadow">
                Consolidating all TheViralFinds office sectors into a single, interconnected mega-workspace.
              </p>
            </div>
          </header>

          {/* ═══ LIVE PHASER CANVAS (Background + Agents all in one) ═══ */}
          <div className="absolute inset-0 z-0">
            <ErrorBoundary
              pageName="Shopee Office Game"
              fallback={
                <div className="absolute inset-0 bg-[#25262B]">
                  <IsometricOffice
                    agents={agents.map((agent) => ({
                      ...agent,
                      agentId: agent.id,
                    }))}
                    onSelectAgent={(id) => setSelectedAgent(id)}
                  />
                </div>
              }
            >
              <PhaserGame
                agents={agents}
                onAgentSelected={(id) => setSelectedAgent(id)}
                className="w-full h-full"
              />
            </ErrorBoundary>
          </div>

          <GameHud />

          {/* ═══ LEFT OVERLAY PANELS ═══ */}
          <div className="absolute left-6 top-24 bottom-6 w-80 flex flex-col gap-4 z-10 pointer-events-none">

            {/* Panel 1: Real-time Activity Monitor (Top) */}
            <HUDPanel>
              <h2 className="text-sm font-semibold text-white mb-2">Real-time Activity Monitor</h2>
              {activityEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`rounded p-2 flex items-center gap-3 ${
                    evt.color === 'yellow' ? 'bg-[#3A332A] border border-[#5A4525]' :
                    evt.color === 'red' ? 'bg-[#3A252A] border border-[#5A252D]' :
                    'opacity-50'
                  }`}
                >
                  {evt.color === 'yellow' && <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />}
                  {evt.color === 'red' && <Zap className="w-4 h-4 text-red-500 shrink-0" />}
                  {evt.color === 'gray' && <MessageCircle className="w-4 h-4 text-gray-400 shrink-0" />}
                  <span className={`text-xs font-medium tracking-wide ${
                    evt.color === 'yellow' ? 'text-yellow-200' :
                    evt.color === 'red' ? 'text-red-200' :
                    'text-gray-400'
                  }`}>
                    {evt.label}
                  </span>
                </div>
              ))}
            </HUDPanel>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Panel 2: Detailed Activity Monitor */}
            <HUDPanel>
              <h2 className="text-sm font-semibold text-white mb-2">Real-time Activity Monitor</h2>
              {detailedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`rounded p-2 flex flex-col justify-center ${
                    evt.color === 'orange' ? 'bg-[#3A332A] border border-[#5A4525]' :
                    'bg-[#3A252A] border border-[#5A252D]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 shrink-0 ${evt.color === 'orange' ? 'text-[#FF7020]' : 'text-red-500'}`} />
                    <span className={`text-xs font-medium tracking-wide ${evt.color === 'orange' ? 'text-[#FF7020]' : 'text-red-400'}`}>
                      {evt.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 ml-6">{evt.sub}</span>
                </div>
              ))}
            </HUDPanel>

            {/* Panel 3: Agent Conversation Panel */}
            <div className="pointer-events-auto rounded-lg overflow-hidden flex flex-col h-64"
                 style={{
                   background: 'rgba(45,46,51,0.95)',
                   backdropFilter: 'blur(12px)',
                   border: '1px solid #3F4045',
                   boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)',
                 }}>
              <div className="px-3 py-2 flex justify-between items-center"
                   style={{ background: 'rgba(32,33,37,0.8)', borderBottom: '1px solid #3F4045' }}>
                <h3 className="text-sm font-semibold text-white">Agent Conversation Panel</h3>
              </div>

              <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#FF7020] uppercase">{msg.agent}</span>
                      <span className="text-[9px] text-gray-500">{msg.time}</span>
                    </div>
                    <p className="text-xs text-gray-300">{msg.msg}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-3 flex gap-2 items-center"
                   style={{ borderTop: '1px solid #3F4045', background: 'rgba(32,33,37,0.5)' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all"
                  style={{ background: '#25262B', border: '1px solid #3F4045' }}
                  onFocus={(e) => { e.target.style.borderColor = '#FF7020' }}
                  onBlur={(e) => { e.target.style.borderColor = '#3F4045' }}
                />
                <button
                  aria-label="Send"
                  className="p-1.5 rounded transition-colors text-white hover:brightness-110"
                  style={{ background: '#FF7020' }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ═══ MINIMAP OVERLAY (Bottom-Right) ═══ */}
          <div className="absolute bottom-6 right-6 z-10 pointer-events-auto">
            <h3 className="text-sm font-semibold text-white mb-2 drop-shadow-md">Minimap Overlay</h3>
            <div className="rounded-lg p-2 w-72 h-48 relative overflow-hidden"
                 style={{
                   background: 'rgba(45,46,51,0.8)',
                   backdropFilter: 'blur(12px)',
                   border: '1px solid #3F4045',
                   boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)',
                 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/shopee-office/isometric-mega-hq.png"
                alt="Minimap"
                className="w-full h-full object-cover opacity-70 rounded contrast-125 saturate-50"
              />
              {/* Glowing Agent Markers */}
              {[
                { top: '25%', left: '25%' },
                { top: '50%', right: '25%' },
                { bottom: '25%', left: '50%' },
              ].map((pos, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
                  className="absolute w-4 h-4 rounded-full flex items-center justify-center"
                  style={{
                    ...pos,
                    background: '#FF7020',
                    boxShadow: '0 0 10px #FF7020',
                  } as React.CSSProperties}
                >
                  <Zap className="w-2.5 h-2.5 text-white" fill="currentColor" />
                </motion.div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </StudioProvider>
  )
}

/* ─── Reusable HUD Panel ─── */
function HUDPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="pointer-events-auto rounded-lg p-4 flex flex-col gap-2"
      style={{
        background: 'rgba(45,46,51,0.9)',
        backdropFilter: 'blur(4px)',
        border: '1px solid #3F4045',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </motion.div>
  )
}
