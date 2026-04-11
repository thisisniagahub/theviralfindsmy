'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical, Eye, EyeOff, Settings2, X } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WIDGET_REGISTRY, type WidgetDef } from '@/lib/widget-registry'

// ===== Sortable Widget Item =====
function SortableWidgetItem({
  widget,
  onToggle,
}: {
  widget: { id: string; enabled: boolean; order: number }
  onToggle: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: widget.id })
  const def = WIDGET_REGISTRY.find(w => w.id === widget.id)

  if (!def) return null

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Icon + Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{def.title}</p>
        <p className="text-xs text-muted-foreground truncate">{def.description}</p>
      </div>

      {/* Category Badge */}
      <Badge variant="secondary" className="text-[10px] capitalize">{def.category}</Badge>

      {/* Toggle */}
      <button
        onClick={() => onToggle(widget.id)}
        className="p-1.5 rounded-md hover:bg-muted transition-colors"
        aria-label={widget.enabled ? 'Hide widget' : 'Show widget'}
      >
        {widget.enabled ? (
          <Eye className="w-4 h-4 text-green-500" />
        ) : (
          <EyeOff className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </div>
  )
}

// ===== Widget Customizer Panel =====
interface WidgetCustomizerProps {
  config: Array<{ id: string; enabled: boolean; order: number }>
  onSave: (config: Array<{ id: string; enabled: boolean; order: number }>) => void
  onClose: () => void
}

export function WidgetCustomizer({ config, onSave, onClose }: WidgetCustomizerProps) {
  const [widgets, setWidgets] = useState(config.sort((a, b) => a.order - b.order))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setWidgets(prev => {
      const oldIndex = prev.findIndex(w => w.id === active.id)
      const newIndex = prev.findIndex(w => w.id === over.id)
      const newOrder = arrayMove(prev, oldIndex, newIndex)
      return newOrder.map((w, i) => ({ ...w, order: i }))
    })
  }, [])

  const handleToggle = useCallback((id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w))
  }, [])

  const handleSave = useCallback(() => {
    onSave(widgets.map((w, i) => ({ ...w, order: i })))
  }, [widgets, onSave])

  const handleReset = useCallback(() => {
    const defaults = WIDGET_REGISTRY.map(w => ({ id: w.id, enabled: w.defaultEnabled, order: w.defaultOrder }))
    setWidgets(defaults.sort((a, b) => a.order - b.order))
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Customize Dashboard</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            Drag to reorder • Toggle eye to show/hide
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence>
                {widgets.map(widget => (
                  <SortableWidgetItem
                    key={widget.id}
                    widget={widget}
                    onToggle={handleToggle}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border gap-3">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset to Default
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} className="bg-shopee hover:bg-shopee-dark">
              Save Layout
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
