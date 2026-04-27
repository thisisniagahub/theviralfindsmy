/**
 * WorkerManager for the Shopee Office scene.
 * Manages spawning, syncing, and updating all worker entities.
 * Inspired by agent-town's WorkerManager.
 */

import * as Phaser from 'phaser'
import { Worker } from '../entities/Worker'
import type { Pathfinder } from '../utils/Pathfinder'
import type { SeatDef, POI } from '../config'

export interface WorkerConfig {
  seatId: string
  label: string
  emoji: string
  color: number
  status: string
}

export class WorkerManager {
  private scene: Phaser.Scene
  private pois: POI[]
  private pathfinder: Pathfinder

  workers: Worker[] = []
  seatDefs: SeatDef[] = []

  constructor(scene: Phaser.Scene, seatDefs: SeatDef[], pois: POI[], pathfinder: Pathfinder) {
    this.scene = scene
    this.seatDefs = seatDefs
    this.pois = pois
    this.pathfinder = pathfinder
  }

  spawnWorker(seatDef: SeatDef, config: WorkerConfig): Worker | null {
    const worker = new Worker(
      this.scene,
      seatDef.x,
      seatDef.y,
      seatDef.seatId,
      config.label,
      config.emoji,
      config.color,
      seatDef.facing,
    )
    worker.setPOIs(this.pois)
    worker.setPathfinder(this.pathfinder)
    worker.sprite.setCollideWorldBounds(true)
    worker.setStatus(config.status as Worker['_status'])
    return worker
  }

  syncWorkers(configs: WorkerConfig[], clearNearest: (worker: Worker) => void) {
    const nextBySeatId = new Map(configs.map((c) => [c.seatId, c]))
    const existingBySeatId = new Map(this.workers.map((w) => [w.seatId, w]))
    const nextWorkers: Worker[] = []

    for (const seatDef of this.seatDefs) {
      const config = nextBySeatId.get(seatDef.seatId)
      const existing = existingBySeatId.get(seatDef.seatId)

      if (!config) {
        if (existing) {
          clearNearest(existing)
          existing.destroy()
          existingBySeatId.delete(seatDef.seatId)
        }
        continue
      }

      const needsRecreate = !existing || existing.label !== config.label

      if (needsRecreate) {
        if (existing) {
          clearNearest(existing)
          existing.destroy()
          existingBySeatId.delete(seatDef.seatId)
        }
        const created = this.spawnWorker(seatDef, config)
        if (created) nextWorkers.push(created)
        continue
      }

      // Update status
      existing.setStatus(config.status as Worker['_status'])
      nextWorkers.push(existing)
      existingBySeatId.delete(seatDef.seatId)
    }

    for (const stale of existingBySeatId.values()) {
      clearNearest(stale)
      stale.destroy()
    }

    this.workers = nextWorkers
  }

  findBySeatId(seatId?: string): Worker | null {
    if (!seatId) return null
    return this.workers.find((w) => w.seatId === seatId) ?? null
  }

  findIdle(): Worker | null {
    return this.workers.find((w) => w.status === 'idle') ?? null
  }

  updateAll() {
    for (const worker of this.workers) worker.update()
  }

  destroyAll() {
    for (const worker of this.workers) worker.destroy()
    this.workers = []
  }
}
