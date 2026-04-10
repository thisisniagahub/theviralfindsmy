/**
 * Worker entity for Shopee Office agents.
 * Handles movement, idle wandering, emotes, chat bubbles, and task management.
 * Inspired by agent-town's Worker class with modular sub-systems.
 */

import * as Phaser from 'phaser'
import { ChatBubble } from './ChatBubble'
import type { Pathfinder, PathPoint } from '../utils/Pathfinder'
import {
  WANDER_MIN_DELAY,
  WANDER_MAX_DELAY,
  WANDER_INITIAL_MIN,
  WANDER_INITIAL_MAX,
  WORKER_SPEED_FACTOR,
  ARRIVE_THRESHOLD,
  STUCK_FRAME_LIMIT,
  POI_WANDER_CHANCE,
  POI_STAY_MIN,
  POI_STAY_MAX,
  STAGGER_EXTRA_MIN,
  STAGGER_EXTRA_MAX,
  SEAT_ACTIVITIES,
  POI_BUBBLE_TEXTS,
} from '../config'
import type { POI } from '../config'

// ===== Worker Types =====
export type WorkerStatus = 'idle' | 'writing' | 'researching' | 'executing' | 'syncing' | 'error'

export interface QueuedTask {
  runId: string
  message: string
  onReady?: () => void
}

export interface WorkerCtx {
  sprite: Phaser.Physics.Arcade.Sprite
  scene: Phaser.Scene
  seatId: string
  label: string
  spriteKey: string
  homeX: number
  homeY: number
  initialFacing: string
  facing: string
  moveTarget: { x: number; y: number } | null
  currentPath: PathPoint[]
  pathIndex: number
  isReturningHome: boolean
  faceTarget: { x: number; y: number } | null
  arrivalFacing: string | null
  onArrival: (() => void) | null
  stuckFrames: number
  lastX: number
  lastY: number
  pathfinder: Pathfinder | null
  canWander: boolean
  isWandering: boolean
  pois: POI[]
  wanderTimer: Phaser.Time.TimerEvent | null
  activityTimer: Phaser.Time.TimerEvent | null
  interactionLocked: boolean
  _status: WorkerStatus
  assignedRunId: string | null
  currentTaskMessage: string | null
  taskQueue: QueuedTask[]
  taskVisualTimer: Phaser.Time.TimerEvent | null
  bubble: ChatBubble
}

// ===== Status Colors =====
const STATUS_COLORS: Record<WorkerStatus, number> = {
  idle: 0x22c55e,
  writing: 0xf97316,
  researching: 0xa855f7,
  executing: 0xeab308,
  syncing: 0x3b82f6,
  error: 0xef4444,
}

// ===== Wander Clock (stagger wandering so agents don't all move at once) =====
const wanderClock = { lastStartedAt: -Infinity }

export function resetWanderClock() {
  wanderClock.lastStartedAt = -Infinity
}

function poiBubbleText(poiName: string): string {
  const lower = poiName.toLowerCase()
  for (const [keyword, texts] of Object.entries(POI_BUBBLE_TEXTS)) {
    if (lower.includes(keyword)) {
      return texts[Math.floor(Math.random() * texts.length)]
    }
  }
  return `At ${poiName}~`
}

// ===== Idle Behavior =====
function stopIdleActivity(ctx: WorkerCtx) {
  if (ctx.wanderTimer) {
    ctx.wanderTimer.destroy()
    ctx.wanderTimer = null
  }
  if (ctx.activityTimer) {
    ctx.activityTimer.destroy()
    ctx.activityTimer = null
  }
  ctx.onArrival = null
  ctx.isWandering = false
  ctx.interactionLocked = false
}

function scheduleWander(ctx: WorkerCtx) {
  stopIdleActivity(ctx)
  if (!ctx.canWander || ctx._status !== 'idle') return

  const delay = Phaser.Math.Between(WANDER_MIN_DELAY, WANDER_MAX_DELAY)
  ctx.wanderTimer = ctx.scene.time.delayedCall(delay, () => {
    tryStartWander(ctx)
  })
}

function tryStartWander(ctx: WorkerCtx) {
  if (!ctx.canWander || ctx._status !== 'idle') return

  const now = ctx.scene.time.now
  const sinceLast = now - wanderClock.lastStartedAt
  if (sinceLast < 1800) {
    const extraDelay = 1800 - sinceLast + Phaser.Math.Between(STAGGER_EXTRA_MIN, STAGGER_EXTRA_MAX)
    ctx.wanderTimer = ctx.scene.time.delayedCall(extraDelay, () => {
      tryStartWander(ctx)
    })
    return
  }

  wanderClock.lastStartedAt = now
  startWander(ctx)
}

function startWander(ctx: WorkerCtx) {
  const goToPoi = ctx.pois.length > 0 && Math.random() < POI_WANDER_CHANCE
  if (goToPoi) {
    wanderToPoi(ctx)
  } else {
    seatActivity(ctx)
  }
}

