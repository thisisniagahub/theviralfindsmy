/**
 * Worker entity for Shopee Office agents.
 * Handles movement, idle wandering, emotes, chat bubbles, and task management.
 * Modularized with sub-systems for movement, idle, and tasks.
 */

import * as Phaser from 'phaser'
import { ChatBubble } from './ChatBubble'
import type { Pathfinder, PathPoint } from '../utils/Pathfinder'
import { agentStateTracker } from '../../agent-state-machine'
import { STATUS_COLORS, type AgentStatus } from '../../types'
import { gameEvents } from '../events'
import {
  WANDER_INITIAL_MIN,
  WANDER_INITIAL_MAX,
} from '../config'
import type { POI } from '../config'

const OVERHEAD_DEPTH = 950

// Import sub-module logic
import { updateMovement, navigateTo, navigateHome } from './worker/movement'
import { scheduleWander, stopIdleActivity } from './worker/idle'
import { getRandomTaskMessage } from './worker/task'

// ===== Worker Types =====
export type WorkerStatus = AgentStatus

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
  textureKey: string
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
  isMoving: boolean
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
  emoteSprite: Phaser.GameObjects.Sprite | null
  playEmote: (emoteKey: string, duration?: number) => void
}

// ===== Main Worker Class =====
export class Worker implements WorkerCtx {
  sprite: Phaser.Physics.Arcade.Sprite
  bubble: ChatBubble
  emoteSprite: Phaser.GameObjects.Sprite | null = null

