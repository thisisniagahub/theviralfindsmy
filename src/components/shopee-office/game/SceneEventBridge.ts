import { gameEvents } from './events'
import type { Worker } from './entities/Worker'
import type { WorkerManager } from './systems/WorkerManager'

/**
 * SceneEventBridge
 * Bridges React UI events and Phaser-side game logic.
 */
export function initSceneEventBridge(
  workerManager: WorkerManager,
  onAgentSelected?: (agentId: string) => void,
  onAgentStatusChanged?: (agentId: string, status: string) => void,
): () => void {
  const unsubs: Array<() => void> = []

  // React → Phaser: Task assigned from UI
  unsubs.push(gameEvents.on('task-assigned', (taskId, message, agentId) => {
    console.log(`[Bridge] Task assigned to ${agentId || 'idle agent'}: ${message}`)
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
    console.log(`[Bridge] Task completed: ${runId}`)
    const worker = workerManager.workers.find(w => w.assignedRunId === runId)
    if (worker) {
      worker.assignedRunId = null
      worker.currentTaskMessage = null
      worker.setStatus('idle')
      worker.showBubble('✅ Task completed!')
    }
  }))
  
  // React → Phaser: Generic status update (e.g. from A2A pipeline steps)
  unsubs.push(gameEvents.on('agent-status-changed', (agentId, status) => {
    const worker = workerManager.findBySeatId(agentId)
    if (worker) {
      worker.setStatus(status as any)
    }
  }))

  // Phaser → React: Agent selected in game world
  unsubs.push(gameEvents.on('agent-selected', (agentId) => {
    onAgentSelected?.(agentId)
  }))

  // Phaser → React: Real-time status sync to UI
  // Note: We avoid infinite loops by checking if the UI already has the state
  const interval = setInterval(() => {
    workerManager.workers.forEach(w => {
      onAgentStatusChanged?.(w.seatId, w.status)
    })
  }, 1000)

  return () => {
    for (const u of unsubs) u()
    clearInterval(interval)
  }
}