function wanderToPoi(ctx: WorkerCtx) {
  const poi = Phaser.Utils.Array.GetRandom(ctx.pois) as POI
  ctx.isWandering = true
  ctx.arrivalFacing = poi.facing ?? null

  ctx.onArrival = () => {
    if (ctx._status !== 'idle' || !ctx.canWander) return
    ctx.bubble?.show(poiBubbleText(poi.name), ctx.sprite.x, ctx.sprite.y - 50, POI_STAY_MIN)

    const stayDuration = Phaser.Math.Between(POI_STAY_MIN, POI_STAY_MAX)
    ctx.activityTimer = ctx.scene.time.delayedCall(stayDuration, () => {
      if (ctx._status !== 'idle' || !ctx.canWander) return
      ctx.onArrival = () => {
        ctx.isWandering = false
        scheduleWander(ctx)
      }
      navigateHome(ctx)
      ctx.activityTimer = null
    })
  }

  navigateTo(ctx, poi.x, poi.y, { x: poi.x, y: poi.y })
}

function seatActivity(ctx: WorkerCtx) {
  const def = Phaser.Utils.Array.GetRandom(SEAT_ACTIVITIES) as (typeof SEAT_ACTIVITIES)[number]
  const duration = Phaser.Math.Between(def.minDuration, def.maxDuration)

  // Show emote as text above the agent
  const emoteSymbols: Record<string, string> = {
    sleep: '💤',
    thinking: '🤔',
    device: '💻',
    star: '⭐',
    heart: '❤️',
    music: '🎵',
    confused: '❓',
    angry: '😡',
  }
  const symbol = emoteSymbols[def.emote] || '...'
  ctx.bubble?.show(`${symbol} ${def.bubbles[0]}`, ctx.sprite.x, ctx.sprite.y - 50, duration)

  ctx.activityTimer = ctx.scene.time.delayedCall(duration, () => {
    if (ctx._status !== 'idle' || !ctx.canWander) return
    scheduleWander(ctx)
    ctx.activityTimer = null
  })
}

// ===== Movement =====
function updateMovement(ctx: WorkerCtx) {
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
    const vx = (wdx / wdist) * speed
    const vy = (wdy / wdist) * speed
    const body = ctx.sprite.body as Phaser.Physics.Arcade.Body
    body.setVelocity(vx, vy)

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
      ctx.moveTarget = null
      if (ctx.onArrival) {
        const cb = ctx.onArrival
        ctx.onArrival = null
        cb()
      }
    } else {
      const speed = 80 * WORKER_SPEED_FACTOR
      const vx = (dx / dist) * speed
      const vy = (dy / dist) * speed
      const body = ctx.sprite.body as Phaser.Physics.Arcade.Body
      body.setVelocity(vx, vy)
    }
  }
}

