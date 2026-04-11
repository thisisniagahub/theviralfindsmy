'use client'

import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'

// ===== Types =====
export interface AgentData {
  id: string
  name: string
  emoji: string
  status: 'idle' | 'writing' | 'researching' | 'executing' | 'syncing' | 'error'
  detail: string
  zone: 'rest' | 'work' | 'sync' | 'error'
  updatedAt: string
  tasksCompleted: number
}

export interface PhaserGameProps {
  agents: AgentData[]
  onStatusUpdate?: (agentId: string, status: string) => void
  onAgentSelected?: (agentId: string) => void
  className?: string
}

// ===== Constants =====
import { GAME_WIDTH, GAME_HEIGHT, OFFICE_COLLISIONS, OFFICE_POIS, BOSS_SPAWN_X, BOSS_SPAWN_Y } from './game/config'

// Unique colors per agent based on their ID
const AGENT_COLORS: Record<string, number> = {
  'product-scout': 0xFF6B35,
  'link-builder': 0x4ECDC4,
  'campaign-master': 0xEE4D2D,
  'analytics-agent': 0x7C4DFF,
  'content-writer': 0xFF4081,
  'payout-checker': 0xFFB300,
  'seo-optimizer': 0x00E676,
  'review-monitor': 0xFFD700,
}

// Earnings ticker messages
const EARNINGS_MESSAGES = [
  '💰 Commission: +RM 12.50 from Wireless Earbuds',
  '🔗 New affiliate link created → Phone Case',
  '📈 CTR up 8.2% this week!',
  '🛒 Conversion: Samsung Galaxy Tab → RM 45.00',
  '⚡ Flash Sale links generated: 23 items',
  '💰 Commission: +RM 8.90 from Face Mask Pack',
  '🎯 Campaign "9.9 Mega Sale" is LIVE',
  '📊 Total earnings today: RM 423.50',
  '⭐ New 5-star review on promoted product',
  '💰 Commission: +RM 23.00 from Smart Watch',
  '🔄 Content synced: 15 IG posts → Shopee',
  '📈 Organic traffic up 15% from SEO titles',
]

