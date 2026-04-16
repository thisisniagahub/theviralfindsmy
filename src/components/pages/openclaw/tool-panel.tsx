'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Zap, Copy, Search, PenTool, TrendingUp, BarChart3, Users, Eye, Target, Calendar, Stethoscope, Activity, Brain, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MCPTool {
  name: string; description: string; category: string; status: string;
  version: string; executionCount: number; lastExecuted: string | null;
}

interface ToolPanelProps {
  tools: MCPTool[]
  activeCategory: string
  onCategoryChange: (category: string) => void
  onToolExecute: (toolName: string, inputs: Record<string, string>) => void
  executingTool: string | null
  toolResults: Record<string, string>
  onCopyResult: (text: string, id: string) => void
}

type ToolConfig = {
  icon: LucideIcon; color: string; bg: string;
  fields: { key: string; label: string; type: string; placeholder: string; required?: boolean; options?: string[] }[]
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
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
  { id: 'all', label: 'All Tools', icon: '🔧' },
  { id: 'research', label: 'Research', icon: '🔍' },
  { id: 'content', label: 'Content', icon: '✍️' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'optimization', label: 'Optimization', icon: '⚡' },
  { id: 'monitoring', label: 'Monitoring', icon: '👁️' },
]

export function ToolPanel({
  tools, activeCategory, onCategoryChange, onToolExecute,
  executingTool, toolResults, onCopyResult,
}: ToolPanelProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [toolInputs, setToolInputs] = useState<Record<string, string>>({})

  const filteredTools = activeCategory === 'all' ? tools : tools.filter(t => t.category === activeCategory)

  const handleExecute = (toolName: string) => {
    const config = TOOL_CONFIGS[toolName]
    if (config) {
      setSelectedTool(toolName)
      setToolInputs({})
      return
    }
    onToolExecute(toolName, {})
  }

  const submitToolExecution = () => {
    if (!selectedTool) return
    const config = TOOL_CONFIGS[selectedTool]
    if (!config) { onToolExecute(selectedTool, {}); return }

    const missingRequired = config.fields.filter(f => f.required && !toolInputs[f.key]?.trim())
    if (missingRequired.length > 0) {
      toast.error('Missing required fields', { description: missingRequired.map(f => f.label).join(', ') })
      return
    }
    onToolExecute(selectedTool, toolInputs)
    setSelectedTool(null)
    setToolInputs({})
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <Badge
            key={cat.id} variant={activeCategory === cat.id ? 'default' : 'outline'}
            className={cn('cursor-pointer text-xs', activeCategory === cat.id && 'bg-shopee hover:bg-shopee/80')}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.icon} {cat.label}
          </Badge>
        ))}
      </div>

      {/* Tool List */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => (
          <Card key={tool.name} className="border-border/50 hover:border-shopee/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{tool.name.replace(/_/g, ' ')}</CardTitle>
              <CardDescription className="text-xs line-clamp-2">{tool.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant={tool.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                  {tool.status}
                </Badge>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleExecute(tool.name)} disabled={executingTool === tool.name}>
                    <Zap className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {toolResults[tool.name] && (
                <div className="mt-2 relative">
                  <pre className="text-[10px] bg-muted p-2 rounded max-h-32 overflow-auto">
                    {toolResults[tool.name].substring(0, 500)}...
                  </pre>
                  <Button size="sm" variant="ghost" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => onCopyResult(toolResults[tool.name], tool.name)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tool Execution Dialog */}
      <Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-shopee" />
              {selectedTool?.replace(/_/g, ' ')}
            </DialogTitle>
            <DialogDescription>Configure parameters and execute the tool</DialogDescription>
          </DialogHeader>
          {selectedTool && TOOL_CONFIGS[selectedTool] && (
            <div className="space-y-3">
              {TOOL_CONFIGS[selectedTool].fields.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
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
                <Button className="flex-1 text-xs btn-shopee gap-1" onClick={submitToolExecution}>
                  <Zap className="w-3 h-3" /> Execute
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
