/**
 * OfficeScene — Main Phaser scene for Shopee Office.
 * Handles map rendering, player/worker initialization, and UI overlays.
 */

import * as Phaser from 'phaser'
import { AGENT_COLORS, type AgentData as SharedAgentData, type AgentStatus } from '../../types'
import { WorkerManager } from '../systems/WorkerManager'
import { Player } from '../entities/Player'
import { resetWanderClock } from '../entities/worker/idle'
import { Pathfinder } from '../utils/Pathfinder'
import { CameraController } from '../systems/CameraController'
import { InteractionManager } from '../systems/InteractionManager'
import { DoorManager } from '../systems/DoorManager'
import { initSceneEventBridge } from '../SceneEventBridge'
import { ShortcutsOverlay } from '../entities/ShortcutsOverlay'
import { EMOTE_ANIMS } from '../config/emotes'
import { cdnUrl } from '@/lib/asset-cdn'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  OFFICE_MAP_KEY,
  OFFICE_MAP_PATH,
  OFFICE_TILESET_BASE_PATH,
  OFFICE_BASE_LAYERS,
  OFFICE_PROPS_LAYER,
  OFFICE_PROPS_OVER_LAYER,
  OFFICE_OVERHEAD_LAYER,
} from '../config'
import {
  buildCollisionRects,
  parseOfficeSpawns,
  parseOfficePOIs,
  renderTileObjectLayer,
  getTilesetBasename,
} from '../utils/MapHelpers'

export type AgentData = SharedAgentData

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

const MAP_BASE_DEPTH = -200
const OBJECT_DEPTH_OFFSET = -8
const OVERHEAD_DEPTH = 950
const HUD_DEPTH = 5000
type CachedTilesetMeta = {
  image?: string
  name?: string
}

export class OfficeScene extends Phaser.Scene {
  private workerManager!: WorkerManager
  private player!: Player
  private doorManager!: DoorManager
  private pathfinder!: Pathfinder
  private terminalZone: { x: number; y: number } | null = null
  private cameraController!: CameraController
  private interactionManager!: InteractionManager
  private shortcutsOverlay!: ShortcutsOverlay
  private eventBridgeCleanup?: () => void
  private eKey: Phaser.Input.Keyboard.Key | undefined

  private earningsText!: Phaser.GameObjects.Text
  private earningsBg!: Phaser.GameObjects.Graphics
  private typewriterText!: Phaser.GameObjects.Text
  private typewriterTarget = ''
  private typewriterIndex = 0
  private typewriterTimer: Phaser.Time.TimerEvent | null = null

  private connectionDot!: Phaser.GameObjects.Arc
  private connectionText!: Phaser.GameObjects.Text
  private isWsConnected = false
  private earningsTimer: Phaser.Time.TimerEvent | null = null

  private agentsDataRef: AgentData[] = []
  private onAgentSelected?: (agentId: string) => void
  private onStatusUpdate?: (agentId: string, status: AgentStatus) => void
  public deferredAssetsLoaded = false

  constructor() {
    super({ key: 'OfficeScene' })
  }

  init(data?: {
    agents?: AgentData[]
    onAgentSelected?: (agentId: string) => void
    onStatusUpdate?: (agentId: string, status: AgentStatus) => void
  }) {
    this.configure(data)
    this.isWsConnected = this.game.registry.get('wsConnected') || false
  }

  public configure(data?: {
    agents?: AgentData[]
    onAgentSelected?: (agentId: string) => void
    onStatusUpdate?: (agentId: string, status: AgentStatus) => void
  }) {
    if (!data) {
      return
    }

    if (Array.isArray(data.agents)) {
      this.agentsDataRef = data.agents
    }

    if (data.onAgentSelected) {
      this.onAgentSelected = data.onAgentSelected
    }

    if (data.onStatusUpdate) {
      this.onStatusUpdate = data.onStatusUpdate
    }

    if (this.deferredAssetsLoaded && this.workerManager && Array.isArray(this.agentsDataRef)) {
      this.syncWorkers(this.agentsDataRef)
      this.bindEventBridge()
    }
  }

