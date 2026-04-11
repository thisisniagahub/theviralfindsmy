'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Send, ChevronRight, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface TerminalMessage {
  id: string
  type: 'input' | 'output' | 'system' | 'error'
  content: string
  timestamp: number
}

export function CommandTerminal() {
  const [messages, setMessages] = useState<TerminalMessage[]>([
    { id: 'sys-1', type: 'system', content: 'Shopee Office Terminal v7.0 — Type "help" for commands', timestamp: Date.now() },
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on click
  const handleCardClick = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const processCommand = useCallback(async (cmd: string) => {
    setIsProcessing(true)

    // Simulate command processing
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))

    const lower = cmd.toLowerCase().trim()
    let response: string

    if (lower === 'help') {
      response = `Available commands:
  help          — Show this help message
  status        — Check system status
  agents        — List active agents
  health        — Gateway health check
  links         — Show link statistics
  clear         — Clear terminal
  exit          — Close terminal`
    } else if (lower === 'status') {
      response = `System Status: ONLINE
  OpenClaw Gateway: Connected
  Notification Service: Running
  Database: Connected
  Uptime: ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`
    } else if (lower === 'agents') {
      response = `Active Agents: 8/8
  • product-scout    [IDLE]
  • content-writer   [WRITING]
  • seo-optimizer    [EXECUTING]
  • analytics-agent  [RESEARCHING]
  • link-builder     [IDLE]
  • campaign-master  [SYNCING]
  • review-monitor   [REPORTING]
  • payout-checker   [IDLE]`
    } else if (lower === 'health') {
      response = `Gateway Health: HEALTHY
  Latency: ${Math.floor(Math.random() * 100 + 20)}ms
  Uptime: 99.9%
  Active Connections: ${Math.floor(Math.random() * 50 + 10)}`
    } else if (lower === 'links') {
      response = `Link Statistics:
  Total Links: 42
  Active: 38 | Paused: 3 | Expired: 1
  Total Clicks: 12,500
  Conversions: 380
  Earnings: RM 3,250.50`
    } else if (lower === 'clear') {
      setMessages([])
      setIsProcessing(false)
      return
    } else if (lower === 'exit') {
      setMessages(prev => [...prev, { id: `sys-${Date.now()}`, type: 'system', content: 'Terminal closed.', timestamp: Date.now() }])
      setIsProcessing(false)
      return
    } else if (lower.startsWith('echo ')) {
      response = lower.slice(5)
    } else {
      response = `Command not found: "${cmd}". Type "help" for available commands.`
    }

    setMessages(prev => [...prev, { id: `out-${Date.now()}`, type: 'output', content: response, timestamp: Date.now() }])
    setIsProcessing(false)
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const cmd = input.trim()
    setMessages(prev => [...prev, { id: `in-${Date.now()}`, type: 'input', content: cmd, timestamp: Date.now() }])
    setInput('')
    processCommand(cmd)
  }, [input, isProcessing, processCommand])

  return (
    <Card className="glass-card card-accent cursor-text" onClick={handleCardClick}>
      <CardContent className="p-3">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-foreground">Command Terminal</span>
          <div className="flex-1" />
          <Badge variant="secondary" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            ACTIVE
          </Badge>
        </div>

        {/* Terminal Output */}
        <div
          ref={terminalRef}
          className="h-32 overflow-y-auto font-mono text-[11px] space-y-1 mb-2 p-2 rounded-lg bg-black/30"
          style={{ scrollbarWidth: 'thin' }}
        >
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${
                  msg.type === 'input' ? 'text-cyan-400' :
                  msg.type === 'error' ? 'text-red-400' :
                  msg.type === 'system' ? 'text-yellow-400' :
                  'text-green-400'
                } whitespace-pre-wrap`}
              >
                {msg.type === 'input' && <span className="text-muted-foreground">$ </span>}
                {msg.content}
              </motion.div>
            ))}
          </AnimatePresence>

          {isProcessing && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>

        {/* Terminal Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <ChevronRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-foreground placeholder:text-muted-foreground"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
          >
            <Send className="w-3 h-3 text-cyan-400" />
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
