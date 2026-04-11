'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard, Search } from 'lucide-react'

interface ShortcutGroup {
  title: string
  shortcuts: { keys: string[]; description: string }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'L'], description: 'Go to Links' },
      { keys: ['G', 'A'], description: 'Go to Analytics' },
      { keys: ['G', 'C'], description: 'Go to Campaigns' },
      { keys: ['G', 'E'], description: 'Go to Earnings' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['N'], description: 'Create new affiliate link' },
      { keys: ['?'], description: 'Toggle this shortcuts panel' },
      { keys: ['Esc'], description: 'Close modals / cancel' },
    ],
  },
  {
    title: 'Agent Office',
    shortcuts: [
      { keys: ['W', 'A', 'S', 'D'], description: 'Move boss character' },
      { keys: ['↑', '←', '↓', '→'], description: 'Move boss (arrows)' },
      { keys: ['E'], description: 'Interact with nearby agent' },
      { keys: ['H'], description: 'Toggle shortcuts overlay' },
      { keys: ['Shift', 'Click'], description: 'Drag to pan camera' },
      { keys: ['Scroll'], description: 'Zoom in/out' },
    ],
  },
  {
    title: 'Dashboard',
    shortcuts: [
      { keys: ['R'], description: 'Refresh dashboard data' },
      { keys: ['E'], description: 'Export as CSV' },
      { keys: ['P'], description: 'Print / Export as PDF' },
    ],
  },
]

interface KeyboardShortcutsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsPanel({ isOpen, onClose }: KeyboardShortcutsPanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-2xl rounded-xl border border-border bg-card shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-muted transition-colors"
                aria-label="Close shortcuts"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search hint */}
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground border-b border-border">
              <Search className="w-3 h-3" />
              Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">Ctrl+K</kbd> for command palette
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SHORTCUT_GROUPS.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-sm font-semibold text-foreground mb-3">{group.title}</h3>
                    <div className="space-y-2">
                      {group.shortcuts.map((shortcut, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {shortcut.keys.map((key, kIdx) => (
                              <span key={kIdx}>
                                <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-muted border border-border rounded shadow-sm min-w-[24px] text-center inline-block">
                                  {key}
                                </kbd>
                                {kIdx < shortcut.keys.length - 1 && (
                                  <span className="text-muted-foreground mx-0.5">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-3 text-center text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">?</kbd> to toggle this panel
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
