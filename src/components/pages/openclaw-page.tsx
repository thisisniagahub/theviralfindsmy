'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Zap, Search, Brain, TrendingUp, Users, Stethoscope, Calendar, PenTool,
  BarChart3, Target, Activity, Plug, Bot, Network,
  RefreshCw, CheckCircle, AlertTriangle,
  Eye, Send, Sparkles, Wifi, WifiOff, Server, Puzzle,
  Radio, Copy, Check, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
// Tool Definitions
// ============================================================

const TOOL_CONFIGS: Record<string, { icon: LucideIcon; color: string; bg: string; fields: { key: string; label: string; type: string; placeholder: string; required?: boolean; options?: string[] }[] }> = {
  trending_scanner: {
    icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    fields: [{ key: 'category', label: 'Category', type: 'select', placeholder: 'all', required: true, options: ['all', 'electronics', 'fashion', 'beauty', 'home', 'health'] }, { key: 'limit', label: 'Results Limit', type: 'number', placeholder: '10' }],
  },
  keyword_research: {
    icon: Search, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    fields: [{ key: 'seedKeyword', label: 'Seed Keyword', type: 'text', placeholder: 'wireless earbuds', required: true }, { key: 'depth', label: 'Depth', type: 'select', placeholder: 'basic', options: ['basic', 'deep', 'exhaustive'] }],
  },
  market_research: {
    icon: BarChart3, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    fields: [{ key: 'niche', label: 'Market Niche', type: 'text', placeholder: 'wireless earbuds Malaysia', required: true }, { key: 'timeframe', label: 'Timeframe', type: 'select', placeholder: '30d', options: ['7d', '30d', '90d', '6m', '1y'] }],
  },
  content_writer: {
    icon: PenTool, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/20',
    fields: [
      { key: 'contentType', label: 'Content Type', type: 'select', placeholder: 'social-post', required: true, options: ['product-description', 'social-post', 'blog-article', 'email-subject', 'ad-copy'] },
      { key: 'productName', label: 'Product Name', type: 'text', placeholder: 'TWS Wireless Earbuds Pro', required: true },
      { key: 'tone', label: 'Tone', type: 'select', placeholder: 'casual', options: ['professional', 'casual', 'enthusiastic', 'urgent'] },
      { key: 'platform', label: 'Platform', type: 'select', placeholder: 'shopee', options: ['shopee', 'instagram', 'tiktok', 'facebook', 'blog', 'email'] },
    ],
  },
  competitor_analyzer: {
    icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20',
    fields: [{ key: 'competitorShop', label: 'Competitor Shop', type: 'text', placeholder: 'TechGuruMY', required: true }, { key: 'metrics', label: 'Metrics', type: 'select', placeholder: 'all', options: ['pricing', 'reviews', 'listing-quality', 'all'] }],
  },
  review_analyzer: {
    icon: Eye, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20',
    fields: [{ key: 'productUrl', label: 'Product URL', type: 'text', placeholder: 'https://shopee.com.my/product/...', required: true }, { key: 'focusArea', label: 'Focus', type: 'select', placeholder: 'all', options: ['sentiment', 'features', 'complaints', 'all'] }],
  },
  seo_optimizer: {
    icon: Target, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/20',
    fields: [{ key: 'productTitle', label: 'Product Title', type: 'text', placeholder: 'Current product title...', required: true }, { key: 'targetKeywords', label: 'Target Keywords', type: 'text', placeholder: 'wireless, earbuds, bluetooth' }],
  },
  smart_scheduler: {
    icon: Calendar, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/20',
    fields: [{ key: 'platform', label: 'Platform', type: 'select', placeholder: 'all', required: true, options: ['instagram', 'tiktok', 'facebook', 'twitter', 'all'] }, { key: 'contentType', label: 'Content Type', type: 'select', placeholder: 'all', options: ['product-post', 'story', 'reel', 'carousel', 'all'] }],
  },
  ad_optimizer: {
    icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/20',
    fields: [{ key: 'totalBudget', label: 'Daily Budget (RM)', type: 'number', placeholder: '50', required: true }, { key: 'objective', label: 'Objective', type: 'select', placeholder: 'balanced', options: ['max-conversions', 'max-clicks', 'max-revenue', 'balanced'] }],
  },
  link_doctor: {
    icon: Stethoscope, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/20',
    fields: [{ key: 'links', label: 'Affiliate Links', type: 'text', placeholder: 'link1, link2, link3', required: true }],
  },
  price_tracker: {
    icon: Activity, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/20',
    fields: [{ key: 'productIds', label: 'Product IDs', type: 'text', placeholder: '12345, 67890', required: true }, { key: 'alertThreshold', label: 'Alert Threshold (%)', type: 'number', placeholder: '15' }],
  },
  ai_insights: {
    icon: Brain, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/20',
    fields: [{ key: 'dataRange', label: 'Data Range', type: 'select', placeholder: '30d', required: true, options: ['7d', '30d', '90d', 'all'] }, { key: 'focusAreas', label: 'Focus', type: 'select', placeholder: 'all', options: ['earnings', 'traffic', 'conversions', 'growth', 'all'] }],
  },
}

