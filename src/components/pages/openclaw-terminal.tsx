'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Activity, Search, Box, Heart, Zap, Network, ArrowRight, Globe } from 'lucide-react'

export function OpenClawTerminal() {
  const [status, setStatus] = useState<any>(null)

  const [logs, setLogs] = useState([
    { time: '14:20:01', type: 'SYSTEM', color: 'text-emerald-400', content: 'Initializing Neural Core... SUCCESS' },
    { time: '14:20:05', type: 'TRACE', color: 'text-shopee-orange', content: 'Scanning shopee.com.my/trends...' },
    { time: '14:21:12', type: 'NETWORK', color: 'text-cyan-400', content: 'Payload delivered to upstream_vault_01' },
    { time: '14:21:45', type: 'SUCCESS', color: 'text-emerald-400', content: 'Session context pinned to operator.gangniaga.my' }
  ])

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/openclaw/mcp-proxy?path=/status')
        if (res.ok) setStatus(await res.json())
      } catch (err) {}
    }
    fetchStatus()
    const int = setInterval(fetchStatus, 15000)
    return () => clearInterval(int)
  }, [])

  useEffect(() => {
    const streamPoller = setInterval(async () => {
       const now = new Date()
       const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
       if (Math.random() > 0.5) {
         setLogs(prev => [...prev, { time: timeStr, type: 'HEARTBEAT', color: 'text-cyan-400', content: 'Syncing with operator...' }].slice(-20))
       } else {
         setLogs(prev => [...prev, { time: timeStr, type: 'ROUTINE', color: 'text-purple-400', content: 'Re-evaluating pathing priorities...' }].slice(-20))
       }
    }, 8000)
    return () => clearInterval(streamPoller)
  }, [])

  return (
    <div className="bg-[#121315] text-[#e3e2e5] font-sans selection:bg-shopee-orange/30 selection:text-white relative overflow-hidden rounded-xl border border-white/10"
         style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-shopee-orange/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="p-6 relative z-10 w-full">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-[#1b1c1e]/60 backdrop-blur-md p-5 rounded-xl border-l-2 border-emerald-500 shadow-xl relative overflow-hidden group border-y border-r border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity size={40} className="text-emerald-500" />
            </div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Gateway Latency</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold text-emerald-400 tracking-tighter">{status?.connection?.latencyMs || 24}ms</h2>
              <span className="text-[10px] text-emerald-500/50 font-bold tracking-widest">{status?.connection?.status === 'healthy' ? 'STABLE' : 'UNSTABLE'}</span>
            </div>
          </motion.div>

          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="bg-[#1b1c1e]/60 backdrop-blur-md p-5 rounded-xl border-l-2 border-cyan-400 shadow-xl relative overflow-hidden group border-y border-r border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck size={40} className="text-cyan-400" />
            </div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Circuit Breaker</p>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-[#e3e2e5] tracking-tighter">{status?.health?.breakerState || 'CLOSED'}</h2>
              <ShieldCheck size={20} className="text-emerald-400" />
            </div>
          </motion.div>

          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="bg-[#1b1c1e]/60 backdrop-blur-md p-5 rounded-xl border-l-2 border-shopee-orange shadow-xl relative overflow-hidden group border-y border-r border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Network size={40} className="text-shopee-orange" />
            </div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Active Sessions</p>
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold text-[#e3e2e5] tracking-tighter">{status?.health?.metrics?.activeSessions || 8}/12</h2>
              <div className="flex-1 h-1.5 bg-[#292a2c] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-shopee-orange to-orange-400 w-[66%]"></div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <section className="lg:col-span-8 flex flex-col h-[500px]">
             <div className="bg-[#292a2c]/80 backdrop-blur-sm p-3 rounded-t-xl flex justify-between items-center px-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-4">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-zinc-300 tracking-widest">LOG_FEED_ACTIVE</span>
                </div>
                <span className="text-[10px] font-mono text-shopee-orange animate-pulse font-bold tracking-widest">LIVE CONNECTED</span>
             </div>
             
             <div className="bg-[#0d0e10]/95 flex-1 rounded-b-xl p-6 font-mono text-xs overflow-y-auto shadow-2xl border border-[#292a2c] custom-scrollbar flex flex-col justify-end">
                <div className="space-y-3 opacity-90 pb-2">
                  {logs.map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-4">
                      <span className="text-zinc-600 truncate min-w-[70px]">{log.time}</span>
                      <span className={`${log.color} min-w-[80px]`}>[{log.type}]</span>
                      <span className="text-[#e3e2e5] break-words">{log.content}</span>
                    </motion.div>
                  ))}
                  
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 items-center mt-4">
                    <span className="text-zinc-600 truncate min-w-[70px]">NOW</span>
                    <span className="text-cyan-400 min-w-[80px] animate-pulse">_</span>
                  </motion.div>
                </div>
             </div>
          </section>

          <section className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-[0.2em] px-1 mb-2">Agent Native Tools</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Crawler', icon: Globe, desc: 'Web discovery engine.', color: 'text-cyan-400' },
                { name: 'Spawn', icon: Box, desc: 'Parallel session generator.', color: 'text-emerald-400' },
                { name: 'Research', icon: Search, desc: 'Trend analyzer.', color: 'text-shopee-orange' },
                { name: 'Sentiment', icon: Heart, desc: 'Market mood detector.', color: 'text-purple-400' },
              ].map((tool, i) => (
                <button key={i} className="bg-[#1f2022] p-5 rounded-xl border border-white/5 hover:border-white/20 hover:bg-[#292a2c] transition-all group text-left relative overflow-hidden">
                  <div className={`absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-opacity ${tool.color}`}>
                    <tool.icon size={50} />
                  </div>
                  <tool.icon size={20} className={`${tool.color} mb-4`} />
                  <h4 className="font-bold text-sm text-[#e3e2e5]">{tool.name}</h4>
                  <p className="text-[10px] text-zinc-500 leading-tight mt-1">{tool.desc}</p>
                </button>
              ))}
            </div>

            <motion.div whileHover={{ scale: 1.02 }} className="mt-4 bg-gradient-to-br from-[#fd5837] to-[#EE4D2D] p-6 rounded-xl shadow-[0_0_30px_rgba(238,77,45,0.3)] cursor-pointer group">
              <div className="flex justify-between items-start mb-6">
                <Zap size={28} className="text-white" fill="currentColor" />
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ArrowRight size={16} className="text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold font-mono text-white mb-1">Execute Logic Gate</h3>
              <p className="text-xs text-white/80 font-medium">Initialize autonomous decision chain based on live market signals.</p>
            </motion.div>
          </section>

        </div>
      </main>
    </div>
  )
}
