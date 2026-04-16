'use client'

import React from 'react'
import { Package, Activity, Timer, MessageSquare, Map } from 'lucide-react'

interface ToolbarItemProps {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
}

const ToolbarItem = ({ icon, label, isActive, onClick }: ToolbarItemProps) => {
  // Split long labels to display on 2 lines matching the mockup
  const words = label.split(' ')
  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ')
  const line2 = words.slice(Math.ceil(words.length / 2)).join(' ')

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center px-4 py-2 h-[4.5rem] min-w-[100px] transition-all duration-300 hover:bg-white/5 active:scale-95 border-r border-white/5 last:border-r-0 ${
        isActive ? 'bg-white/10' : ''
      }`}
    >
      <div className={`mb-1 transition-colors ${isActive ? 'text-shopee-orange' : 'text-slate-400 group-hover:text-white'}`}>
        {icon}
      </div>
      <div className="flex flex-col items-center">
        <span className={`text-[9px] font-medium leading-tight text-center tracking-wider uppercase transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
          {line1}
        </span>
        {line2 && (
          <span className={`text-[9px] font-medium leading-tight text-center tracking-wider uppercase transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
            {line2}
          </span>
        )}
      </div>
      {/* Active Indicator Line */}
      {isActive && (
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-shopee-orange" />
      )}
    </button>
  )
}

export const OfficeToolbar = () => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-[#1E293B]/90 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-40">
      <ToolbarItem icon={<Package size={20} />} label="Consumables Stock" />
      <ToolbarItem icon={<Activity size={20} />} label="Real-time Activity Monitor" isActive />
      <ToolbarItem icon={<Timer size={20} />} label="Break Timer" />
      <ToolbarItem icon={<MessageSquare size={20} />} label="Agent Conversation Panel" />
      <ToolbarItem icon={<Map size={20} />} label="Minimap Overlay" />
    </div>
  )
}