const CATEGORIES = [
  { id: 'all', label: 'All Tools', icon: Grid },
  { id: 'research', label: 'Research', color: 'bg-emerald-500' },
  { id: 'content', label: 'Content', color: 'bg-violet-500' },
  { id: 'analytics', label: 'Analytics', color: 'bg-blue-500' },
  { id: 'optimization', label: 'Optimization', color: 'bg-amber-500' },
  { id: 'intelligence', label: 'Intelligence', color: 'bg-rose-500' },
]

function Grid(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
}

// ============================================================
// Main Component
// ============================================================

export function OpenClawPage() {
  const [activeTab, setActiveTab] = useState('tools')
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [executingTool, setExecutingTool] = useState<string | null>(null)
  const [toolResults, setToolResults] = useState<Record<string, string>>({})
  const [toolInputs, setToolInputs] = useState<Record<string, string>>({})
  const [showAgentDialog, setShowAgentDialog] = useState<string | null>(null)
  const [agentMessage, setAgentMessage] = useState('')
  const [showOrchestrateDialog, setShowOrchestrateDialog] = useState(false)
  const [orchestrateTask, setOrchestrateTask] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [aiInsights, setAiInsights] = useState<{ type: string; message: string; impact: string }[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

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

  // Tool execution via MCP
  const executeTool = useCallback(async (toolName: string, inputs: Record<string, string>) => {
    setExecutingTool(toolName)
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
        toast.success(`✅ ${toolName} completed`, { description: 'View results below' })
        queryClient.invalidateQueries({ queryKey: ['mcp-tools'] })
      }
    } catch {
      toast.error('Failed to execute tool', { description: 'MCP Server may be offline' })
    }
    setExecutingTool(null)
  }, [queryClient])

  // AI content generation (direct LLM, bypasses MCP)
  const contentMutation = useMutation({
    mutationFn: (body: Record<string, string>) => fetch('/api/openclaw/ai-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.success) {
        setToolResults(prev => ({ ...prev, content_writer: JSON.stringify(data, null, 2) }))
        toast.success('Content generated!', { description: `${data.wordCount} words, ${data.hashtags?.length || 0} hashtags` })
      } else {
        toast.error('Content generation failed', { description: data.error })
      }
      setExecutingTool(null)
    },
    onError: () => { toast.error('Failed to generate content'); setExecutingTool(null) },
  })

  // AI insights
  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true)
    try {
      const res = await fetch('/api/openclaw/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalClicks: 3847, totalEarnings: 2847.50, conversionRate: 4.2,
          activeLinks: 15, topCategory: 'Electronics',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAiInsights(data.insights || [])
        toast.success('AI Insights refreshed')
      }
    } catch {
      toast.error('Failed to fetch insights')
    }
    setInsightsLoading(false)
  }, [])

  // Send message to agent
  const sendAgentMessage = useCallback(async (agentId: string, message: string) => {
    if (!message.trim()) return
    try {
      const res = await fetch('/api/openclaw/a2a-proxy?path=/agents/' + agentId + '/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', payload: { message }, priority: 'medium' }),
      })
      const data = await res.json()
      if (data.response) {
        toast.success(`Response from ${agentId}`, { description: data.response.substring(0, 100) + '...' })
      }
      queryClient.invalidateQueries({ queryKey: ['a2a-agents'] })
    } catch {
      toast.error('Failed to send message')
    }
    setShowAgentDialog(null)
    setAgentMessage('')
  }, [queryClient])

  // Copy to clipboard
  const copyText = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Copied!')
    setTimeout(() => setCopied(null), 2000)
  }, [])

  // Handle tool dialog submit
  const handleToolExecute = useCallback((toolName: string) => {
    const config = TOOL_CONFIGS[toolName]
    if (!config) return
    const missingRequired = config.fields.filter(f => f.required && !toolInputs[f.key]?.trim())
    if (missingRequired.length > 0) {
      toast.error('Missing required fields', { description: missingRequired.map(f => f.label).join(', ') })
      return
    }
    // Special handling for content_writer (uses real LLM)
    if (toolName === 'content_writer') {
      setExecutingTool(toolName)
      contentMutation.mutate({
        contentType: toolInputs.contentType || 'social-post',
        productName: toolInputs.productName || '',
        tone: toolInputs.tone || 'casual',
        platform: toolInputs.platform || 'shopee',
      })
    } else {
      executeTool(toolName, toolInputs)
    }
    setSelectedTool(null)
    setToolInputs({})
  }, [toolInputs, contentMutation, executeTool])

  // Filter tools by category
  const filteredTools = activeCategory === 'all' ? mcpTools : mcpTools.filter((t: MCPTool) => t.category === activeCategory)

  return (
    <div className="space-y-6">
      {/* ===== HERO BANNER ===== */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-shopee/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-shopee to-orange-400 shadow-lg shadow-shopee/30">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    <span className="text-gradient-shopee">OpenClaw</span> <span className="text-base font-normal text-gray-400">Advanced Intelligence Hub</span>
                  </h1>
                  <p className="text-xs text-gray-500">MCP + A2A + ACP Protocol Suite • OpenClaw Gateway</p>
                </div>
              </div>
              {/* Protocol Status Indicators */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { name: 'MCP Server', port: 'Gateway', online: mcpOnline, icon: Server, color: mcpOnline ? 'text-emerald-400' : 'text-red-400', tools: mcpStatus?.tools?.total || 11 },
                  { name: 'A2A Agents', port: 'Gateway', online: a2aOnline, icon: Network, color: a2aOnline ? 'text-blue-400' : 'text-red-400', tools: a2aStatus?.onlineAgents || 5 },
                  { name: 'ACP Client', port: 'Local', online: true, icon: Radio, color: 'text-purple-400', tools: 'Active' },
                ].map(p => (
                  <div key={p.name} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="relative">
                      <p.icon className={cn('w-4 h-4', p.color)} />
                      <span className={cn('absolute -top-1 -right-1 w-2 h-2 rounded-full', p.online ? 'bg-emerald-400 badge-pulse' : 'bg-red-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{p.name}</p>
                      <p className="text-[10px] text-gray-500">:{p.port} • {typeof p.tools === 'number' ? p.tools + ' tools' : p.tools}</p>
                    </div>
                    {p.online ? <Wifi className="w-3.5 h-3.5 text-emerald-400/60" /> : <WifiOff className="w-3.5 h-3.5 text-red-400/60" />}
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
            { id: 'tools', icon: Brain, label: 'AI Tools' },
            { id: 'protocol', icon: Plug, label: 'Protocol Hub' },
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
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <Button key={cat.id} size="sm" variant={activeCategory === cat.id ? 'default' : 'outline'}
                className={cn('text-xs h-8', activeCategory === cat.id && 'bg-shopee hover:bg-shopee-dark text-white')}
                onClick={() => setActiveCategory(cat.id)}>
                {cat.id !== 'all' && <span className={cn('w-2 h-2 rounded-full mr-1', cat.color)} />}
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Tools Grid */}
          {mcpLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredTools.map((tool: MCPTool, idx: number) => {
                  const config = TOOL_CONFIGS[tool.name]
                  if (!config) return null
                  const Icon = config.icon
                  const hasResult = !!toolResults[tool.name]
                  const isExecuting = executingTool === tool.name

                  return (
                    <motion.div key={tool.name} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, delay: idx * 0.04 }}>
                      <Card className={cn('card-tilt glass-card cursor-pointer group h-full transition-all', hasResult && 'border-emerald-500/30')}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className={cn('p-2.5 rounded-xl', config.bg)}>
                              <Icon className={cn('w-5 h-5', config.color)} />
                            </div>
                            <div className="flex items-center gap-1.5">
                              {hasResult && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                              <Badge variant="secondary" className="text-[9px] capitalize">{tool.category}</Badge>
                            </div>
                          </div>
                          <h3 className="text-sm font-bold text-foreground mb-1 group-hover:text-shopee transition-colors">{tool.name.replace(/_/g, ' ')}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{tool.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">v{tool.version} • {tool.executionCount} runs</span>
                            <Button size="sm" className={cn('text-xs h-7 gap-1', isExecuting ? '' : 'btn-shopee')} disabled={isExecuting} onClick={() => { setToolInputs({}); setSelectedTool(tool.name) }}>
                              {isExecuting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                              {isExecuting ? 'Running...' : 'Execute'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Tool Results */}
          {Object.keys(toolResults).length > 0 && (
            <Card className="glass-card border-shopee/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-shopee" />
                    Execution Results
                  </CardTitle>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setToolResults({}); toast.info('Results cleared') }}>
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {Object.entries(toolResults).map(([name, result]) => (
                  <motion.div key={name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-shopee">{name.replace(/_/g, ' ')}</span>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => copyText(result, name)}>
                        {copied === name ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-40 overflow-y-auto">{result}</pre>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== TAB 2: PROTOCOL HUB ===== */}
        <TabsContent value="protocol" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* MCP Protocol */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className={cn('glass-card h-full', mcpOnline ? 'border-emerald-500/30' : 'border-red-500/30')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-500" />
                      MCP Protocol
                    </CardTitle>
                    <span className={cn('w-2.5 h-2.5 rounded-full', mcpOnline ? 'bg-emerald-500 badge-pulse' : 'bg-red-500')} />
                  </div>
                  <CardDescription className="text-[10px]">Model Context Protocol v2024-11-05</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mcpOnline && mcpStatus ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Tools', value: mcpStatus.tools?.total || 0 },
                          { label: 'Active', value: mcpStatus.tools?.active || 0 },
                          { label: 'Plugins', value: mcpStatus.plugins?.total || 0 },
                          { label: 'Executions', value: mcpStatus.tools?.totalExecutions || 0 },
                        ].map(s => (
                          <div key={s.label} className="p-2 rounded-lg bg-muted/20 text-center">
                            <p className="text-lg font-bold text-foreground">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] text-muted-foreground space-y-1">
                        <p>⏱️ Uptime: {mcpStatus.server?.uptimeFormatted || '—'}</p>
                        <p>💾 Memory: {mcpStatus.server?.memoryUsage || '—'}</p>
                        <p>🔗 WS Clients: {mcpStatus.server?.currentClients || 0}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <WifiOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">MCP Server offline</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* A2A Protocol */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className={cn('glass-card h-full', a2aOnline ? 'border-blue-500/30' : 'border-red-500/30')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Network className="w-4 h-4 text-blue-500" />
                      A2A Protocol
                    </CardTitle>
                    <span className={cn('w-2.5 h-2.5 rounded-full', a2aOnline ? 'bg-blue-500 badge-pulse' : 'bg-red-500')} />
                  </div>
                  <CardDescription className="text-[10px]">Agent-to-Agent Protocol v1.0</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {a2aOnline && a2aStatus ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Agents', value: a2aStatus.agentCount || 0 },
                          { label: 'Online', value: a2aStatus.onlineAgents || 0 },
                          { label: 'Conversations', value: a2aStatus.activeConversations || 0 },
                          { label: 'Messages', value: a2aStatus.totalMessagesProcessed || 0 },
                        ].map(s => (
                          <div key={s.label} className="p-2 rounded-lg bg-muted/20 text-center">
                            <p className="text-lg font-bold text-foreground">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] text-muted-foreground space-y-1">
                        <p>⏱️ Uptime: {a2aStatus.uptime || '—'}</p>
                        <p>📡 Protocol: {a2aStatus.protocol || 'A2A/1.0'}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <WifiOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">A2A Service offline</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ACP Protocol */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="glass-card border-purple-500/30 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Radio className="w-4 h-4 text-purple-500" />
                      ACP Protocol
                    </CardTitle>
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 badge-pulse" />
                  </div>
                  <CardDescription className="text-[10px]">Agent Communication Protocol</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Status', value: 'Active' },
                      { label: 'Clients', value: '1' },
                      { label: 'Messages', value: mcpTools.length },
                      { label: 'Agents', value: a2aAgents.length },
                    ].map(s => (
                      <div key={s.label} className="p-2 rounded-lg bg-muted/20 text-center">
                        <p className="text-lg font-bold text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-1">
                    <p>🔗 Connection: Local Bridge</p>
                    <p>📡 Format: JSON-RPC 2.0</p>
                    <p>🔒 Security: Token-based</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Protocol Info */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <h4 className="font-semibold text-emerald-500 mb-1">MCP — Model Context Protocol</h4>
                  <p className="text-muted-foreground">Connects AI models to external tools and data sources via OpenClaw Gateway. Provides structured tool definitions, input validation, and JSON-RPC execution. 11 tools registered across 5 categories.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-500 mb-1">A2A — Agent-to-Agent Protocol</h4>
                  <p className="text-muted-foreground">Enables multi-agent communication and orchestration. Agents discover each other, exchange messages, and coordinate tasks through a standardized protocol.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-500 mb-1">ACP — Agent Communication Protocol</h4>
                  <p className="text-muted-foreground">Bridges AI agents with client applications. Manages the communication layer between the frontend interface and the backend AI services.</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {a2aAgents.map((agent: A2AAgent, idx: number) => (
                <motion.div key={agent.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                  <Card className="glass-card hover:border-blue-500/30 transition-colors group h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">{agent.name.replace(/-/g, ' ')}</h4>
                            <Badge variant="secondary" className="text-[9px] capitalize">{agent.category}</Badge>
                          </div>
                        </div>
                        <span className={cn('w-2 h-2 rounded-full', agent.status === 'online' ? 'bg-emerald-500 badge-pulse' : 'bg-gray-400')} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{agent.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(agent.capabilities || []).slice(0, 3).map((cap: string) => (
                          <Badge key={cap} variant="outline" className="text-[9px] px-1.5 py-0">{cap}</Badge>
                        ))}
                        {(agent.capabilities || []).length > 3 && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">+{(agent.capabilities.length - 3)}</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{agent.tasksCompleted} tasks • v{agent.version}</span>
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => { setShowAgentDialog(agent.id); setAgentMessage('') }}>
                          <Send className="w-3 h-3" /> Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== TAB 4: PLUGINS ===== */}
        <TabsContent value="plugins" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mcpPlugins.map((plugin: MCPPlugin, idx: number) => (
              <motion.div key={plugin.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                <Card className="glass-card h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold">{plugin.name}</h4>
                        <p className="text-[10px] text-muted-foreground">v{plugin.version} • by {plugin.author}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{plugin.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(plugin.tools || []).map((tool: string) => (
                        <Badge key={tool} variant="outline" className="text-[9px] px-1.5 py-0">{tool.replace(/_/g, ' ')}</Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="text-xs w-full" onClick={() => toast.info('Plugin marketplace coming soon!')}>
                      <Puzzle className="w-3 h-3 mr-1" /> Configure
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="p-8 text-center">
              <Puzzle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-sm font-semibold mb-1">Extend with Plugins</h4>
              <p className="text-xs text-muted-foreground mb-3">Install community plugins or create your own to extend OpenClaw capabilities.</p>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info('Plugin marketplace coming soon!')}>
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== AI INSIGHTS SECTION ===== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass-card border-shopee/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-shopee" />
                AI Insights
                <Badge variant="secondary" className="text-[9px] bg-shopee/10 text-shopee border-0">Powered by LLM</Badge>
              </CardTitle>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={fetchInsights} disabled={insightsLoading}>
                <RefreshCw className={cn('w-3 h-3', insightsLoading && 'animate-spin')} />
                {insightsLoading ? 'Analyzing...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {aiInsights.length > 0 ? (
              <div className="space-y-2.5">
                {aiInsights.map((insight, idx) => {
                  const colors: Record<string, string> = { opportunity: '#22C55E', warning: '#F59E0B', success: '#3B82F6', tip: '#8B5CF6' }
                  const icons: Record<string, LucideIcon> = { opportunity: TrendingUp, warning: AlertTriangle, success: CheckCircle, tip: Sparkles }
                  const Icon = icons[insight.type] || Brain
                  return (
                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30" style={{ borderLeft: `3px solid ${colors[insight.type] || '#EE4D2D'}` }}>
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors[insight.type] }} />
                      <p className="text-sm text-foreground flex-1">{insight.message}</p>
                      <Badge variant="secondary" className={cn('text-[10px] flex-shrink-0', insight.impact === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : insight.impact === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400')}>
                        {insight.impact}
                      </Badge>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Brain className="w-10 h-10 text-shopee/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Click &quot;Refresh&quot; to get AI-powered insights</p>
                <Button size="sm" className="btn-shopee text-xs" onClick={fetchInsights} disabled={insightsLoading}>
                  <Sparkles className="w-3 h-3 mr-1" /> Generate Insights
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== TOOL EXECUTION DIALOG ===== */}
      <Dialog open={!!selectedTool} onOpenChange={() => { setSelectedTool(null); setToolInputs({}) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTool && (() => { const c = TOOL_CONFIGS[selectedTool]; const I = c?.icon || Zap; return <I className="w-4 h-4 text-shopee" /> })()}
              {selectedTool?.replace(/_/g, ' ')}
            </DialogTitle>
            <DialogDescription>Configure parameters and execute the tool via MCP protocol</DialogDescription>
          </DialogHeader>
          {selectedTool && TOOL_CONFIGS[selectedTool] && (
            <div className="space-y-3">
              {TOOL_CONFIGS[selectedTool].fields.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                  {field.type === 'select' ? (
                    <select value={toolInputs[field.key] || ''} onChange={e => setToolInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                      <option value="">Select...</option>
                      {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <Input placeholder={field.placeholder} value={toolInputs[field.key] || ''} onChange={e => setToolInputs(prev => ({ ...prev, [field.key]: e.target.value }))} />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 text-xs" onClick={() => setSelectedTool(null)}>Cancel</Button>
                <Button className="flex-1 text-xs btn-shopee gap-1" onClick={() => handleToolExecute(selectedTool)}>
                  <Zap className="w-3 h-3" /> Execute
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <Input placeholder="Ask anything about Shopee affiliate marketing..." value={agentMessage} onChange={e => setAgentMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && showAgentDialog && sendAgentMessage(showAgentDialog, agentMessage)} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowAgentDialog(null)}>Cancel</Button>
              <Button className="flex-1 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => showAgentDialog && sendAgentMessage(showAgentDialog, agentMessage)} disabled={!agentMessage.trim()}>
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
              {a2aAgents.map((agent: A2AAgent) => (
                <Badge key={agent.id} variant={selectedAgents.includes(agent.id) ? 'default' : 'outline'}
                  className={cn('text-[10px] cursor-pointer', selectedAgents.includes(agent.id) && 'bg-blue-600 hover:bg-blue-700')}
                  onClick={() => setSelectedAgents(prev => prev.includes(agent.id) ? prev.filter(a => a !== agent.id) : [...prev, agent.id])}>
                  {agent.name.replace(/-/g, ' ')}
                </Badge>
              ))}
            </div>
            <Input placeholder="Describe the task..." value={orchestrateTask} onChange={e => setOrchestrateTask(e.target.value)} />
            <Button className="w-full text-xs btn-shopee gap-1" disabled={!orchestrateTask.trim() || selectedAgents.length === 0}
              onClick={async () => {
                try {
                  const res = await fetch('/api/openclaw/a2a-proxy?path=/orchestrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ task: orchestrateTask, agents: selectedAgents, sequential: true, priority: 'high' }),
                  })
                  const data = await res.json()
                  toast.success('Orchestration completed!', { description: `${selectedAgents.length} agents executed` })
                  setToolResults(prev => ({ ...prev, orchestrate: JSON.stringify(data, null, 2) }))
                } catch { toast.error('Orchestration failed') }
                setShowOrchestrateDialog(false)
              }}>
              <Sparkles className="w-3 h-3" /> Execute ({selectedAgents.length} agents)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