  preload() {
    this.load.tilemapTiledJSON(OFFICE_MAP_KEY, OFFICE_MAP_PATH)

    // Preload required sprites
    this.load.image('shopee_desk', cdnUrl('/shopee-office/desk-v3.webp'))
    
    this.load.spritesheet('shopee_working', cdnUrl('shopee-office/shopee-working-spritesheet-grid.webp'), {
      frameWidth: 230,
      frameHeight: 144,
    })
    this.load.spritesheet('emotes', cdnUrl('shopee-office/emotes.png'), {
      frameWidth: 48,
      frameHeight: 48,
    })
    this.load.spritesheet('anim-door', cdnUrl('shopee-office/anim-door.png'), {
      frameWidth: 48,
      frameHeight: 48,
    })

    // Fallback tileset loader
    this.events.once('update', () => {
      const cachedMap = this.cache.tilemap.get(OFFICE_MAP_KEY)
      const tilesets =
        ((cachedMap?.data as { tilesets?: CachedTilesetMeta[] } | undefined)?.tilesets ?? [])

      for (const tileset of tilesets) {
        if (typeof tileset.name !== 'string' || typeof tileset.image !== 'string') {
          continue
        }

        const basename = getTilesetBasename(tileset.image)
        this.load.image(tileset.name, `${OFFICE_TILESET_BASE_PATH}/${basename}`)
      }
    })
  }

  create() {
    resetWanderClock()
    this.generateHumanoidTextures()
    this.initCharacterAnims()

    const {
      bossSpawn,
      collisionGroup,
      collisionRects,
      mapHeight,
      mapWidth,
      pois,
      workerSpawns,
    } = this.buildOfficeWorld()

    this.pathfinder = new Pathfinder(mapWidth, mapHeight, collisionRects, 16)
    this.terminalZone = { x: bossSpawn.x, y: bossSpawn.y }
    this.player = new Player(this, bossSpawn.x, bossSpawn.y, bossSpawn.facing)
    this.physics.add.collider(this.player.sprite, collisionGroup)
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight)

    this.workerManager = new WorkerManager(this, workerSpawns, pois, this.pathfinder)
    this.doorManager = new DoorManager(this, this.player, () => this.workerManager.workers)
    this.doorManager.initDoors()
    this.cameraController = new CameraController(this, this.player.sprite, mapWidth, mapHeight)
    this.cameraController.init()
    this.interactionManager = new InteractionManager(this, this.player, this.workerManager, this.cameraController)
    this.interactionManager.setTerminalZone(this.terminalZone)
    this.interactionManager.initInteractionUI()
    this.shortcutsOverlay = new ShortcutsOverlay(this)
    this.bindEventBridge()

