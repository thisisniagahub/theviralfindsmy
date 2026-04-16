'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export function MinimapOverlay({ agents, activeRoom }: { agents: any[], activeRoom: string }) {
  const zones = {
    office: { x: 20, y: 20, color: 'bg-red-500' },
    meeting: { x: 70, y: 30, color: 'bg-purple-500' },
    pantry: { x: 40, y: 70, color: 'bg-orange-500' },
    hall: { x: 80, y: 75, color: 'bg-blue-500' }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
           <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Office</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
           <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Meeting Room</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
           <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Pantry</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
           <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Hall</span>
        </div>
      </div>

      {/* Map Content */}
      <div className="relative h-32 bg-white/5 rounded-xl overflow-hidden border border-white/5 p-4">
        {/* Agent Dots */}
        {agents.map((agent, i) => {
          const zoneKey = agent.zone || 'office'
          const zone = (zones as any)[zoneKey] || zones.office
          const jitterX = (i % 3) * 6
          const jitterY = Math.floor(i / 3) * 6
          
          return (
            <motion.div
              key={agent.agentId}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute w-4 h-4 rounded-full flex items-center justify-center"
              style={{
                left: `${zone.x + jitterX}%`,
                top: `${zone.y + jitterY}%`,
                background: '#FF7020',
                boxShadow: '0 0 10px #FF7020',
              }}
            >
              <Zap className="w-2.5 h-2.5 text-white" fill="currentColor" />
            </motion.div>
          )
        })}

        {/* Active View Highlight */}
        <div 
          className="absolute inset-0 border-2 border-[#FF7020] opacity-10 pointer-events-none rounded-xl"
          style={{ 
            clipPath: activeRoom === 'office' ? 'inset(0 50% 50% 0)' : activeRoom === 'meeting' ? 'inset(0 0 50% 50%)' : 'inset(50% 0 0 0)' 
          }}
        />
      </div>
    </div>
  )
}