// ===== Office Scene Class Generator =====
function createOfficeScene(
  initialAgents: AgentData[], 
  onStatusUpdate?: (agentId: string, status: string) => void,
  onAgentSelected?: (agentId: string) => void
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Phaser = require('phaser')
  const { WorkerManager: WM } = require('./game/systems/WorkerManager')
  const { Player: P } = require('./game/entities/Player')
  const { Pathfinder } = require('./game/utils/Pathfinder')
  const { CameraController } = require('./game/systems/CameraController')
  const { InteractionManager } = require('./game/systems/InteractionManager')
  const { initSceneEventBridge } = require('./game/SceneEventBridge')
  const { AGENT_SEAT_DEFS } = require('./game/config')

  class OfficeScene extends Phaser.Scene {
    private workerManager!: any
    private player!: any
    private pathfinder!: any
    private cameraController!: any
    private interactionManager!: any
    private shortcutsOverlay!: any
    private eventBridgeCleanup?: () => void

    // HUD / UI Elements
    private earningsText!: Phaser.GameObjects.Text
    private earningsBg!: Phaser.GameObjects.Graphics
    private typewriterText!: Phaser.GameObjects.Text
    private typewriterTarget = ''
    private typewriterIndex = 0
    private typewriterTimer: Phaser.Time.TimerEvent | null = null
    
    // Environmental Sprites
    private serverRoom: Phaser.GameObjects.Sprite | null = null
    private errorBug: Phaser.GameObjects.Sprite | null = null
    private syncAnimation: Phaser.GameObjects.Sprite | null = null
    private catSprite: Phaser.GameObjects.Sprite | null = null

    // Sound Effects
    private sounds: { click: Phaser.Sound.NoAudioSound | null; taskComplete: Phaser.Sound.NoAudioSound | null; notification: Phaser.Sound.NoAudioSound | null } = { click: null, taskComplete: null, notification: null }
    private soundEnabled = true
    
    // Timers
    private earningsTimer: Phaser.Time.TimerEvent | null = null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private speechBubbleTimer: Phaser.Time.TimerEvent | null = null

    private agentsDataRef: AgentData[] = initialAgents
    private recentlyGreeted: Set<string> = new Set()

    constructor() {
      super({ key: 'OfficeScene' })
    }

    preload() {
      // 1. CRITICAL ASSETS — Load these upfront for fast initial render
      this.load.image('office_bg', '/shopee-office/office_bg_small.webp')
      this.load.image('sofa', '/shopee-office/sofa-idle-v3.png')
      this.load.image('desk', '/shopee-office/desk-v3.webp')
      
      // Load one agent frame if needed for placeholder, but here we use graphics-generated textures in Worker.ts
    }

    create() {
      const { ShortcutsOverlay } = require('./game/entities/ShortcutsOverlay')

      // 1. Visual Loading Progress for deferred assets
      const loadingBar = this.add.graphics()
      const loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'Loading animations...', {
        fontFamily: 'monospace', fontSize: '10px', color: '#888'
      }).setOrigin(0.5)

      this.load.on('progress', (value: number) => {
        loadingBar.clear()
        loadingBar.fillStyle(0xEE4D2D, 1)
        loadingBar.fillRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT / 2 + 40, 200 * value, 4)
      })

      this.load.on('complete', () => {
        loadingBar.destroy()
        loadingText.destroy()
        this.initAnimations()
        console.log('[OfficeScene] Deferred assets loaded.')
      })

      // 2. Environmental Setup (Immediate)
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'office_bg').setOrigin(0.5, 0.5)
      this.add.image(670, 144, 'sofa').setOrigin(0.5, 0.5)
      this.add.image(218, 417, 'desk').setOrigin(0.5, 0.5)

      // 3. Engine Initialization
      this.pathfinder = new Pathfinder(GAME_WIDTH, GAME_HEIGHT, OFFICE_COLLISIONS, 16)
      this.player = new P(this, BOSS_SPAWN_X, BOSS_SPAWN_Y, 'up')
      this.workerManager = new WM(this, AGENT_SEAT_DEFS, OFFICE_POIS, this.pathfinder)
      this.cameraController = new CameraController(this.cameras.main, this.player.sprite)
      this.interactionManager = new InteractionManager(this, this.player, this.workerManager, this.cameraController)
      this.interactionManager.initInteractionUI()
      this.shortcutsOverlay = new ShortcutsOverlay(this)

      // 4. Start Deferred Loading
      this.loadDeferredAssets()

      // 5. Data Sync
      this.syncWorkers(this.agentsDataRef)

      // 6. HUD Setup
      this.initHUD()

      // 7. Connect React Bridge
      this.eventBridgeCleanup = initSceneEventBridge(
        this.workerManager,
        onAgentSelected,
        onStatusUpdate
      )

      // 8. Global Keys
      this.input.keyboard?.on('keydown-H', () => this.shortcutsOverlay.toggle())
      this.input.keyboard?.on('keydown-ESC', () => this.shortcutsOverlay.destroy())
    }

    private loadDeferredAssets() {
      // 2. DEFERRED ASSETS — Heavy spritesheets
      this.load.spritesheet('coffee_machine', '/shopee-office/coffee-machine-v3-grid.webp', { frameWidth: 230, frameHeight: 230 })
      this.load.spritesheet('serverroom', '/shopee-office/serverroom-spritesheet.webp', { frameWidth: 180, frameHeight: 251 })
      this.load.spritesheet('plants', '/shopee-office/plants-spritesheet.webp', { frameWidth: 160, frameHeight: 160 })
      this.load.spritesheet('posters', '/shopee-office/posters-spritesheet.webp', { frameWidth: 160, frameHeight: 160 })
      this.load.spritesheet('cat', '/shopee-office/cats-spritesheet.webp', { frameWidth: 160, frameHeight: 160 })
      this.load.spritesheet('error_bug', '/shopee-office/error-bug-spritesheet-grid.webp', { frameWidth: 180, frameHeight: 180 })
      this.load.spritesheet('shopee_working', '/shopee-office/shopee-working-spritesheet-grid.webp', { frameWidth: 230, frameHeight: 144 })
      this.load.spritesheet('sync_animation', '/shopee-office/sync-animation-v3-grid.webp', { frameWidth: 256, frameHeight: 256 })
      this.load.spritesheet('flowers', '/shopee-office/flowers-bloom-v2.webp', { frameWidth: 65, frameHeight: 65 })
      
      this.load.start()
    }

    private initAnimations() {
      // Move animation creation here so it runs after spritesheets are loaded
      this.initEnvironmentalProps()
    }

    private initEnvironmentalProps() {
      // Coffee machine
      const coffeeMachine = this.add.sprite(659, 397, 'coffee_machine').setOrigin(0.5, 0.5)
      if (!this.anims.exists('coffee_brew')) {
        this.anims.create({
          key: 'coffee_brew',
          frames: this.anims.generateFrameNumbers('coffee_machine', { start: 0, end: 95 }),
          frameRate: 12.5,
          repeat: -1,
        })
      }
      coffeeMachine.play('coffee_brew')

      // Server room
      this.serverRoom = this.add.sprite(1021, 142, 'serverroom').setOrigin(0.5, 0.5)
      if (!this.anims.exists('server_run')) {
        this.anims.create({
          key: 'server_run',
          frames: this.anims.generateFrameNumbers('serverroom', { start: 0, end: 39 }),
          frameRate: 6,
          repeat: -1,
        })
      }
      this.serverRoom.play('server_run')

      // Server Rack LED Lights (blinking activity indicators)
      const ledColors = [0x22c55e, 0x3b82f6, 0xeab308, 0x06b6d4]
      const ledPositions = [
        { x: 950, y: 80 }, { x: 960, y: 80 }, { x: 970, y: 80 },
        { x: 950, y: 120 }, { x: 960, y: 120 }, { x: 970, y: 120 },
        { x: 1070, y: 80 }, { x: 1080, y: 80 }, { x: 1090, y: 80 },
        { x: 1070, y: 120 }, { x: 1080, y: 120 }, { x: 1090, y: 120 },
      ]
      const leds: Phaser.GameObjects.Arc[] = []
      for (const pos of ledPositions) {
        const led = this.add.circle(pos.x, pos.y, 2, ledColors[Math.floor(Math.random() * ledColors.length)], 0.8).setDepth(10)
        leds.push(led)
        // Random blinking interval
        this.time.addEvent({
          delay: 200 + Math.random() * 800,
          repeat: -1,
          callback: () => {
            led.setAlpha(led.alpha > 0.3 ? 0.2 : 0.8 + Math.random() * 0.2)
          },
        })
      }

      // Cat
      this.catSprite = this.add.sprite(94, 557, 'cat', 0).setOrigin(0.5, 0.5).setInteractive()
      this.catSprite.on('pointerdown', () => {
        const nextFrame = (Number(this.catSprite!.frame.name) + 1) % 10
        this.catSprite!.setFrame(nextFrame)
      })

      // Error bug
      this.errorBug = this.add.sprite(1007, 221, 'error_bug').setOrigin(0.5, 0.5).setVisible(false)
      if (!this.anims.exists('bug_move')) {
        this.anims.create({
          key: 'bug_move',
          frames: this.anims.generateFrameNumbers('error_bug', { start: 0, end: 95 }),
          frameRate: 12,
          repeat: -1,
        })
      }

      // Sync pulse
      this.syncAnimation = this.add.sprite(1157, 592, 'sync_animation').setOrigin(0.5, 0.5).setVisible(false)
      if (!this.anims.exists('sync_pulse')) {
        this.anims.create({
          key: 'sync_pulse',
          frames: this.anims.generateFrameNumbers('sync_animation', { start: 0, end: 51 }),
          frameRate: 12,
          repeat: -1,
        })
      }

      // Shopee working avatar
      const shopeeWorking = this.add.sprite(217, 333, 'shopee_working').setOrigin(0.5, 0.5)
      if (!this.anims.exists('shopee_work')) {
        this.anims.create({
          key: 'shopee_work',
          frames: this.anims.generateFrameNumbers('shopee_working', { start: 0, end: 191 }),
          frameRate: 12,
          repeat: -1,
        })
      }
      shopeeWorking.play('shopee_work')
    }

    private initHUD() {
      // Earnings ticker
      this.earningsBg = this.add.graphics().setDepth(900)
      this.earningsBg.fillStyle(0x000000, 0.75).fillRoundedRect(10, 8, GAME_WIDTH - 20, 28, 6)
      this.earningsBg.fillStyle(0xEE4D2D, 1).fillRoundedRect(10, 8, 4, 28, 2)

      this.earningsText = this.add.text(24, 22, '', {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffd700',
      }).setOrigin(0, 0.5).setDepth(950)

      this.earningsTimer = this.time.addEvent({
        delay: 4000,
        callback: () => this.showRandomEarnings(),
        loop: true,
      })
      this.showRandomEarnings()

      // Typewriter
      this.typewriterText = this.add.text(20, GAME_HEIGHT - 40, '', {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 10, y: 5 },
      }).setOrigin(0, 1).setDepth(1000)

      this.typeText('🛒 Shopee Office v3.0: Ready for affiliate operations.')
    }

    private showRandomEarnings() {
      const msg = EARNINGS_MESSAGES[Math.floor(Math.random() * EARNINGS_MESSAGES.length)]
      this.earningsText.setText(msg).setAlpha(0)
      this.tweens.add({ targets: this.earningsText, alpha: 1, duration: 400 })
    }

    private typeText(text: string) {
      this.typewriterTarget = text
      this.typewriterIndex = 0
      this.typewriterTimer?.destroy()
      this.typewriterTimer = this.time.addEvent({
        delay: 30,
        callback: () => {
          if (this.typewriterIndex < this.typewriterTarget.length) {
            this.typewriterText.setText(this.typewriterTarget.substring(0, this.typewriterIndex + 1))
            this.typewriterIndex++
          }
        },
        loop: true,
      })
    }

    update() {
      this.player?.update()
      this.workerManager?.updateAll()
      this.cameraController?.update()
      
      if (this.interactionManager) {
        const kb = this.input.keyboard
        if (kb) {
          const eKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E, false)
          this.interactionManager.updateProximity(eKey)
        }
      }

      // Sync visual indicators
      const hasSync = this.agentsDataRef.some(a => a.status === 'syncing')
      this.syncAnimation?.setVisible(hasSync)
      if (hasSync && !this.syncAnimation?.anims.isPlaying) this.syncAnimation?.play('sync_pulse')

      const hasError = this.agentsDataRef.some(a => a.status === 'error')
      this.errorBug?.setVisible(hasError)
      if (hasError && !this.errorBug?.anims.isPlaying) this.errorBug?.play('bug_move')
    }

    syncWorkers(agents: AgentData[]) {
      this.agentsDataRef = agents
      const configs = agents.map(a => ({
        seatId: a.id,
        label: a.name,
        emoji: a.emoji,
        color: AGENT_COLORS[a.id] || 0x888888,
        status: a.status
      }))
      
      this.workerManager.syncWorkers(configs, (worker: any) => {
        this.interactionManager.clearIfNearest(worker)
      })
    }

    cleanup() {
      this.eventBridgeCleanup?.()
      this.workerManager?.destroyAll()
      this.player?.destroy()
      this.interactionManager?.destroy()
    }
  }

  return OfficeScene
}

