'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { CheckCircle, Puzzle } from 'lucide-react'
import { toast } from 'sonner'

interface MCPPlugin {
  name: string; version: string; author: string; description: string; tools: string[];
}

interface PluginPanelProps {
  plugins: MCPPlugin[]
}

export function PluginPanel({ plugins }: PluginPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plugins.map((plugin, idx) => (
          <motion.div key={plugin.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
            <Card className="glass-card h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold">{plugin.name}</h4>
                    <p className="text-[10px] text-muted-foreground">v{plugin.version} by {plugin.author}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle className="w-3 h-3 mr-1" /> Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{plugin.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {plugin.tools.map((tool) => (
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
    </div>
  )
}