    const kb = this.input.keyboard
    if (kb) {
      this.eKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E, false)
      kb.on('keydown-H', () => this.shortcutsOverlay.toggle())
      kb.on('keydown-ESC', () => this.shortcutsOverlay.destroy())
    }

    this.deferredAssetsLoaded = true
    this.syncWorkers(this.agentsDataRef)
    this.initHUD()
    this.setWsStatus(this.isWsConnected)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup())
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup())
  }

  private buildOfficeWorld() {
    const map = this.make.tilemap({ key: OFFICE_MAP_KEY })
    const tilesets: Phaser.Tilemaps.Tileset[] = []

    for (const tileset of map.tilesets) {
      const added = map.addTilesetImage(tileset.name, tileset.name)
      if (added) {
        tilesets.push(added)
      }
    }

    OFFICE_BASE_LAYERS.forEach((layerName, index) => {
      const layer = map.createLayer(layerName, tilesets)
      layer?.setDepth(MAP_BASE_DEPTH + index)
    })

    renderTileObjectLayer(this, map, OFFICE_PROPS_LAYER, tilesets, OBJECT_DEPTH_OFFSET)
    renderTileObjectLayer(this, map, OFFICE_PROPS_OVER_LAYER, tilesets, 12)

    const overheadLayer = map.createLayer(OFFICE_OVERHEAD_LAYER, tilesets)
    overheadLayer?.setDepth(OVERHEAD_DEPTH)

    const collisionGroup = this.physics.add.staticGroup()
    const collisionRects = buildCollisionRects(map, collisionGroup)
    const { bossSpawn, workerSpawns } = parseOfficeSpawns(map)
    const pois = parseOfficePOIs(map)

    return {
      bossSpawn,
      collisionGroup,
      collisionRects,
      mapHeight: map.heightInPixels,
      mapWidth: map.widthInPixels,
      pois,
      workerSpawns,
    }
  }

  private generateHumanoidTextures() {
    const agentColors: Record<string, { body: number; head: number; accent: number }> = {
      worker_male_1: { body: 0x2563eb, head: 0xf5d0a9, accent: 0xff7020 },
      worker_male_2: { body: 0x7c3aed, head: 0xf5d0a9, accent: 0xff7020 },
      worker_male_3: { body: 0x059669, head: 0xd4a574, accent: 0xff7020 },
      worker_male_4: { body: 0xdc2626, head: 0xd4a574, accent: 0xff7020 },
      worker_female_1: { body: 0xdb2777, head: 0xf5d0a9, accent: 0xff7020 },
      worker_female_2: { body: 0x0891b2, head: 0xf5d0a9, accent: 0xff7020 },
      worker_female_3: { body: 0xd97706, head: 0xd4a574, accent: 0xff7020 },
      worker_female_4: { body: 0x4f46e5, head: 0xd4a574, accent: 0xff7020 },
    }

    for (const [key, colors] of Object.entries(agentColors)) {
      if (this.textures.exists(key)) continue
      const size = 64
      const gfx = this.make.graphics({ x: 0, y: 0 })
      gfx.fillStyle(0x000000, 0.3)
      gfx.fillEllipse(size / 2, size - 4, 28, 8)
      gfx.fillStyle(0x1a1a2e, 1)
      gfx.fillRect(size / 2 - 8, size - 20, 6, 14)
      gfx.fillRect(size / 2 + 2, size - 20, 6, 14)
      gfx.fillStyle(colors.body, 1)
      gfx.fillRoundedRect(size / 2 - 12, size - 42, 24, 24, 4)
      gfx.fillStyle(colors.accent, 0.6)
      gfx.fillRect(size / 2 - 2, size - 40, 4, 20)
      gfx.fillStyle(colors.head, 1)
      gfx.fillCircle(size / 2, size - 50, 10)
      gfx.fillStyle(0x2d1f0e, 1)
      gfx.fillEllipse(size / 2, size - 56, 18, 8)
      gfx.fillStyle(0x000000, 1)
      gfx.fillCircle(size / 2 - 4, size - 50, 1.5)
      gfx.fillCircle(size / 2 + 4, size - 50, 1.5)
      gfx.generateTexture(key, size, size)
      gfx.destroy()
    }
  }

  private initCharacterAnims() {
    const textures = [
      'worker_male_1', 'worker_male_2', 'worker_male_3', 'worker_male_4',
      'worker_female_1', 'worker_female_2', 'worker_female_3', 'worker_female_4',
    ]
    const dirs = ['up', 'down', 'left', 'right']

    textures.forEach((texture) => {
      dirs.forEach((dir) => {
        if (!this.anims.exists(`${texture}_walk_${dir}`)) {
          this.anims.create({ key: `${texture}_walk_${dir}`, frames: [{ key: texture }], frameRate: 10, repeat: -1 })
        }
        if (!this.anims.exists(`${texture}_idle_${dir}`)) {
          this.anims.create({ key: `${texture}_idle_${dir}`, frames: [{ key: texture }], frameRate: 1, repeat: -1 })
        }
      })

      if (!this.anims.exists(`${texture}_work`) && this.textures.exists('shopee_working')) {
        this.anims.create({
          key: `${texture}_work`,
          frames: this.anims.generateFrameNumbers('shopee_working', { start: 0, end: 10 }),
          frameRate: 12,
          repeat: -1,
        })
      }
    })

    // Emote anims
    EMOTE_ANIMS.forEach((def) => {
      if (!this.anims.exists(def.key)) {
        this.anims.create({
          key: def.key,
          frames: this.anims.generateFrameNumbers('emotes', { frames: def.frames }),
          frameRate: def.frameRate,
          repeat: def.repeat,
        })
      }
    })
  }

  private initHUD() {
    if (this.game.registry.get('fullBleed')) return

    this.earningsBg = this.add.graphics().setDepth(HUD_DEPTH)
    this.earningsBg.setScrollFactor(0)
    this.earningsBg.fillStyle(0x000000, 0.75).fillRoundedRect(10, 8, GAME_WIDTH - 20, 28, 6)

    this.earningsText = this.add.text(24, 22, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffd700',
    }).setOrigin(0, 0.5).setDepth(HUD_DEPTH + 10)
    this.earningsText.setScrollFactor(0)

    this.earningsTimer = this.time.addEvent({ delay: 4000, callback: () => this.showRandomEarnings(), loop: true })
    this.showRandomEarnings()

    this.typewriterText = this.add.text(20, GAME_HEIGHT - 40, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 10, y: 5 },
    }).setOrigin(0, 1).setDepth(HUD_DEPTH + 10)
    this.typewriterText.setScrollFactor(0)
    this.typeText('🛒 Shopee Office v3.0: Agent Town map synced.')

    this.connectionDot = this.add.circle(GAME_WIDTH - 20, 22, 4, 0x888888).setDepth(HUD_DEPTH + 10)
    this.connectionDot.setScrollFactor(0)

    this.connectionText = this.add.text(GAME_WIDTH - 30, 22, 'DISCONNECTED', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#888888',
    }).setOrigin(1, 0.5).setDepth(HUD_DEPTH + 10)
    this.connectionText.setScrollFactor(0)
  }

  public setWsStatus(connected: boolean) {
    this.isWsConnected = connected
    if (!this.connectionDot) return

    const color = connected ? 0x22c55e : 0xef4444
    const label = connected ? 'WS: CONNECTED' : 'WS: DISCONNECTED'
    const textColor = connected ? '#22c55e' : '#ef4444'

    this.connectionDot.setFillStyle(color)
    this.connectionText.setText(label).setColor(textColor)

    if (connected) {
      this.tweens.add({
        targets: this.connectionDot,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1,
      })
    } else {
      this.tweens.getTweensOf(this.connectionDot).forEach((tween) => tween.stop())
      this.connectionDot.setAlpha(1)
    }
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
          this.typewriterIndex += 1
        }
      },
      loop: true,
    })
  }

  update() {
    this.player?.update()
    this.workerManager?.updateAll()
    this.doorManager?.updateDoors()
    this.cameraController?.update()
    if (this.interactionManager && this.eKey) this.interactionManager.updateProximity(this.eKey)
  }

  syncWorkers(agents: AgentData[]) {
    if (!Array.isArray(agents)) {
      this.agentsDataRef = []
      return
    }

    this.agentsDataRef = agents
    if (!this.deferredAssetsLoaded || !this.workerManager) return
    const configs = agents.map((agent) => ({
      seatId: agent.id,
      label: agent.name,
      emoji: agent.emoji,
      color: AGENT_COLORS[agent.id]?.hex || 0x888888,
      status: agent.status,
    }))
    this.workerManager.syncWorkers(configs, (worker) => this.interactionManager.clearIfNearest(worker))
  }

  private bindEventBridge() {
    this.eventBridgeCleanup?.()

    if (!this.workerManager) {
      return
    }

    this.eventBridgeCleanup = initSceneEventBridge(
      this.workerManager,
      this.onAgentSelected,
      this.onStatusUpdate,
    )
  }

  cleanup() {
    this.eventBridgeCleanup?.()
    this.eventBridgeCleanup = undefined
    this.workerManager?.destroyAll()
    this.player?.destroy()
    this.interactionManager?.destroy()
    this.shortcutsOverlay?.destroy()
    if (this.input.keyboard) this.input.keyboard.removeAllListeners()
    if (this.earningsTimer) this.earningsTimer.destroy()
    if (this.typewriterTimer) this.typewriterTimer.destroy()
  }
}
