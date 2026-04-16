'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Zap, Send, Sparkles, Server, Network, Radio, Bot, Puzzle, Grid,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ToolPanel, AgentRegistry, PluginPanel, InsightsPanel, ProtocolHub,
} from '@/components/pages/openclaw'

// ============================================================
// Types
// ============================================================

interface MCPTool {
  name: string; description: string; category: string; status: string;
  version: string; executionCount: number; lastExecuted: string | null;
}

interface A2AAgent {
  id: string; name: string; description: string; capabilities: string[];
  status: string; category: string; tasksCompleted: number; version: string;
}

interface MCPPlugin {
  name: string; version: string; author: string; description: string; tools: string[];
}

// ============================================================
// Main Component
// ============================================================

export function OpenClawPage() {
  const [activeTab, setActiveTab] = useState('tools')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showOrchestrateDialog, setShowOrchestrateDialog] = useState(false)
  const [orchestrateTask, setOrchestrateTask] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [toolResults, setToolResults] = useState<Record<string, string>>({})
  const [showAgentDialog, setShowAgentDialog] = useState<string | null>(null)
  const [agentMessage, setAgentMessage] = useState('')

  const queryClient = useQueryClient()

  // Data fetching
  const { data: mcpTools = [], isLoading: mcpLoading } = useQuery<MCPTool[]>({
    queryKey: ['mcp-tools'],
    queryFn: () => fetch('/api/openclaw/mcp-proxy?path=/tools').then(r => r.json()).then(d => d.tools || []),
    refetchInterval: 30000,
  })

  const { data: mcpStatus } = useQuery({
    queryKey: ['mcp-status'],
    queryFn: () => fetch('/api/openclaw/mcp-proxy?path=/status').then(r => r.json()),
    refetchInterval: 15000,
  })

  const { data: a2aAgents = [], isLoading: a2aLoading } = useQuery<A2AAgent[]>({
    queryKey: ['a2a-agents'],
    queryFn: () => fetch('/api/openclaw/a2a-proxy?path=/agents').then(r => r.json()).then(d => d.agents || []),
    refetchInterval: 30000,
  })

  const { data: a2aStatus } = useQuery({
    queryKey: ['a2a-status'],
    queryFn: () => fetch('/api/openclaw/a2a-proxy?path=/status').then(r => r.json()),
    refetchInterval: 15000,
  })

  const { data: mcpPlugins = [] } = useQuery<MCPPlugin[]>({
    queryKey: ['mcp-plugins'],
    queryFn: () => fetch('/api/openclaw/mcp-proxy?path=/plugins').then(r => r.json()).then(d => d.plugins || []),
  })

  const mcpOnline = !mcpStatus?.error
  const a2aOnline = !a2aStatus?.error

  // Tool execution
  const handleToolExecute = useCallback(async (toolName: string, inputs: Record<string, string>) => {
    try {
      const params: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(inputs)) {
        if (v) {
          const num = Number(v)
          params[k] = !isNaN(num) && v !== '' ? num : v
        }
      }
      const res = await fetch('/api/openclaw/mcp-proxy?path=/tools/' + toolName + '/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: `exec_${Date.now()}`, params }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error('Execution failed', { description: data.error.message })
      } else {
        const text = data.result?.content?.[0]?.text || JSON.stringify(data.result, null, 2)
        setToolResults(prev => ({ ...prev, [toolName]: text }))
        toast.success(`${toolName} completed`, { description: 'View results below' })
        queryClient.invalidateQueries({ queryKey: ['mcp-tools'] })
      }
    } catch {
      toast.error('Failed to execute tool', { description: 'MCP Server may be offline' })
    }
  }, [queryClient])

  // Copy to clipboard
  const handleCopyResult = useCallback((text: string, _id: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }, [])

  // Send message to agent
  const handleAgentMessage = useCallback(async (agentId: string) => {
    setShowAgentDialog(agentId)
    setAgentMessage('')
  }, [])

  const submitAgentMessage = useCallback(async () => {
    if (!agentMessage.trim() || !showAgentDialog) return
    try {
      const res = await fetch('/api/openclaw/a2a-proxy?path=/agents/' + showAgentDialog + '/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', payload: { message: agentMessage }, priority: 'medium' }),
      })
      const data = await res.json()
      if (data.response) {
        toast.success(`Response from ${showAgentDialog}`, { description: data.response.substring(0, 100) + '...' })
      }
      queryClient.invalidateQueries({ queryKey: ['a2a-agents'] })
    } catch {
      toast.error('Failed to send message')
    }
    setShowAgentDialog(null)
    setAgentMessage('')
  }, [agentMessage, showAgentDialog, queryClient])

  // Toggle agent activation (placeholder)
  const handleToggleAgent = useCallback((_agentId: string) => {
    toast.info('Agent toggle - integrate with your agent management API')
  }, [])

  // Orchestration
  const handleOrchestrate = useCallback(async () => {
    if (!orchestrateTask.trim() || selectedAgents.length === 0) return
    try {
      const res = await fetch('/api/openclaw/a2a-proxy?path=/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: orchestrateTask, agents: selectedAgents, sequential: true, priority: 'high' }),
      })
      const data = await res.json()
      toast.success('Orchestration completed!', { description: `${selectedAgents.length} agents executed` })
      setToolResults(prev => ({ ...prev, orchestrate: JSON.stringify(data, null, 2) }))
    } catch {
      toast.error('Orchestration failed')
    }
    setShowOrchestrateDialog(false)
  }, [orchestrateTask, selectedAgents])

  return (
    <div className="space-y-6">
      {/* ===== HERO BANNER ===== */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-shopee/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-shopee to-orange-400 shadow-lg shadow-shopee/30">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    <span className="text-gradient-shopee">OpenClaw</span> <span className="text-base font-normal text-gray-400">Advanced Intelligence Hub</span>
                  </h1>
                  <p className="text-xs text-gray-500">MCP + A2A + ACP Protocol Suite - OpenClaw Gateway</p>
                </div>
              </div>
              {/* Protocol Status Indicators */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { name: 'MCP Server', port: 'Gateway', online: mcpOnline, icon: Server, color: mcpOnline ? 'text-emerald-400' : 'text-red-400', tools: (mcpStatus as Record<string, unknown>)?.tools ? ((mcpStatus as Record<string, unknown>).tools as Record<string, number>).total || 11 : 11 },
                  { name: 'A2A Agents', port: 'Gateway', online: a2aOnline, icon: Network, color: a2aOnline ? 'text-blue-400' : 'text-red-400', tools: (a2aStatus as Record<string, unknown>)?.onlineAgents || 5 },
                  { name: 'ACP Client', port: 'Local', online: true, icon: Radio, color: 'text-purple-400', tools: 'Active' },
                ].map(p => (
                  <div key={p.name} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="relative">
                      <p.icon className={cn('w-4 h-4', p.color)} />
                      <span className={cn('absolute -top-1 -right-1 w-2 h-2 rounded-full', p.online ? 'bg-emerald-400 badge-pulse' : 'bg-red-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{p.name}</p>
                      <p className="text-[10px] text-gray-500">:{p.port} - {typeof p.tools === 'number' ? p.tools + ' tools' : p.tools}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== MAIN TABS ===== */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full h-auto gap-1 p-1 bg-muted/50">
          {[
            { id: 'tools', icon: Grid, label: 'AI Tools' },
            { id: 'protocol', icon: Radio, label: 'Protocol Hub' },
            { id: 'agents', icon: Bot, label: 'Agent Network' },
            { id: 'plugins', icon: Puzzle, label: 'Plugins' },
          ].map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5 text-xs py-2 data-[state=active]:bg-shopee data-[state=active]:text-white">
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ===== TAB 1: AI TOOLS ===== */}
        <TabsContent value="tools" className="space-y-4 mt-4">
          {mcpLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : (
            <ToolPanel
              tools={mcpTools}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onToolExecute={handleToolExecute}
              executingTool={null}
              toolResults={toolResults}
              onCopyResult={handleCopyResult}
            />
          )}
        </TabsContent>

        {/* ===== TAB 2: PROTOCOL HUB ===== */}
        <TabsContent value="protocol" className="mt-4">
          <ProtocolHub
            status={{
              mcpOnline,
              mcpStatus: mcpStatus as Record<string, unknown> | null,
              a2aOnline,
              a2aStatus: a2aStatus as Record<string, unknown> | null,
              mcpToolsCount: mcpTools.length,
              a2aAgentsCount: a2aAgents.length,
            }}
          />
        </TabsContent>

        {/* ===== TAB 3: AGENT NETWORK ===== */}
        <TabsContent value="agents" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Active Agents</h3>
            <Button size="sm" className="btn-shopee text-xs gap-1" onClick={() => { setShowOrchestrateDialog(true); setSelectedAgents([]); setOrchestrateTask('') }}>
              <Sparkles className="w-3 h-3" /> Orchestrate
            </Button>
          </div>

          {a2aLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
            </div>
          ) : (
            <AgentRegistry
              agents={a2aAgents}
              onMessageAgent={handleAgentMessage}
              onToggleAgent={handleToggleAgent}
              activeAgents={selectedAgents}
            />
          )}
        </TabsContent>

        {/* ===== TAB 4: PLUGINS ===== */}
        <TabsContent value="plugins" className="mt-4">
          <PluginPanel plugins={mcpPlugins} />
        </TabsContent>
      </Tabs>

      {/* ===== AI INSIGHTS SECTION ===== */}
      <InsightsPanel />

      {/* ===== AGENT MESSAGE DIALOG ===== */}
      <Dialog open={!!showAgentDialog} onOpenChange={() => setShowAgentDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-500" />
              Message {showAgentDialog?.replace(/-/g, ' ')}
            </DialogTitle>
            <DialogDescription>Send a query to this A2A agent</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Ask anything about Shopee affiliate marketing..." value={agentMessage} onChange={e => setAgentMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitAgentMessage()} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowAgentDialog(null)}>Cancel</Button>
              <Button className="flex-1 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={submitAgentMessage} disabled={!agentMessage.trim()}>
                <Send className="w-3 h-3" /> Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== ORCHESTRATE DIALOG ===== */}
      <Dialog open={showOrchestrateDialog} onOpenChange={() => setShowOrchestrateDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-shopee" />
              Multi-Agent Orchestration
            </DialogTitle>
            <DialogDescription>Select agents and describe the task for coordinated execution</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {a2aAgents.map((agent) => (
                <Badge key={agent.id} variant={selectedAgents.includes(agent.id) ? 'default' : 'outline'}
                  className={cn('text-[10px] cursor-pointer', selectedAgents.includes(agent.id) && 'bg-blue-600 hover:bg-blue-700')}
                  onClick={() => setSelectedAgents(prev => prev.includes(agent.id) ? prev.filter(a => a !== agent.id) : [...prev, agent.id])}>
                  {agent.name.replace(/-/g, ' ')}
                </Badge>
              ))}
            </div>
            <Input placeholder="Describe the task..." value={orchestrateTask} onChange={e => setOrchestrateTask(e.target.value)} />
            <Button className="w-full text-xs btn-shopee gap-1" disabled={!orchestrateTask.trim() || selectedAgents.length === 0} onClick={handleOrchestrate}>
              <Sparkles className="w-3 h-3" /> Execute ({selectedAgents.length} agents)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}