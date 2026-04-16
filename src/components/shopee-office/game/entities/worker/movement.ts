/**
 * Movement logic for Shopee Office workers.
 * Handles A* pathfinding, direct movement, and stuck detection.
 */

import * as Phaser from 'phaser'
import type { WorkerCtx } from '../Worker'
import { WORKER_SPEED_FACTOR, ARRIVE_THRESHOLD, STUCK_FRAME_LIMIT } from '../../config'

export function updateMovement(ctx: WorkerCtx) {
  if (!ctx.moveTarget) return

  const dx = ctx.moveTarget.x - ctx.sprite.x
  const dy = ctx.moveTarget.y - ctx.sprite.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Check if stuck
  if (dist > 2) {
    const moved = Math.abs(ctx.sprite.x - ctx.lastX) + Math.abs(ctx.sprite.y - ctx.lastY)
    if (moved < 0.5) {
      ctx.stuckFrames++
      if (ctx.stuckFrames > STUCK_FRAME_LIMIT) {
        // Unstick: go home
        ctx.moveTarget = null
        ctx.currentPath = []
        navigateHome(ctx)
        ctx.stuckFrames = 0
        return
      }
    } else {
      ctx.stuckFrames = 0
    }
  }
  ctx.lastX = ctx.sprite.x
  ctx.lastY = ctx.sprite.y

  // Follow path
  if (ctx.currentPath.length > 0 && ctx.pathIndex < ctx.currentPath.length) {
    const waypoint = ctx.currentPath[ctx.pathIndex]
    const wdx = waypoint.x - ctx.sprite.x
    const wdy = waypoint.y - ctx.sprite.y
    const wdist = Math.sqrt(wdx * wdx + wdy * wdy)

    if (wdist < ARRIVE_THRESHOLD) {
      ctx.pathIndex++
      if (ctx.pathIndex >= ctx.currentPath.length) {
        ctx.moveTarget = null
        ctx.currentPath = []
        if (ctx.onArrival) {
          const cb = ctx.onArrival
          ctx.onArrival = null
          cb()
        }
      }
      return
    }

    const speed = 80 * WORKER_SPEED_FACTOR
    let vx = (wdx / wdist) * speed
    let vy = (wdy / wdist) * speed

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2
      vx *= factor
      vy *= factor
    }

    const body = ctx.sprite.body as Phaser.Physics.Arcade.Body
    body.setVelocity(vx, vy)

    ctx.isMoving = true

    // Update facing
    if (Math.abs(wdx) > Math.abs(wdy)) {
      ctx.facing = wdx > 0 ? 'right' : 'left'
    } else {
      ctx.facing = wdy > 0 ? 'down' : 'up'
    }
  } else {
    // Direct movement (fallback)
    if (dist < ARRIVE_THRESHOLD) {
      const body = ctx.sprite.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
      ctx.isMoving = false
      ctx.moveTarget = null
      if (ctx.onArrival) {
        const cb = ctx.onArrival
        ctx.onArrival = null
        cb()
      }
    } else {
      const speed = 80 * WORKER_SPEED_FACTOR
      let vx = (dx / dist) * speed
      let vy = (dy / dist) * speed

      // Normalize diagonal movement
      if (vx !== 0 && vy !== 0) {
        const factor = Math.SQRT1_2
        vx *= factor
        vy *= factor
      }

      const body = ctx.sprite.body as Phaser.Physics.Arcade.Body
      body.setVelocity(vx, vy)
      ctx.isMoving = true
    }
  }
}

export function navigateTo(ctx: WorkerCtx, x: number, y: number, _facePoi?: { x: number; y: number }) {
  if (ctx.pathfinder) {
    const path = ctx.pathfinder.findPath(ctx.sprite.x, ctx.sprite.y, x, y)
    if (path && path.length > 1) {
      ctx.currentPath = path
      ctx.pathIndex = 1 // Skip first point (current position)
      ctx.moveTarget = { x: path[path.length - 1].x, y: path[path.length - 1].y }
      return
    }
  }
  // Fallback: direct movement
  ctx.currentPath = []
  ctx.moveTarget = { x, y }
}

export function navigateHome(ctx: WorkerCtx) {
  navigateTo(ctx, ctx.homeX, ctx.homeY)
  ctx.isReturningHome = true
}