// ===== React Component =====
export default function PhaserGame({ agents, onStatusUpdate, onAgentSelected, className }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<any>(null)
  const sceneRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    async function initPhaser() {
      try {
        const Phaser = await import('phaser')
        if (!mounted || !containerRef.current) return

        const OfficeSceneClass = createOfficeScene(agents, onStatusUpdate, onAgentSelected)

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          parent: containerRef.current,
          transparent: false,
          backgroundColor: '#1a1a2e',
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
          },
          physics: {
            default: 'arcade',
            arcade: { gravity: { x: 0, y: 0 }, debug: false }
          },
          scene: OfficeSceneClass,
        }

        const game = new Phaser.Game(config)
        gameRef.current = game

        const scene = game.scene.getScene('OfficeScene')
        if (scene) {
          scene.events.once('create', () => {
            if (!mounted) return
            sceneRef.current = scene
            setIsLoading(false)
          })
        }

        // Fallback for loading state
        setTimeout(() => { if (mounted) setIsLoading(false) }, 3000)

      } catch (err) {
        if (mounted) {
          console.error('Failed to load Phaser:', err)
          setLoadError('Failed to load game engine.')
          setIsLoading(false)
        }
      }
    }

    initPhaser()

    return () => {
      mounted = false
      const scene = sceneRef.current
      if (scene?.cleanup) scene.cleanup()
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const scene = sceneRef.current
    if (scene?.syncWorkers) {
      scene.syncWorkers(agents)
    }
  }, [agents])

  return (
    <div className={`relative w-full ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1a1a2e] rounded-lg">
          <span className="text-4xl animate-bounce mb-4">🛒</span>
          <span className="text-xl font-bold text-white font-mono">Loading Shopee Office...</span>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1a1a2e] rounded-lg">
          <span className="text-red-400 font-mono text-sm">{loadError}</span>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ imageRendering: 'pixelated', aspectRatio: '16/9' }}
      />
    </div>
  )
}
