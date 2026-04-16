import { gameEvents } from './events'
import type { WorkerManager } from './systems/WorkerManager'
import type { AgentStatus } from '../types'

/**
 * SceneEventBridge
 * Bridges React UI events and Phaser-side game logic.
 */
export function initSceneEventBridge(
  workerManager: WorkerManager,
  onAgentSelected?: (agentId: string) => void,
  onStatusUpdate?: (agentId: string, status: AgentStatus) => void,
): () => void {
  const unsubs: Array<() => void> = []

  // React → Phaser: Task assigned from UI
  unsubs.push(gameEvents.on('task-assigned', (taskId, message, agentId) => {
    const worker = workerManager.findBySeatId(agentId) || workerManager.findIdle()
    if (worker) {
      worker.currentTaskMessage = message
      worker.assignedRunId = taskId
      worker.setStatus('executing')
      worker.showBubble(`📋 ${message}`)
    }
  }))

  // React → Phaser: Task completed from external API/SDK
  unsubs.push(gameEvents.on('task-completed', (runId) => {
    const worker = workerManager.workers.find(w => w.assignedRunId === runId)
    if (worker) {
      worker.assignedRunId = null
      worker.currentTaskMessage = null
      worker.setStatus('idle')
      worker.showBubble('✅ Task completed!')
    }
  }))
  
  // React → Phaser & Phaser → React: Status update sync
  unsubs.push(gameEvents.on('agent-status-changed', (agentId, status) => {
    // 1. If triggered from React, update Phaser worker state
    const worker = workerManager.findBySeatId(agentId)
    if (worker && worker.status !== status) {
      worker.setStatus(status)
    }

    // 2. Notify React UI if status changed in Phaser
    onStatusUpdate?.(agentId, status)
  }))

  // Phaser → React: Agent selected in game world
  unsubs.push(gameEvents.on('agent-selected', (agentId) => {
    onAgentSelected?.(agentId)
  }))

  return () => {
    for (const u of unsubs) u()
  }
}