  readonly seatId: string
  readonly label: string
  readonly textureKey: string
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
  isMoving = false
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
  private bobbleTween: Phaser.Tweens.Tween | null = null
  private glowTween: Phaser.Tweens.Tween | null = null

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    seatId: string,
    label: string,
    emoji: string,
    _agentColor: number,
    textureKey: string = 'worker_male_1',
    facing: string = 'down',
  ) {
    this.scene = scene
    this.seatId = seatId
    this.label = label
    this.facing = facing
    this.initialFacing = facing
    this.homeX = x
    this.homeY = y

    // Add texture fallback to prevent "pink box" issues
    this.textureKey = scene.textures.exists(textureKey) ? textureKey : 'worker_male_1'

    // Create the sprite using the validated textureKey
    this.sprite = scene.physics.add.sprite(x, y, this.textureKey)
    this.sprite.setDepth(5)
    
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setSize(32, 16)
    body.setOffset(16, 48)
    body.allowGravity = false
    body.pushable = false
    body.mass = 999

    // Overlay emoji as a floating item above head
    const emojiText = scene.add.text(x, y - 32, emoji, {
      fontSize: '24px',
    }).setOrigin(0.5, 0.5).setDepth(6)
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

    // Health/Productivity Bar
    const healthBarBg = scene.add.rectangle(x, y + 40, 40, 3, 0x000000, 0.5).setOrigin(0.5, 0).setDepth(20)
    const healthBar = scene.add.rectangle(x - 20 + 20, y + 40, 40, 3, 0x22c55e, 1).setOrigin(0, 0).setDepth(21)
    healthBarBg.setSize(40, 3)
    healthBar.setSize(40 * 0.8, 3) // Start at 80% productivity
    this.sprite.setData('healthBar', healthBar)
    this.sprite.setData('healthBarBg', healthBarBg)

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


  // ===== Movement =====
  private updateBobble() {
    if (this.isMoving) {
      if (this.bobbleTween?.isPlaying()) return
      this.bobbleTween = this.scene.tweens.add({
        targets: this.sprite,
        y: '-=4',
        duration: 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    } else {
      if (this.bobbleTween && this._status === 'idle') {
        this.bobbleTween.stop()
        this.bobbleTween.remove() // FIX: Explicitly remove to prevent leaks
        this.bobbleTween = null
        this.sprite.setY(this.sprite.y)
      }
    }
  }

  // ===== Status =====
  get status(): WorkerStatus {
    return this._status
  }

  setStatus(status: WorkerStatus) {
    if (this._status === status) return

    this._status = status

    // Record state change in tracker
    agentStateTracker.recordStateChange(this.seatId, status)
    
    // FIX: Emit status change event immediately for event-driven UI updates
    gameEvents.emit('agent-status-changed', this.seatId, status)

    this.statusDot.setFillStyle(STATUS_COLORS[status].hex)

    // Trigger context-aware bubble when transitioning to an active state
    if (status !== 'idle') {
      const msg = getRandomTaskMessage(status)
      this.bubble.show(msg, this.sprite.x, this.sprite.y - 12)
    }

    if (status === 'idle') {
      this.stopBobble()
      // Check task queue first
      if (this.taskQueue.length > 0) {
        const next = this.taskQueue.shift()!
        this.assignedRunId = next.runId
        this.currentTaskMessage = next.message
        this.setStatus('executing')
        if (next.onReady) next.onReady()
        return
      }

      this.canWander = true
      scheduleWander(this)
    } else {
      stopIdleActivity(this)
      this.canWander = false
      if (!this.isMoving) this.startBobble()
    }
  }

  // ===== Visuals =====
  private startBobble() {
    if (this.bobbleTween?.isPlaying()) return
    this.bobbleTween = this.scene.tweens.add({
      targets: [this.sprite, this.nameTag, this.statusDot, this.taskStatusText],
      y: '+=4',
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private stopBobble() {
    if (this.bobbleTween) {
      this.bobbleTween.stop()
      this.bobbleTween.remove() // FIX: Explicitly remove to prevent leaks
      this.bobbleTween = null
    }
  }

  setGlow(active: boolean) {
    if (active) {
      if (this.glowTween?.isPlaying()) return
      this.glowTween = this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.6,
        duration: 800,
        yoyo: true,
        repeat: -1
      })
    } else {
      if (this.glowTween) {
        this.glowTween.stop()
        this.glowTween.remove() // FIX: Explicitly remove to prevent leaks
        this.glowTween = null
        this.sprite.setAlpha(1)
      }
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

  playEmote(emoteKey: string, duration = 2000) {
    if (!this.emoteSprite) {
      this.emoteSprite = this.scene.add.sprite(this.sprite.x, this.sprite.y - 48, 'emotes')
      this.emoteSprite.setDepth(OVERHEAD_DEPTH)
    }
    this.emoteSprite.setVisible(true)
    this.emoteSprite.play(emoteKey)

    if (duration > 0) {
      this.scene.time.delayedCall(duration, () => {
        if (this.emoteSprite) this.emoteSprite.setVisible(false)
      })
    }
  }

  assignTask(runId: string, message: string) {
    this.assignedRunId = runId
    this.currentTaskMessage = message
    this.setStatus('executing')
    this.showBubble(`📋 ${message}`)
    
    // FIX: Walk home if away from desk when assigned a task
    const distToHome = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.homeX, this.homeY)
    if (this.isWandering || distToHome > 16) {
      navigateHome(this)
    }
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
  }

  // ===== Update =====
  update() {
    if (!this.paused) updateMovement(this)
    this.updateBobble()

    const emojiText = this.sprite.getData('emojiText') as Phaser.GameObjects.Text | undefined
    if (emojiText) {
      emojiText.setPosition(this.sprite.x, this.sprite.y - 48)
      emojiText.y += Math.sin(this.scene.time.now / 400) * 3
    }

    if (this.emoteSprite && this.emoteSprite.visible) {
      this.emoteSprite.setPosition(this.sprite.x, this.sprite.y - 48)
      this.emoteSprite.y += Math.sin(this.scene.time.now / 300) * 2
    }
    

    // Update animation based on movement and state
    if (this.isMoving) {
      const animKey = `${this.textureKey}_walk_${this.facing}`
      // FIX: Add animation validation to prevent errors if keys are missing
      if (this.scene.anims.exists(animKey) && this.sprite.anims.currentAnim?.key !== animKey) {
        this.sprite.play(animKey)
      }
    } else {
      const isWorking = this._status !== 'idle'
      if (isWorking) {
        const workAnimKey = `${this.textureKey}_work`
        if (this.scene.anims.exists(workAnimKey) && this.sprite.anims.currentAnim?.key !== workAnimKey) {
          this.sprite.play(workAnimKey)
        }
      } else {
        const idleAnimKey = `${this.textureKey}_idle_${this.facing}`
        if (this.scene.anims.exists(idleAnimKey) && this.sprite.anims.currentAnim?.key !== idleAnimKey) {
          this.sprite.play(idleAnimKey)
        }
      }
    }

    // Y-sorting (Depth Management)
    this.sprite.setDepth(this.sprite.y)
    
    // UI elements should stay slightly above the sprite's base depth
    const uiDepth = this.sprite.y + 10
    this.nameTag.setDepth(uiDepth)
    this.statusDot.setDepth(uiDepth + 1)

    if (this.taskStatusText) {
      this.taskStatusText.setDepth(uiDepth)
      this.taskStatusText.setPosition(this.sprite.x, this.sprite.y + 44)
      
      const hasTask = this.assignedRunId || this.taskQueue.length > 0
      if (hasTask) {
        const parts: string[] = []
        if (this.currentTaskMessage) {
          const snip = this.currentTaskMessage.length > 20
            ? `${this.currentTaskMessage.slice(0, 20)}...`
            : this.currentTaskMessage
          parts.push(`📋 ${snip}`)
        }
        if (this.taskQueue.length > 0) parts.push(`Queue: ${this.taskQueue.length}`)
        this.taskStatusText.setText(parts.join(' | ')).setVisible(true)
      } else {
        this.taskStatusText.setVisible(false)
      }
    }
    
    this.bubble.setDepth(2000)

    this.nameTag.setPosition(this.sprite.x, this.sprite.y + 30)
    this.statusDot.setPosition(this.sprite.x - 20, this.sprite.y + 34)
    this.bubble.updatePosition(this.sprite.x, this.sprite.y - 12)
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

    // FIX: Properly destroy emojiText to prevent leaks
    const emojiText = this.sprite.getData('emojiText')
    emojiText?.destroy()

    // FIX: Clean up health bar elements
    this.sprite.getData('healthBar')?.destroy()
    this.sprite.getData('healthBarBg')?.destroy()

    this.sprite.destroy()
    this.nameTag.destroy()
    this.taskStatusText.destroy()
    this.statusDot.destroy()
    
    // FIX: Safely clean up tweens
    this.stopBobble()
    if (this.glowTween) {
      this.glowTween.stop()
      this.glowTween.remove()
      this.glowTween = null
    }

    this.bubble.destroy()
    this.pathfinder = null
    this.onArrival = null
  }
}
