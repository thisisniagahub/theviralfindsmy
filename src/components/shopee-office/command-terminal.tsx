'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export function CommandTerminal() {
  const [history, setHistory] = useState<string[]>([
    '> OPENCLAW GATEWAY INITIALIZED...',
    '> CONNECTING TO VPS-SG-01...',
    '> SOCKET ESTABLISHED [PING 14MS]',
    '> AGENT HANDSHAKE SUCCESSFUL'
  ])
  const [input, setInput] = useState('')

  return (
    <div className="flex flex-col h-full font-mono text-[10px] bg-black/40 rounded-xl overflow-hidden border border-white/5">
      {/* Scrollable output */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 no-scrollbar">
        {history.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3"
          >
            <span className="text-zinc-600 font-black">{new Date().toLocaleTimeString([], { hour12: false })}</span>
            <span className={line.startsWith('>') ? 'text-zinc-400' : 'text-[#EE4D2D]'}>{line}</span>
          </motion.div>
        ))}
        {/* Cursor animation */}
        <div className="flex gap-3">
          <span className="text-zinc-600 font-black">{new Date().toLocaleTimeString([], { hour12: false })}</span>
          <div className="flex items-center gap-1">
             <span className="text-[#EE4D2D] font-black">{'>'}</span>
             <motion.div 
               animate={{ opacity: [0, 1, 0] }}
               transition={{ duration: 1, repeat: Infinity }}
               className="w-1.5 h-3 bg-[#EE4D2D]"
             />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 py-3 bg-white/5 border-t border-white/5 flex gap-2">
         <span className="text-[#EE4D2D] font-black">LOGIN@ROOT:~$</span>
         <input 
           type="text"
           value={input}
           onChange={(e) => setInput(e.target.value)}
           className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder:text-zinc-700"
           placeholder="Execute network command..."
         />
      </div>
    </div>
  )
}