function navigateTo(ctx: WorkerCtx, x: number, y: number, _facePoi?: { x: number; y: number }) {
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

function navigateHome(ctx: WorkerCtx) {
  navigateTo(ctx, ctx.homeX, ctx.homeY)
  ctx.isReturningHome = true
}

// ===== Main Worker Class =====
export class Worker implements WorkerCtx {
  sprite: Phaser.Physics.Arcade.Sprite
  bubble: ChatBubble
  readonly seatId: string
  readonly label: string
  readonly spriteKey: string
  readonly homeX: number
  readonly homeY: number
  readonly scene: Phaser.Scene
  readonly initialFacing: string

  // Movement state
  facing: string = 'down'
  moveTarget: { x: number; y: number } | null = null
  currentPath: PathPoint[] = []
  pathIndex = 0
  isReturningHome = false
  faceTarget: { x: number; y: number } | null = null
  arrivalFacing: string | null = null
  onArrival: (() => void) | null = null
  stuckFrames = 0
  lastX = 0
  lastY = 0
  pathfinder: Pathfinder | null = null

  // Idle / wander
  canWander = true
  isWandering = false
  pois: POI[] = []
  wanderTimer: Phaser.Time.TimerEvent | null = null
  activityTimer: Phaser.Time.TimerEvent | null = null
  interactionLocked = false

  // Task state
  _status: WorkerStatus = 'idle'
  assignedRunId: string | null = null
  currentTaskMessage: string | null = null
  taskQueue: QueuedTask[] = []
  taskVisualTimer: Phaser.Time.TimerEvent | null = null

  // Internal visuals
  private nameTag: Phaser.GameObjects.Text
  private statusDot: Phaser.GameObjects.Arc
  private taskStatusText: Phaser.GameObjects.Text
  private initTimer: Phaser.Time.TimerEvent | null = null
  private paused = false

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    seatId: string,
    label: string,
    emoji: string,
    agentColor: number,
    facing: string = 'down',
  ) {
    this.scene = scene
    this.seatId = seatId
    this.label = label
    this.spriteKey = seatId
    this.facing = facing
    this.initialFacing = facing
    this.homeX = x
    this.homeY = y

    // Create agent sprite (colored circle with emoji)
    const gfx = scene.add.graphics()
    gfx.fillStyle(agentColor, 0.85)
    gfx.fillCircle(24, 24, 24)
    gfx.fillStyle(0x000000, 0.4)
    gfx.fillCircle(24, 24, 26)
    gfx.fillStyle(agentColor, 0.85)
    gfx.fillCircle(24, 24, 23)
    gfx.generateTexture(`agent_${seatId}`, 48, 48)
    gfx.destroy()

    this.sprite = scene.physics.add.sprite(x, y, `agent_${seatId}`)
    this.sprite.setDepth(5)
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setSize(20, 10)
    body.setOffset(14, 38)
    body.allowGravity = false
    body.pushable = false
    body.mass = 999

    // Emoji on top
    const emojiText = scene.add.text(x, y - 2, emoji, {
      fontSize: '28px',
    }).setOrigin(0.5, 0.5).setDepth(6)
    // Store reference for position updates
    this.sprite.setData('emojiText', emojiText)

    // Name tag
    this.nameTag = scene.add
      .text(x, y + 30, label, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#e0e0e0',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 4, y: 2 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(20)

    // Status dot
    this.statusDot = scene.add.circle(x - 20, y + 34, 3, 0x888888).setDepth(20)

    // Task status text
    this.taskStatusText = scene.add
      .text(x, y + 44, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#facc15',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 4, y: 2 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(20)
      .setVisible(false)

    // Chat bubble
    this.bubble = new ChatBubble(scene)

    // Schedule initial wander
    const initialDelay = Phaser.Math.Between(WANDER_INITIAL_MIN, WANDER_INITIAL_MAX)
    this.initTimer = scene.time.delayedCall(initialDelay, () => {
      this.initTimer = null
      scheduleWander(this)
    })
  }

  // ===== Status =====
  get status(): WorkerStatus {
    return this._status
  }

  setStatus(status: WorkerStatus) {
    this._status = status
    const colors: Record<WorkerStatus, number> = STATUS_COLORS
    this.statusDot.setFillStyle(colors[status])

    if (status === 'idle') {
      this.canWander = true
      scheduleWander(this)
    } else {
      stopIdleActivity(this)
      this.canWander = false
    }
  }

  // ===== Public Helpers =====
  setPOIs(pois: POI[]) {
    this.pois = pois
  }

  setPathfinder(pf: Pathfinder) {
    this.pathfinder = pf
  }

  canInteract() {
    return !this.interactionLocked
  }

  showBubble(message: string, ttl = 5000) {
    this.bubble.show(message, this.sprite.x, this.sprite.y - 50, ttl)
  }

  // ===== Pause/Resume =====
  pause() {
    if (this.paused) return
    this.paused = true
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
  }

  resume() {
    if (!this.paused) return
    this.paused = false
    // Movement will resume in the next update
  }

  // ===== Update =====
  update() {
    if (!this.paused) updateMovement(this)

    const emojiText = this.sprite.getData('emojiText') as Phaser.GameObjects.Text | undefined
    if (emojiText) {
      emojiText.setPosition(this.sprite.x, this.sprite.y - 2)
    }

    this.nameTag.setPosition(this.sprite.x, this.sprite.y + 30)
    this.statusDot.setPosition(this.sprite.x - 20, this.sprite.y + 34)

    // Update task status text
    const hasTask = this.assignedRunId || this.taskQueue.length > 0
    if (this.taskStatusText) {
      this.taskStatusText.setPosition(this.sprite.x, this.sprite.y + 44)
      if (hasTask) {
        const parts: string[] = []
        if (this.currentTaskMessage) {
          const snip = this.currentTaskMessage.length > 20
            ? `${this.currentTaskMessage.slice(0, 20)}...`
            : this.currentTaskMessage
          parts.push(`📋 ${snip}`)
        }
        if (this.taskQueue.length > 0) {
          parts.push(`Queue: ${this.taskQueue.length}`)
        }
        this.taskStatusText.setText(parts.join(' | '))
        this.taskStatusText.setVisible(true)
      } else {
        this.taskStatusText.setVisible(false)
      }
    }

    this.bubble.updatePosition(this.sprite.x, this.sprite.y - 50)
  }

  // ===== Cleanup =====
  destroy() {
    if (this.initTimer) {
      this.initTimer.destroy()
      this.initTimer = null
    }
    stopIdleActivity(this)
    if (this.taskVisualTimer) {
      this.taskVisualTimer.destroy()
      this.taskVisualTimer = null
    }
    this.sprite.destroy()
    this.nameTag.destroy()
    this.taskStatusText.destroy()
    this.statusDot.destroy()
    this.bubble.destroy()
    this.pathfinder = null
    this.onArrival = null
  }
}
