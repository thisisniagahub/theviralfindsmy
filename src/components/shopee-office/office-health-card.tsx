'use client'

import { motion } from 'framer-motion'

export function OfficeHealthCard({ agents, isPaused }: { agents: any[], isPaused: boolean }) {
  const activeCount = agents.filter(a => a.status !== 'idle').length
  const totalTasks = agents.reduce((sum, a) => sum + (a.tasksCompleted || 0), 0)
  
  return (
    <div className="flex flex-col gap-6 p-6 bg-[#0f1117] rounded-3xl border border-white/5 shadow-2xl">
      {/* Efficiency Ring */}
      <div className="flex justify-center py-4">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle cx="64" cy="64" r="58" className="stroke-white/5 fill-none" strokeWidth="8" />
            <motion.circle 
              cx="64" cy="64" r="58" 
              className="stroke-[#EE4D2D] fill-none" 
              strokeWidth="8" 
              strokeDasharray="364"
              initial={{ strokeDashoffset: 364 }}
              animate={{ strokeDashoffset: 364 - (364 * 0.85) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-black text-white leading-none">85<span className="text-sm opacity-50">%</span></span>
            <span className="text-[8px] font-black text-zinc-500 tracking-[0.2em] mt-1">EFFICIENCY</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Active Fleet</span>
          <div className="flex items-end gap-1">
             <span className="text-xl font-black text-white leading-none">{activeCount}</span>
             <span className="text-[9px] font-black text-emerald-500 mb-0.5">/ {agents.length}</span>
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Total Output</span>
          <div className="flex items-end gap-1">
             <span className="text-xl font-black text-white leading-none">{totalTasks}</span>
             <span className="text-[9px] font-black text-zinc-500 mb-0.5">TASKS</span>
          </div>
        </div>
      </div>

      {/* Operational State */}
      <div className="mt-2 flex items-center justify-between p-3 bg-[#EE4D2D]/5 rounded-2xl border border-[#EE4D2D]/10">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-[#EE4D2D] animate-pulse shadow-[0_0_8px_#EE4D2D]" />
           <span className="text-[10px] font-black text-white uppercase tracking-tighter">System Nominal</span>
        </div>
        <span className="text-[9px] font-mono text-[#EE4D2D] font-bold">MODE: PERFORMANCE</span>
      </div>
    </div>
  )
}
