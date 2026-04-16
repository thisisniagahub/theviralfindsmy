'use client'

export interface MemoData {
  title: string
  date: string
  summary: {
    completedTasks: number
    errorCount: number
  }
  content: string
}

export function MemoPanel({ memo, isLoading }: { memo: MemoData | null, isLoading: boolean }) {
  if (isLoading) return <div className="p-8 text-center text-zinc-500 animate-pulse font-mono text-xs tracking-widest">DECRYPTING MEMO...</div>
  if (!memo) return <div className="p-8 text-center text-zinc-600 font-mono text-xs">NO OPERATIONAL DATA FOR THIS CYCLE.</div>

  return (
    <div className="flex flex-col h-full">
      {/* Header Info */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white tracking-tight">{memo.title.toUpperCase()}</h3>
          <span className="text-[10px] font-mono text-zinc-500">{memo.date} // OPERATIONAL_CYCLE_04</span>
        </div>
        <div className="px-3 py-1 bg-[#EE4D2D]/10 rounded-full border border-[#EE4D2D]/20">
           <span className="text-[9px] font-black text-[#EE4D2D] tracking-widest uppercase">Verified Report</span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="space-y-1">
           <span className="text-[9px] font-black text-zinc-600 tracking-widest uppercase">Output</span>
           <div className="text-xl font-bold text-white font-mono">{memo.summary.completedTasks}</div>
        </div>
        <div className="space-y-1">
           <span className="text-[9px] font-black text-zinc-600 tracking-widest uppercase">Incidents</span>
           <div className="text-xl font-bold text-red-500 font-mono">{memo.summary.errorCount}</div>
        </div>
        <div className="space-y-1">
           <span className="text-[9px] font-black text-zinc-600 tracking-widest uppercase">Success</span>
           <div className="text-xl font-bold text-emerald-500 font-mono">98.4%</div>
        </div>
      </div>

      {/* Main Content (Formatted for high density) */}
      <div className="flex-1 overflow-y-auto pr-4 space-y-4 no-scrollbar">
        {memo.content.split('\n').filter(l => l.trim()).map((line, i) => (
          <div key={i} className="flex gap-4">
             <div className="w-1 h-auto bg-white/5 rounded-full" />
             <p className="text-zinc-400 text-xs leading-relaxed font-medium">
               {line.replace(/^## |- /g, '')}
             </p>
          </div>
        ))}
      </div>

      {/* Footer / Signature */}
      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-50">
         <span className="text-[9px] font-mono text-zinc-500 underline decoration-zinc-700 underline-offset-4 cursor-help">NIAGABOT_SYSTEM_V4.0.12</span>
         <div className="flex items-center gap-2">
            <div className="w-8 h-[1px] bg-zinc-700" />
            <span className="text-[10px] font-black text-zinc-400 italic">SYSTEM_AUTH_READY</span>
         </div>
      </div>
    </div>
  )
}
