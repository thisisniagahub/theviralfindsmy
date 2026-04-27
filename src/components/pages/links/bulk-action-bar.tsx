'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PlayCircle, PauseCircle, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BulkActionBarProps {
  selectedCount: number
  onActivate: () => void
  onPause: () => void
  onDelete: () => void
  onClear: () => void
  isActivatingPending: boolean
  isPausingPending: boolean
  isDeletingPending: boolean
}

export function BulkActionBar({
  selectedCount, onActivate, onPause, onDelete, onClear,
  isActivatingPending, isPausingPending, isDeletingPending,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
        >
          <div className="glass-card-shopee rounded-xl px-4 py-3 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-shopee/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-shopee">{selectedCount}</span>
                </div>
                <span className="text-sm font-medium truncate">
                  {selectedCount} link{selectedCount > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                  onClick={onActivate}
                  disabled={isActivatingPending}
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Activate</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs gap-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-950"
                  onClick={onPause}
                  disabled={isPausingPending}
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pause</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs gap-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                  onClick={onDelete}
                  disabled={isDeletingPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
                <Separator orientation="vertical" className="h-6 mx-0.5" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={onClear}
                  aria-label="Clear selection"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
