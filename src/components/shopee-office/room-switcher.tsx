'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface RoomSwitcherProps {
  activeRoom: string
  onRoomChange: (room: string) => void
}

export const RoomSwitcher = ({ activeRoom, onRoomChange }: RoomSwitcherProps) => {
  const rooms = [
    { id: 'office', name: 'MAIN OFFICE', icon: 'business' },
    { id: 'meeting', name: 'MEETING RM', icon: 'groups' },
    { id: 'pantry', name: 'PANTRY', icon: 'coffee' }
  ]

  return (
    <div className="flex gap-2 w-full">
      {rooms.map((room) => {
        const isActive = activeRoom === room.id
        return (
          <button
            key={room.id}
            onClick={() => onRoomChange(room.id)}
            className={`
              flex-1 group relative p-4 rounded-lg border transition-all duration-500 overflow-hidden
              ${isActive 
                ? 'bg-[#FF7020]/10 border-[#FF7020]/50 shadow-[0_0_20px_rgba(255,112,32,0.2)]' 
                : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
              }
            `}
          >
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className={`text-[9px] font-black tracking-[0.2em] uppercase transition-colors duration-500 ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                {room.name}
              </span>
            </div>

            {/* Active Glow Bar */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="room-active-glow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-[#FF7020]/10 to-transparent pointer-events-none"
                />
              )}
            </AnimatePresence>
          </button>
        )
      })}
    </div>
  )
}
