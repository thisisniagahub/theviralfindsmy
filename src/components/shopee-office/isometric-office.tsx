'use client'

import { motion } from 'framer-motion'

export function IsometricOffice({ agents, onSelectAgent }: { agents: any[], onSelectAgent: (id: string) => void }) {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center p-12">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[#0d0e11]" 
           style={{ backgroundImage: 'linear-gradient(rgba(238,77,45,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(238,77,45,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px' }} 
      />

      <svg viewBox="0 0 1000 700" className="w-full h-full drop-shadow-[0_0_50px_rgba(0,0,0,0.5)]">
         {/* Define Gradients & Filters */}
         <defs>
            <radialGradient id="dotGlow">
               <stop offset="0%" stopColor="#EE4D2D" stopOpacity="0.4" />
               <stop offset="100%" stopColor="#EE4D2D" stopOpacity="0" />
            </radialGradient>
            <filter id="neonBlur">
               <feGaussianBlur stdDeviation="2" result="blur" />
               <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
               </feMerge>
            </filter>
         </defs>

         {/* 1. Floor Plan (Main Base) */}
         <path d="M500 100 L950 350 L500 600 L50 350 Z" fill="#14151a" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
         
         {/* 2. Room Dividers (Based on the Mega HQ Layout) */}
         {/* Line separating Office from Hallway */}
         <path d="M500 100 L500 600" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
         {/* Line separating Meeting Room from Hallway */}
         <path d="M725 225 L275 475" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />

         {/* 3. Zone Labels */}
         <g className="opacity-30">
            <text x="300" y="250" fill="white" fontSize="10" fontWeight="bold" className="uppercase tracking-[0.3em]">Office_Zone</text>
            <text x="700" y="250" fill="white" fontSize="10" fontWeight="bold" className="uppercase tracking-[0.3em]">Meeting_Room</text>
            <text x="450" y="550" fill="white" fontSize="10" fontWeight="bold" className="uppercase tracking-[0.3em]">Hallway_E2</text>
         </g>

         {/* 4. Agents / Operational Points (Matched to Image positions) */}
         {agents.map((agent, i) => {
            // Position agents in specific "Workstations" or "Rooms"
            const positions = [
               { x: 300, y: 300, room: 'Office' },
               { x: 750, y: 350, room: 'Meeting Room' },
               { x: 500, y: 450, room: 'Hallway' },
               { x: 600, y: 250, room: 'Meeting Room' },
            ]
            const pos = positions[i % positions.length]
            const isActive = agent.status !== 'idle'

            return (
               <g 
                  key={agent.agentId} 
                  className="cursor-pointer group/agent"
                  onClick={() => onSelectAgent(agent.agentId)}
               >
                  {/* Glow under active agent */}
                  {isActive && (
                    <circle cx={pos.x} cy={pos.y} r="60" fill="url(#dotGlow)" className="animate-pulse" />
                  )}

                  {/* Marker Dot (The actual 'presence' point) */}
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r="4" 
                    fill={isActive ? '#EE4D2D' : '#333'} 
                    filter="url(#neonBlur)"
                  />
                  
                  {/* Avatar & Tooltip HUD (Matched to Holo-Tooltip Strategy) */}
                  <g className="translate-y-[-40px]">
                     <rect 
                        x={pos.x - 40} y={pos.y - 30} width="80" height="24" 
                        rx="4" fill="rgba(27,28,30,0.8)" stroke="rgba(255,255,255,0.1)"
                        className="group-hover/agent:fill-white group-hover/agent:stroke-[#EE4D2D] transition-colors"
                     />
                     <text 
                        x={pos.x} y={pos.y - 14} textAnchor="middle" 
                        fill="white" fontSize="8" fontWeight="black" 
                        className="pointer-events-none group-hover/agent:fill-black font-mono transition-colors"
                     >
                        {agent.name.toUpperCase()}
                     </text>
                     <text 
                        x={pos.x + 45} y={pos.y - 20} 
                        fill="#EE4D2D" fontSize="16"
                        className="animate-bounce"
                     >
                        {agent.emoji}
                     </text>
                  </g>

                  {/* Operational Link Line (Simulating data path) */}
                  {isActive && (
                    <path 
                       d={`M${pos.x} ${pos.y} L${pos.x + 40} ${pos.y - 80}`}
                       stroke="rgba(238,77,45,0.2)" strokeWidth="0.5" strokeDasharray="2 2"
                    />
                  )}
               </g>
            )
         })}
      </svg>

      {/* 5. Decorative Isometric Elements (Mocking Furniture/Servers) */}
      <div className="absolute top-[20%] left-[15%] w-16 h-16 border border-white/5 rotate-[30deg] skew-x-[-30deg] bg-white/5" />
      <div className="absolute top-[40%] right-[20%] w-24 h-12 border border-white/5 rotate-[30deg] skew-x-[-30deg] bg-white/5" />
      <div className="absolute bottom-[20%] left-[40%] w-32 h-32 border border-white/5 rotate-[30deg] skew-x-[-30deg] bg-[#EE4D2D]/5 flex items-center justify-center">
         <div className="w-16 h-16 border border-[#EE4D2D]/20 animate-spin-slow" />
      </div>
    </div>
  )
}
