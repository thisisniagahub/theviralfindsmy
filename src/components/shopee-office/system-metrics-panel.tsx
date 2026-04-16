'use client'

import { motion } from 'framer-motion'

export function SystemMetricsPanel() {
  const metrics = [
    { label: 'CPU USAGE', value: '42%', progress: 42, color: 'bg-[#EE4D2D]' },
    { label: 'MEMORY', value: '6.4 / 16GB', progress: 40, color: 'bg-emerald-500' },
    { label: 'GATEWAY LATENCY', value: '18ms', progress: 18, color: 'bg-cyan-500' },
    { label: 'API SUCCESS RATE', value: '99.8%', progress: 99.8, color: 'bg-purple-500' }
  ]

  return (
    <div className="space-y-4">
      {metrics.map((m) => (
        <div key={m.label} className="space-y-1.5 font-mono">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-zinc-500 tracking-widest">{m.label}</span>
            <span className="text-[11px] font-bold text-white">{m.value}</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${m.progress}%` }}
              className={`h-full ${m.color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`}
            />
          </div>
        </div>
      ))}
      
      {/* Network Pulse */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-black text-zinc-400 tracking-tighter uppercase">Gateway Node: VPS-SG-01</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-500">UPTIME: 14D 02H</span>
      </div>
    </div>
  )
}
