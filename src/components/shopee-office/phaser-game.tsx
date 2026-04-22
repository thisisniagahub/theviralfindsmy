'use client'

import { useEffect, useRef, useState } from 'react'

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
  className?: string
}

// ===== Constants =====
const GAME_WIDTH = 1280
const GAME_HEIGHT = 720

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

// Fallback color for unknown agents
const DEFAULT_AGENT_COLOR = 0x888888

// Spread positions wider so 8 agents don't overlap
const ZONE_POSITIONS: Record<string, { x: number; y: number }[]> = {
  idle: [
    { x: 580, y: 180 },
    { x: 640, y: 200 },
    { x: 700, y: 170 },
    { x: 620, y: 230 },
    { x: 680, y: 245 },
    { x: 740, y: 195 },
    { x: 560, y: 210 },
    { x: 760, y: 225 },
  ],
  writing: [
    { x: 680, y: 290 },
    { x: 740, y: 310 },
    { x: 800, y: 280 },
    { x: 720, y: 340 },
    { x: 780, y: 350 },
    { x: 840, y: 300 },
    { x: 700, y: 370 },
    { x: 860, y: 330 },
  ],
  researching: [
    { x: 680, y: 290 },
    { x: 740, y: 310 },
    { x: 800, y: 280 },
    { x: 720, y: 340 },
    { x: 780, y: 350 },
    { x: 840, y: 300 },
    { x: 700, y: 370 },
    { x: 860, y: 330 },
  ],
  executing: [
    { x: 680, y: 290 },
    { x: 740, y: 310 },
    { x: 800, y: 280 },
    { x: 720, y: 340 },
    { x: 780, y: 350 },
    { x: 840, y: 300 },
    { x: 700, y: 370 },
    { x: 860, y: 330 },
  ],
  syncing: [
    { x: 1060, y: 520 },
    { x: 1120, y: 540 },
    { x: 1180, y: 510 },
    { x: 1090, y: 560 },
    { x: 1150, y: 570 },
    { x: 1200, y: 535 },
    { x: 1070, y: 555 },
    { x: 1210, y: 545 },
  ],
  error: [
    { x: 140, y: 210 },
    { x: 200, y: 230 },
    { x: 160, y: 260 },
    { x: 220, y: 240 },
    { x: 180, y: 280 },
    { x: 240, y: 220 },
    { x: 260, y: 260 },
    { x: 200, y: 290 },
  ],
}

const STATUS_COLORS: Record<string, number> = {
  idle: 0x22c55e,
  writing: 0xf97316,
  researching: 0xa855f7,
  executing: 0xeab308,
  syncing: 0x3b82f6,
  error: 0xef4444,
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'IDLE',
  writing: 'WRITING',
  researching: 'RESEARCHING',
  executing: 'EXECUTING',
  syncing: 'SYNCING',
  error: 'ERROR',
}

const SPEECH_BUBBLES: Record<string, string[]> = {
  idle: [
    'Recharging... ☕',
    'Break time! 🛋',
    'Checking Shopee Mall...',
    'Catching up on trends!',
    'Ready for next task! 💪',
  ],
  writing: [
    'Writing product descriptions...',
    'Drafting Shopee post...',
    'Creating campaign copy...',
    'Almost done writing!',
    'Adding product keywords...',
  ],
  researching: [
    'Analyzing trending items...',
    'Checking competitor prices...',
    'Scanning flash sale items...',
    'Deep market analysis...',
    'Reviewing seller ratings...',
  ],
  executing: [
    'Generating affiliate link...',
    'Processing RM 12.50 commission!',
    'Creating deep link...',
    'Running A/B test...',
    'Deploying campaign!',
  ],
  syncing: [
    'Syncing with Shopee API...',
    'Updating product catalog...',
    'Pulling latest orders...',
    'Sync in progress...',
    'Fetching commission data...',
  ],
  error: [
    'Link generation failed!',
    'API rate limit hit!',
    'Need attention! 🔴',
    'Product out of stock!',
    'Retrying in 30s...',
  ],
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

// ===== Helper: Convert hex number to CSS-like string =====
function hexToColorString(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0')
}

// ===== Office Scene Class =====
async function createOfficeScene(agentsData: AgentData[], _onStatusUpdate?: (agentId: string, status: string) => void) {
  const Phaser = (await import('phaser')).default

  class OfficeScene extends Phaser.Scene {
    private agentSprites: Map<string, Phaser.GameObjects.Container> = new Map()
    private agentNameTags: Map<string, Phaser.GameObjects.Container> = new Map()
    private agentStatusDots: Map<string, Phaser.GameObjects.Graphics> = new Map()
    private agentSpeechBubbles: Map<string, Phaser.GameObjects.Container> = new Map()
    private agentPlatforms: Map<string, Phaser.GameObjects.Graphics> = new Map()
    private agentAvatarBgs: Map<string, Phaser.GameObjects.Graphics> = new Map()
    private agentStatusRings: Map<string, Phaser.GameObjects.Graphics> = new Map()
    private agentAnimIndicators: Map<string, Phaser.GameObjects.Text> = new Map()
    private agentEmojiTexts: Map<string, Phaser.GameObjects.Text> = new Map()
    private agentGlowTweens: Map<string, Phaser.Tweens.Tween> = new Map()
    private agentDotTweens: Map<string, Phaser.Tweens.Tween> = new Map()
    private detailPopup: Phaser.GameObjects.Container | null = null
    private typewriterText!: Phaser.GameObjects.Text
    private typewriterTarget = ''
    private typewriterIndex = 0
    private typewriterTimer: Phaser.Time.TimerEvent | null = null
    private speechBubbleTimer: Phaser.Time.TimerEvent | null = null
    private catBubbleTimer: Phaser.Time.TimerEvent | null = null
    private earningsTimer: Phaser.Time.TimerEvent | null = null
    private statusAnimTimer: Phaser.Time.TimerEvent | null = null
    private catSprite: Phaser.GameObjects.Sprite | null = null
    private catBubble: Phaser.GameObjects.Container | null = null
    private errorBug: Phaser.GameObjects.Sprite | null = null
    private serverRoom: Phaser.GameObjects.Sprite | null = null
    private syncAnimation: Phaser.GameObjects.Sprite | null = null
    private earningsText!: Phaser.GameObjects.Text
    private earningsBg!: Phaser.GameObjects.Graphics
    private agentsDataRef: AgentData[] = agentsData

    constructor() {
      super({ key: 'OfficeScene' })
    }

    preload() {
      this.load.image('office_bg', '/shopee-office/office_bg_small.webp')
      this.load.image('sofa', '/shopee-office/sofa-idle-v3.png')
      this.load.image('desk', '/shopee-office/desk-v3.webp')

      this.load.spritesheet('coffee_machine', '/shopee-office/coffee-machine-v3-grid.webp', {
        frameWidth: 230,
        frameHeight: 230,
      })
      this.load.spritesheet('serverroom', '/shopee-office/serverroom-spritesheet.webp', {
        frameWidth: 180,
        frameHeight: 251,
      })
      this.load.spritesheet('plants', '/shopee-office/plants-spritesheet.webp', {
        frameWidth: 160,
        frameHeight: 160,
      })
      this.load.spritesheet('posters', '/shopee-office/posters-spritesheet.webp', {
        frameWidth: 160,
        frameHeight: 160,
      })
      this.load.spritesheet('cat', '/shopee-office/cats-spritesheet.webp', {
        frameWidth: 160,
        frameHeight: 160,
      })
      this.load.spritesheet('error_bug', '/shopee-office/error-bug-spritesheet-grid.webp', {
        frameWidth: 180,
        frameHeight: 180,
      })
      this.load.spritesheet('shopee_working', '/shopee-office/shopee-working-spritesheet-grid.webp', {
        frameWidth: 230,
        frameHeight: 144,
      })
      this.load.spritesheet('sync_animation', '/shopee-office/sync-animation-v3-grid.webp', {
        frameWidth: 256,
        frameHeight: 256,
      })
      this.load.spritesheet('flowers', '/shopee-office/flowers-bloom-v2.webp', {
        frameWidth: 65,
        frameHeight: 65,
      })
    }

    create() {
      // Office background
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'office_bg').setOrigin(0.5, 0.5)

      // Sofa (rest area)
      this.add.image(670, 144, 'sofa').setOrigin(0.5, 0.5)

      // Desk (work area)
      this.add.image(218, 417, 'desk').setOrigin(0.5, 0.5)

      // Coffee machine - animated
      const coffeeMachine = this.add.sprite(659, 397, 'coffee_machine').setOrigin(0.5, 0.5)
      if (this.anims.exists('coffee_brew')) this.anims.remove('coffee_brew')
      this.anims.create({
        key: 'coffee_brew',
        frames: this.anims.generateFrameNumbers('coffee_machine', { start: 0, end: 95 }),
        frameRate: 12.5,
        repeat: -1,
      })
      coffeeMachine.play('coffee_brew')

      // Server room - animated
      this.serverRoom = this.add.sprite(1021, 142, 'serverroom').setOrigin(0.5, 0.5)
      if (this.anims.exists('server_run')) this.anims.remove('server_run')
      this.anims.create({
        key: 'server_run',
        frames: this.anims.generateFrameNumbers('serverroom', { start: 0, end: 39 }),
        frameRate: 6,
        repeat: -1,
      })
      this.updateServerAnimation()

      // Plants - 3 instances
      const plantPositions = [
        { x: 565, y: 178, frame: 0 },
        { x: 230, y: 185, frame: 2 },
        { x: 977, y: 496, frame: 4 },
      ]
      plantPositions.forEach((pos) => {
        const plant = this.add.sprite(pos.x, pos.y, 'plants', pos.frame).setOrigin(0.5, 0.5).setInteractive()
        plant.on('pointerdown', () => {
          const nextFrame = (plant.frame.name as number + 1) % 8
          plant.setFrame(nextFrame)
        })
      })

      // Poster - clickable
      const poster = this.add.sprite(252, 66, 'posters', 0).setOrigin(0.5, 0.5).setInteractive()
      poster.on('pointerdown', () => {
        const nextFrame = (poster.frame.name as number + 1) % 6
        poster.setFrame(nextFrame)
      })

      // Cat - clickable
      this.catSprite = this.add.sprite(94, 557, 'cat', 0).setOrigin(0.5, 0.5).setInteractive()
      this.catSprite!.on('pointerdown', () => {
        if (!this.catSprite) return
        const nextFrame = (Number(this.catSprite.frame.name) + 1) % 10
        this.catSprite.setFrame(nextFrame)
        this.showCatBubble()
      })
      this.catBubbleTimer = this.time.addEvent({
        delay: 18000,
        callback: () => this.showCatBubble(),
        loop: true,
      })

      // Error bug - animated
      this.errorBug = this.add.sprite(1007, 221, 'error_bug').setOrigin(0.5, 0.5).setVisible(false)
      if (this.anims.exists('bug_move')) this.anims.remove('bug_move')
      this.anims.create({
        key: 'bug_move',
        frames: this.anims.generateFrameNumbers('error_bug', { start: 0, end: 95 }),
        frameRate: 12,
        repeat: -1,
      })
      this.updateErrorBugAnimation()

      // Shopee working - animated
      const shopeeWorking = this.add.sprite(217, 333, 'shopee_working').setOrigin(0.5, 0.5)
      if (this.anims.exists('shopee_work')) this.anims.remove('shopee_work')
      this.anims.create({
        key: 'shopee_work',
        frames: this.anims.generateFrameNumbers('shopee_working', { start: 0, end: 191 }),
        frameRate: 12,
        repeat: -1,
      })
      shopeeWorking.play('shopee_work')

      // Sync animation
      this.syncAnimation = this.add.sprite(1157, 592, 'sync_animation').setOrigin(0.5, 0.5).setVisible(false)
      if (this.anims.exists('sync_pulse')) this.anims.remove('sync_pulse')
      this.anims.create({
        key: 'sync_pulse',
        frames: this.anims.generateFrameNumbers('sync_animation', { start: 0, end: 51 }),
        frameRate: 12,
        repeat: -1,
      })
      this.updateSyncAnimation()

      // Flowers - clickable
      const flowers = this.add.sprite(310, 390, 'flowers', 0).setOrigin(0.5, 0.5).setInteractive()
      flowers.on('pointerdown', () => {
        const nextFrame = (flowers.frame.name as number + 1) % 8
        flowers.setFrame(nextFrame)
      })

      // ===== Earnings Ticker (top banner) =====
      this.earningsBg = this.add.graphics()
      this.earningsBg.fillStyle(0x000000, 0.75)
      this.earningsBg.fillRoundedRect(10, 8, GAME_WIDTH - 20, 28, 6)
      this.earningsBg.setDepth(900)

      // Shopee brand accent line
      this.earningsBg.fillStyle(0xEE4D2D, 1)
      this.earningsBg.fillRoundedRect(10, 8, 4, 28, 2)

      this.earningsText = this.add.text(24, 22, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ffd700',
      }).setOrigin(0, 0.5).setDepth(950)

      this.showRandomEarnings()

      // Typewriter text - bottom-left
      this.typewriterText = this.add.text(20, GAME_HEIGHT - 40, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 10, y: 5 },
      }).setOrigin(0, 1).setDepth(1000)

      this.typeText('🛒 Welcome to Shopee Office! Affiliate agents are working hard...')

      // Speech bubble timer
      this.speechBubbleTimer = this.time.addEvent({
        delay: 6000,
        callback: () => this.showRandomSpeechBubble(),
        loop: true,
      })

      // Earnings ticker timer
      this.earningsTimer = this.time.addEvent({
        delay: 4000,
        callback: () => this.showRandomEarnings(),
        loop: true,
      })

      // Status animation timer for typing dots, pulse effects
      this.statusAnimTimer = this.time.addEvent({
        delay: 500,
        callback: () => this.updateStatusAnimations(),
        loop: true,
      })

      // Create all agent sprites
      this.agentsDataRef.forEach((agent) => {
        this.createOrUpdateAgent(agent)
      })

      // Start idle bobbing for all agents
      this.time.addEvent({
        delay: 800,
        callback: () => this.bobbleAllAgents(),
        loop: true,
      })
    }

    // ===== Status Animation Indicators =====
    private dotFrame = 0

    updateStatusAnimations() {
      this.dotFrame = (this.dotFrame + 1) % 4
      const dotStr = '.'.repeat(this.dotFrame)

      for (const [id, indicator] of this.agentAnimIndicators.entries()) {
        const agent = this.agentsDataRef.find((a) => a.id === id)
        if (!agent) continue

        switch (agent.status) {
          case 'writing':
            indicator.setText(`typing${dotStr}`)
            break
          case 'researching':
            indicator.setAlpha(indicator.alpha === 1 ? 0.4 : 1)
            break
          case 'executing':
            indicator.setAlpha(indicator.alpha === 1 ? 0.3 : 1)
            break
          case 'syncing': {
            // Rotate the text visually by updating content
            const syncChars = ['⟳', '⟲', '⟳', '⟲']
            indicator.setText(syncChars[this.dotFrame % syncChars.length])
            break
          }
          case 'error':
            indicator.setAlpha(indicator.alpha === 1 ? 0.2 : 1)
            break
        }
      }

      // Pulse status rings for non-idle agents
      for (const [id, ring] of this.agentStatusRings.entries()) {
        const agent = this.agentsDataRef.find((a) => a.id === id)
        if (!agent || agent.status === 'idle') continue

        ring.clear()
        const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.idle
        const pulseAlpha = 0.3 + 0.3 * Math.sin(this.dotFrame * Math.PI / 2)
        const pulseSize = 28 + 2 * Math.sin(this.dotFrame * Math.PI / 2)
        ring.lineStyle(2, statusColor, pulseAlpha)
        ring.strokeCircle(0, 0, pulseSize)
      }
    }

    // ===== Earnings Ticker =====
    showRandomEarnings() {
      if (!this.earningsText) return
      const msg = EARNINGS_MESSAGES[Math.floor(Math.random() * EARNINGS_MESSAGES.length)]
      this.earningsText.setText(msg)

      // Slide-in animation
      this.earningsText.setAlpha(0)
      this.tweens.add({
        targets: this.earningsText,
        alpha: 1,
        x: { from: 24, to: 28 },
        duration: 300,
        ease: 'Power2',
      })
    }

    // ===== Agent Bobbing =====
    bobbleAllAgents() {
      for (const [id, container] of this.agentSprites.entries()) {
        const agent = this.agentsDataRef.find((a) => a.id === id)
        if (!agent || agent.status === 'error') continue

        // Only bob active agents
        const baseY = this.getAgentBaseY(agent)
        const bobOffset = agent.status === 'idle' ? 2 : 4
        this.tweens.add({
          targets: container,
          y: baseY + bobOffset,
          duration: 400,
          ease: 'Sine.easeInOut',
          yoyo: true,
        })
      }
    }

    getAgentBaseY(agent: AgentData): number {
      const zone = ZONE_POSITIONS[agent.status] || ZONE_POSITIONS.idle
      const posIndex = this.agentsDataRef
        .filter((a) => a.status === agent.status && this.agentsDataRef.indexOf(a) < this.agentsDataRef.indexOf(agent))
        .length
      return (zone[posIndex % zone.length] || { y: 200 }).y
    }

    // ===== Agent Management =====
    createOrUpdateAgent(agent: AgentData) {
      const existing = this.agentSprites.get(agent.id)
      const zone = ZONE_POSITIONS[agent.status] || ZONE_POSITIONS.idle
      const posIndex = this.agentsDataRef
        .filter((a) => a.status === agent.status && this.agentsDataRef.indexOf(a) < this.agentsDataRef.indexOf(agent))
        .length
      const pos = zone[posIndex % zone.length]

      if (existing) {
        this.moveAgent(existing, agent, pos)
        this.updateAgentVisuals(existing, agent)
      } else {
        this.createAgentSprite(agent, pos)
      }
    }

    createAgentSprite(agent: AgentData, pos: { x: number; y: number }) {
      const agentColor = AGENT_COLORS[agent.id] || DEFAULT_AGENT_COLOR
      const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.idle

      const container = this.add.container(pos.x, pos.y).setDepth(500)

      // ===== Glowing Status Ring (outer) =====
      const statusRing = this.add.graphics()
      statusRing.lineStyle(2.5, statusColor, 0.5)
      statusRing.strokeCircle(0, 0, 28)
      if (agent.status !== 'idle') {
        statusRing.lineStyle(1, statusColor, 0.2)
        statusRing.strokeCircle(0, 0, 32)
      }
      container.add(statusRing)
      this.agentStatusRings.set(agent.id, statusRing)

      // ===== Colored Circle Avatar Background =====
      const avatarBg = this.add.graphics()
      // Outer dark ring
      avatarBg.fillStyle(0x000000, 0.4)
      avatarBg.fillCircle(0, 0, 26)
      // Colored fill
      avatarBg.fillStyle(agentColor, 0.85)
      avatarBg.fillCircle(0, 0, 24)
      // Inner gradient effect (darker at top)
      avatarBg.fillStyle(0x000000, 0.15)
      avatarBg.fillCircle(0, -4, 22)
      // Highlight arc
      avatarBg.fillStyle(0xffffff, 0.12)
      avatarBg.fillEllipse(0, -8, 18, 10)
      container.add(avatarBg)
      this.agentAvatarBgs.set(agent.id, avatarBg)

      // ===== Emoji (LARGE) =====
      const emojiText = this.add.text(0, 0, agent.emoji, {
        fontSize: '36px',
      }).setOrigin(0.5, 0.5)
      container.add(emojiText)
      this.agentEmojiTexts.set(agent.id, emojiText)

      // ===== Status Animation Indicator (above agent) =====
      const animIndicator = this.add.text(0, -32, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: hexToColorString(statusColor),
      }).setOrigin(0.5, 0.5)
      if (agent.status !== 'idle') {
        this.setStatusAnimText(animIndicator, agent.status)
        animIndicator.setAlpha(1)
      } else {
        animIndicator.setAlpha(0)
      }
      container.add(animIndicator)
      this.agentAnimIndicators.set(agent.id, animIndicator)

      // ===== Floating Name Tag =====
      const nameTagContainer = this.add.container(0, -44).setDepth(510)

      const nameTagBg = this.add.graphics()
      const nameWidth = agent.name.length * 6.5 + 16
      // Background pill shape
      nameTagBg.fillStyle(0x000000, 0.85)
      nameTagBg.fillRoundedRect(-nameWidth / 2, -10, nameWidth, 20, 6)
      // Accent line on top
      nameTagBg.fillStyle(agentColor, 1)
      nameTagBg.fillRoundedRect(-nameWidth / 2, -10, nameWidth, 3, { tl: 6, tr: 6, bl: 0, br: 0 })
      nameTagContainer.add(nameTagBg)

      const nameText = this.add.text(0, 0, agent.name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
      }).setOrigin(0.5, 0.5)
      nameTagContainer.add(nameText)

      container.add(nameTagContainer)
      this.agentNameTags.set(agent.id, nameTagContainer)

      // ===== Platform / Shadow =====
      const platform = this.add.graphics()
      this.drawPlatform(platform, statusColor)
      container.add(platform)
      this.agentPlatforms.set(agent.id, platform)

      // ===== Status Dot (small, below name tag) =====
      const dotGraphics = this.add.graphics()
      this.drawStatusDot(dotGraphics, agent.status)
      container.add(dotGraphics)
      this.agentStatusDots.set(agent.id, dotGraphics)

      // ===== Glow tween for active agents =====
      if (agent.status !== 'idle') {
        const glowTween = this.tweens.add({
          targets: container,
          scale: { from: 1, to: 1.04 },
          duration: 600,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
        this.agentGlowTweens.set(agent.id, glowTween)
      }

      // ===== Click Interaction =====
      container.setSize(56, 56)
      container.setInteractive({ useHandCursor: true })
      container.on('pointerdown', () => {
        this.showAgentDetailPopup(agent)
      })
      // Hover effect
      container.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scale: 1.1,
          duration: 150,
          ease: 'Back.easeOut',
        })
      })
      container.on('pointerout', () => {
        // Reset scale to base (1.0 or current tween target)
        const existingTween = this.agentGlowTweens.get(agent.id)
        if (existingTween) {
          // If there's a glow tween, let it manage scale
          container.setScale(1)
        } else {
          this.tweens.add({
            targets: container,
            scale: 1,
            duration: 150,
            ease: 'Back.easeIn',
          })
        }
      })

      // ===== Entrance Animation =====
      container.setAlpha(0)
      container.setScale(0.3)
      this.tweens.add({
        targets: container,
        alpha: 1,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut',
        delay: this.agentsDataRef.indexOf(agent) * 80,
      })

      this.agentSprites.set(agent.id, container)
    }

    setStatusAnimText(text: Phaser.GameObjects.Text, status: string) {
      switch (status) {
        case 'writing':
          text.setText('typing...')
          text.setStyle({ color: hexToColorString(STATUS_COLORS.writing) })
          break
        case 'researching':
          text.setText('🔍')
          break
        case 'executing':
          text.setText('⚡')
          break
        case 'syncing':
          text.setText('⟳')
          text.setStyle({ color: hexToColorString(STATUS_COLORS.syncing) })
          break
        case 'error':
          text.setText('❗')
          text.setStyle({ color: hexToColorString(STATUS_COLORS.error) })
          break
        default:
          text.setText('')
          break
      }
    }

    drawPlatform(graphics: Phaser.GameObjects.Graphics, statusColor: number) {
      graphics.clear()
      graphics.fillStyle(0x000000, 0.3)
      graphics.fillEllipse(0, 30, 40, 12)
      graphics.lineStyle(2, statusColor, 0.6)
      graphics.strokeEllipse(0, 30, 42, 14)
    }

    moveAgent(container: Phaser.GameObjects.Container, agent: AgentData, targetPos: { x: number; y: number }) {
      this.tweens.add({
        targets: container,
        x: targetPos.x,
        y: targetPos.y,
        duration: 1200,
        ease: 'Power2',
      })

      // Update platform
      const platform = this.agentPlatforms.get(agent.id)
      if (platform) {
        const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.idle
        this.drawPlatform(platform, statusColor)
      }
    }

    updateAgentVisuals(container: Phaser.GameObjects.Container, agent: AgentData) {
      const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.idle

      // Update status dot
      const dot = this.agentStatusDots.get(agent.id)
      if (dot) {
        dot.clear()
        this.drawStatusDot(dot, agent.status)
      }

      // Update name tag (agent name might change)
      const nameTagContainer = this.agentNameTags.get(agent.id)
      if (nameTagContainer) {
        const nameText = nameTagContainer.list.find((c) => c instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text | undefined
        if (nameText) {
          nameText.setText(agent.name)
        }
        // Update background width
        const nameTagBg = nameTagContainer.list.find((c) => c instanceof Phaser.GameObjects.Graphics) as Phaser.GameObjects.Graphics | undefined
        if (nameTagBg) {
          const agentColor = AGENT_COLORS[agent.id] || DEFAULT_AGENT_COLOR
          const nameWidth = agent.name.length * 6.5 + 16
          nameTagBg.clear()
          nameTagBg.fillStyle(0x000000, 0.85)
          nameTagBg.fillRoundedRect(-nameWidth / 2, -10, nameWidth, 20, 6)
          nameTagBg.fillStyle(agentColor, 1)
          nameTagBg.fillRoundedRect(-nameWidth / 2, -10, nameWidth, 3, { tl: 6, tr: 6, bl: 0, br: 0 })
        }
      }

      // Update platform
      const platform = this.agentPlatforms.get(agent.id)
      if (platform) {
        this.drawPlatform(platform, statusColor)
      }

      // Update status ring
      const statusRing = this.agentStatusRings.get(agent.id)
      if (statusRing) {
        statusRing.clear()
        statusRing.lineStyle(2.5, statusColor, 0.5)
        statusRing.strokeCircle(0, 0, 28)
        if (agent.status !== 'idle') {
          statusRing.lineStyle(1, statusColor, 0.2)
          statusRing.strokeCircle(0, 0, 32)
        }
      }

      // Update avatar bg color stays the same (per agent identity)
      // No change needed for avatarBg

      // Update animation indicator
      const animIndicator = this.agentAnimIndicators.get(agent.id)
      if (animIndicator) {
        if (agent.status !== 'idle') {
          this.setStatusAnimText(animIndicator, agent.status)
          animIndicator.setAlpha(1)
        } else {
          animIndicator.setText('')
          animIndicator.setAlpha(0)
        }
      }

      // Update glow tween
      const existingGlow = this.agentGlowTweens.get(agent.id)
      if (existingGlow) {
        existingGlow.stop()
        this.agentGlowTweens.delete(agent.id)
      }
      if (agent.status !== 'idle') {
        const glowTween = this.tweens.add({
          targets: container,
          scale: { from: 1, to: 1.04 },
          duration: 600,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
        this.agentGlowTweens.set(agent.id, glowTween)
      }
    }

    drawStatusDot(graphics: Phaser.GameObjects.Graphics, status: string) {
      const color = STATUS_COLORS[status] || STATUS_COLORS.idle
      // Outer ring
      graphics.fillStyle(0x000000, 0.6)
      graphics.fillCircle(16, -20, 5)
      // Inner dot
      graphics.fillStyle(color, 1)
      graphics.fillCircle(16, -20, 3.5)
      // Pulse glow for active states
      if (status !== 'idle') {
        graphics.fillStyle(color, 0.3)
        graphics.fillCircle(16, -20, 7)
      }
    }

    // ===== Agent Detail Popup =====
    showAgentDetailPopup(agent: AgentData) {
      this.hideDetailPopup()

      const agentColor = AGENT_COLORS[agent.id] || DEFAULT_AGENT_COLOR
      const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.idle

      const popupContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(1100)
      popupContainer.setAlpha(0)
      popupContainer.setScale(0.8)

      // Dark overlay
      const overlay = this.add.graphics()
      overlay.fillStyle(0x000000, 0.5)
      overlay.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT)
      overlay.setInteractive(new Phaser.Geom.Rectangle(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT), Phaser.Geom.Rectangle.Contains)
      overlay.on('pointerdown', () => this.hideDetailPopup())
      popupContainer.add(overlay)

      // Popup panel
      const panelW = 340
      const panelH = 280
      const panelBg = this.add.graphics()
      // Panel shadow
      panelBg.fillStyle(0x000000, 0.3)
      panelBg.fillRoundedRect(-panelW / 2 + 4, -panelH / 2 + 4, panelW, panelH, 12)
      // Panel body
      panelBg.fillStyle(0x1a1a2e, 0.98)
      panelBg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 12)
      // Top accent bar
      panelBg.fillStyle(agentColor, 1)
      panelBg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, 4, { tl: 12, tr: 12, bl: 0, br: 0 })
      // Border
      panelBg.lineStyle(1.5, agentColor, 0.5)
      panelBg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 12)
      popupContainer.add(panelBg)

      // Agent emoji (large)
      const emoji = this.add.text(-panelW / 2 + 30, -panelH / 2 + 35, agent.emoji, {
        fontSize: '48px',
      }).setOrigin(0.5, 0.5)
      popupContainer.add(emoji)

      // Agent name
      const name = this.add.text(-panelW / 2 + 65, -panelH / 2 + 25, agent.name, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0)
      popupContainer.add(name)

      // Agent role (id as human-readable)
      const role = this.add.text(-panelW / 2 + 65, -panelH / 2 + 48, agent.id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#999999',
      }).setOrigin(0, 0)
      popupContainer.add(role)

      // Divider line
      const divider1 = this.add.graphics()
      divider1.fillStyle(0x333333, 0.8)
      divider1.fillRect(-panelW / 2 + 20, -panelH / 2 + 68, panelW - 40, 1)
      popupContainer.add(divider1)

      // Status section
      const statusLabel = this.add.text(-panelW / 2 + 24, -panelH / 2 + 82, 'STATUS', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#777777',
      }).setOrigin(0, 0)
      popupContainer.add(statusLabel)

      // Status indicator dot + text
      const statusDotGfx = this.add.graphics()
      statusDotGfx.fillStyle(statusColor, 1)
      statusDotGfx.fillCircle(-panelW / 2 + 36, -panelH / 2 + 100, 4)
      popupContainer.add(statusDotGfx)

      const statusText = this.add.text(-panelW / 2 + 46, -panelH / 2 + 93, STATUS_LABELS[agent.status] || agent.status.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: hexToColorString(statusColor),
      }).setOrigin(0, 0)
      popupContainer.add(statusText)

      // Divider line
      const divider2 = this.add.graphics()
      divider2.fillStyle(0x333333, 0.8)
      divider2.fillRect(-panelW / 2 + 20, -panelH / 2 + 115, panelW - 40, 1)
      popupContainer.add(divider2)

      // Tasks completed
      const tasksLabel = this.add.text(-panelW / 2 + 24, -panelH / 2 + 130, 'TASKS COMPLETED', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#777777',
      }).setOrigin(0, 0)
      popupContainer.add(tasksLabel)

      const tasksValue = this.add.text(-panelW / 2 + 24, -panelH / 2 + 148, String(agent.tasksCompleted), {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: hexToColorString(agentColor),
      }).setOrigin(0, 0)
      popupContainer.add(tasksValue)

      // Divider line
      const divider3 = this.add.graphics()
      divider3.fillStyle(0x333333, 0.8)
      divider3.fillRect(-panelW / 2 + 20, -panelH / 2 + 180, panelW - 40, 1)
      popupContainer.add(divider3)

      // Current detail text
      const detailLabel = this.add.text(-panelW / 2 + 24, -panelH / 2 + 195, 'CURRENT ACTIVITY', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#777777',
      }).setOrigin(0, 0)
      popupContainer.add(detailLabel)

      const detailText = this.add.text(-panelW / 2 + 24, -panelH / 2 + 215, agent.detail || 'No current activity', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#cccccc',
        wordWrap: { width: panelW - 52 },
      }).setOrigin(0, 0)
      popupContainer.add(detailText)

      // Close button
      const closeBtn = this.add.graphics()
      const closeBtnX = panelW / 2 - 14
      const closeBtnY = -panelH / 2 + 14
      closeBtn.fillStyle(0x444444, 0.8)
      closeBtn.fillRoundedRect(closeBtnX - 12, closeBtnY - 12, 24, 24, 6)
      closeBtn.lineStyle(1, 0x888888, 0.5)
      closeBtn.strokeRoundedRect(closeBtnX - 12, closeBtnY - 12, 24, 24, 6)
      popupContainer.add(closeBtn)

      const closeX = this.add.text(closeBtnX, closeBtnY, '✕', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      }).setOrigin(0.5, 0.5)
      popupContainer.add(closeX)

      // Close button hit zone
      const closeZone = this.add.zone(closeBtnX, closeBtnY, 24, 24).setInteractive({ useHandCursor: true })
      closeZone.on('pointerdown', () => this.hideDetailPopup())
      closeZone.on('pointerover', () => {
        closeBtn.clear()
        closeBtn.fillStyle(0xEE4D2D, 1)
        closeBtn.fillRoundedRect(closeBtnX - 12, closeBtnY - 12, 24, 24, 6)
      })
      closeZone.on('pointerout', () => {
        closeBtn.clear()
        closeBtn.fillStyle(0x444444, 0.8)
        closeBtn.fillRoundedRect(closeBtnX - 12, closeBtnY - 12, 24, 24, 6)
        closeBtn.lineStyle(1, 0x888888, 0.5)
        closeBtn.strokeRoundedRect(closeBtnX - 12, closeBtnY - 12, 24, 24, 6)
      })
      popupContainer.add(closeZone)

      this.detailPopup = popupContainer

      // Popup enter animation
      this.tweens.add({
        targets: popupContainer,
        alpha: 1,
        scale: 1,
        duration: 250,
        ease: 'Back.easeOut',
      })
    }

    hideDetailPopup() {
      if (!this.detailPopup) return
      const popup = this.detailPopup
      this.detailPopup = null

      this.tweens.add({
        targets: popup,
        alpha: 0,
        scale: 0.8,
        duration: 150,
        ease: 'Back.easeIn',
        onComplete: () => {
          popup.destroy()
        },
      })
    }

    // ===== Animation Control =====
    updateServerAnimation() {
      if (!this.serverRoom) return
      const hasSyncing = this.agentsDataRef.some((a) => a.status === 'syncing')
      const hasActive = this.agentsDataRef.some((a) => a.status !== 'idle')
      if (hasActive || hasSyncing) {
        this.serverRoom.setVisible(true)
        if (!this.serverRoom.anims.isPlaying) this.serverRoom.play('server_run')
      } else {
        this.serverRoom.setVisible(true)
        this.serverRoom.stop()
        this.serverRoom.setFrame(0)
      }
    }

    updateErrorBugAnimation() {
      if (!this.errorBug) return
      const hasError = this.agentsDataRef.some((a) => a.status === 'error')
      if (hasError) {
        this.errorBug.setVisible(true)
        if (!this.errorBug.anims.isPlaying) this.errorBug.play('bug_move')
      } else {
        this.errorBug.setVisible(false)
        this.errorBug.stop()
      }
    }

    updateSyncAnimation() {
      if (!this.syncAnimation) return
      const hasSyncing = this.agentsDataRef.some((a) => a.status === 'syncing')
      if (hasSyncing) {
        this.syncAnimation.setVisible(true)
        if (!this.syncAnimation.anims.isPlaying) this.syncAnimation.play('sync_pulse')
      } else {
        this.syncAnimation.setVisible(false)
        this.syncAnimation.stop()
      }
    }

    // ===== Speech Bubbles =====
    showRandomSpeechBubble() {
      const activeAgents = this.agentsDataRef.filter((a) => a.status !== 'idle' && a.status !== 'error')
      if (activeAgents.length === 0) return

      const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)]
      const messages = SPEECH_BUBBLES[agent.status] || SPEECH_BUBBLES.idle
      const message = messages[Math.floor(Math.random() * messages.length)]
      this.showSpeechBubble(agent.id, agent.name, agent.emoji, message)
    }

    showSpeechBubble(agentId: string, _name: string, emoji: string, message: string) {
      this.hideSpeechBubble(agentId)

      const container = this.agentSprites.get(agentId)
      if (!container) return

      const bubbleContainer = this.add.container(0, -70).setDepth(600)
      bubbleContainer.setAlpha(0)

      const bubbleBg = this.add.graphics()
      const textWidth = message.length * 6.2 + 40
      const bubbleWidth = Math.min(textWidth, 240)
      const bubbleHeight = 38

      // Bubble shadow
      bubbleBg.fillStyle(0x000000, 0.15)
      bubbleBg.fillRoundedRect(-bubbleWidth / 2 + 2, -bubbleHeight / 2 + 2, bubbleWidth, bubbleHeight, 10)
      // Bubble body
      bubbleBg.fillStyle(0xffffff, 0.97)
      bubbleBg.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 10)
      // Tail pointing down
      bubbleBg.fillTriangle(-6, bubbleHeight / 2 - 1, 6, bubbleHeight / 2 - 1, 0, bubbleHeight / 2 + 9)
      // Border with agent accent color
      const agentColor = AGENT_COLORS[agentId] || DEFAULT_AGENT_COLOR
      bubbleBg.lineStyle(1.5, agentColor, 0.7)
      bubbleBg.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 10)
      // Colored top accent
      bubbleBg.fillStyle(agentColor, 0.2)
      bubbleBg.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, 10, { tl: 10, tr: 10, bl: 0, br: 0 })

      bubbleContainer.add(bubbleBg)

      // Emoji icon (small, left-aligned inside bubble)
      const emojiIcon = this.add.text(-bubbleWidth / 2 + 14, 0, emoji, {
        fontSize: '16px',
      }).setOrigin(0, 0.5)
      bubbleContainer.add(emojiIcon)

      // Text
      const bubbleText = this.add.text(-bubbleWidth / 2 + 34, 0, message, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#333333',
        wordWrap: { width: bubbleWidth - 52 },
        align: 'left',
      }).setOrigin(0, 0.5)
      bubbleContainer.add(bubbleText)

      container.add(bubbleContainer)
      this.agentSpeechBubbles.set(agentId, bubbleContainer)

      // Smooth slide-in animation
      this.tweens.add({
        targets: bubbleContainer,
        alpha: 1,
        y: -82,
        duration: 350,
        ease: 'Back.easeOut',
      })

      this.time.delayedCall(5000, () => {
        this.hideSpeechBubble(agentId)
      })
    }

    hideSpeechBubble(agentId: string) {
      const bubble = this.agentSpeechBubbles.get(agentId)
      if (bubble) {
        this.tweens.add({
          targets: bubble,
          alpha: 0,
          y: bubble.y - 12,
          scaleX: 0.9,
          scaleY: 0.9,
          duration: 250,
          ease: 'Back.easeIn',
          onComplete: () => {
            bubble.destroy()
            this.agentSpeechBubbles.delete(agentId)
          },
        })
      }
    }

    // ===== Cat Bubble =====
    showCatBubble() {
      if (this.catBubble) {
        this.catBubble.destroy()
        this.catBubble = null
      }

      const catMessages = [
        'Meow! 😺',
        'Feed me! 🐟',
        '*purrs* 😻',
        'Shopee time!',
        'Keyboard cat! ⌨️',
        'Sleepy... 😴',
      ]
      const message = catMessages[Math.floor(Math.random() * catMessages.length)]

      this.catBubble = this.add.container(94, 500).setDepth(600)
      this.catBubble!.setAlpha(0)

      const bubbleBg = this.add.graphics()
      // Shadow
      bubbleBg.fillStyle(0x000000, 0.12)
      bubbleBg.fillRoundedRect(-38, -13, 80, 30, 8)
      // Body
      bubbleBg.fillStyle(0xffffff, 0.97)
      bubbleBg.fillRoundedRect(-40, -15, 80, 30, 8)
      // Tail
      bubbleBg.fillTriangle(-3, 15, 3, 15, 0, 22)
      // Border
      bubbleBg.lineStyle(1, 0xEE4D2D, 0.6)
      bubbleBg.strokeRoundedRect(-40, -15, 80, 30, 8)

      const text = this.add.text(0, 0, message, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#333333',
      }).setOrigin(0.5, 0.5)

      this.catBubble!.add([bubbleBg, text])
      this.add.existing(this.catBubble!)

      this.tweens.add({
        targets: this.catBubble!,
        alpha: 1,
        y: 490,
        duration: 300,
        ease: 'Back.easeOut',
      })

      this.time.delayedCall(4000, () => {
        if (this.catBubble) {
          this.tweens.add({
            targets: this.catBubble!,
            alpha: 0,
            y: 480,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 250,
            ease: 'Back.easeIn',
            onComplete: () => {
              if (this.catBubble) {
                this.catBubble.destroy()
                this.catBubble = null
              }
            },
          })
        }
      })
    }

    // ===== Typewriter Effect =====
    typeText(text: string) {
      if (!this.typewriterText) return
      this.typewriterTarget = text
      this.typewriterIndex = 0
      this.typewriterText.setText('')

      if (this.typewriterTimer) {
        this.typewriterTimer.destroy()
      }

      this.typewriterTimer = this.time.addEvent({
        delay: 35,
        callback: () => {
          if (this.typewriterIndex < this.typewriterTarget.length) {
            this.typewriterText.setText(this.typewriterTarget.substring(0, this.typewriterIndex + 1))
            this.typewriterIndex++
          } else {
            if (this.typewriterTimer) {
              this.typewriterTimer.destroy()
              this.typewriterTimer = null
            }
          }
        },
        loop: true,
      })
    }

    // ===== Public Update Method =====
    updateAgents(newAgents: AgentData[]) {
      this.agentsDataRef = newAgents

      // Remove agents that no longer exist
      for (const [id, sprite] of this.agentSprites.entries()) {
        if (!newAgents.find((a) => a.id === id)) {
          this.hideSpeechBubble(id)
          // Clean up glow tweens
          const glow = this.agentGlowTweens.get(id)
          if (glow) {
            glow.stop()
            this.agentGlowTweens.delete(id)
          }
          const dotTween = this.agentDotTweens.get(id)
          if (dotTween) {
            dotTween.stop()
            this.agentDotTweens.delete(id)
          }
          sprite.destroy()
          this.agentSprites.delete(id)
          this.agentNameTags.delete(id)
          this.agentStatusDots.delete(id)
          this.agentPlatforms.delete(id)
          this.agentAvatarBgs.delete(id)
          this.agentStatusRings.delete(id)
          this.agentAnimIndicators.delete(id)
          this.agentEmojiTexts.delete(id)
        }
      }

      // Create or update agents
      newAgents.forEach((agent) => {
        this.createOrUpdateAgent(agent)
      })

      this.updateServerAnimation()
      this.updateErrorBugAnimation()
      this.updateSyncAnimation()

      // Update typewriter with Shopee-affiliate status
      const activeCount = newAgents.filter((a) => a.status !== 'idle').length
      const errorCount = newAgents.filter((a) => a.status === 'error').length
      let statusMsg = `🛒 Shopee Office: ${activeCount}/${newAgents.length} agents active`
      if (errorCount > 0) {
        statusMsg += ` | ${errorCount} error${errorCount > 1 ? 's' : ''}!`
      } else {
        const randomAgent = newAgents[Math.floor(Math.random() * newAgents.length)]
        if (randomAgent) {
          statusMsg += ` | ${randomAgent.emoji} ${randomAgent.name}: ${randomAgent.detail}`
        }
      }
      this.typeText(statusMsg)
    }

    cleanup() {
      if (this.typewriterTimer) this.typewriterTimer.destroy()
      if (this.speechBubbleTimer) this.speechBubbleTimer.destroy()
      if (this.catBubbleTimer) this.catBubbleTimer.destroy()
      if (this.earningsTimer) this.earningsTimer.destroy()
      if (this.statusAnimTimer) this.statusAnimTimer.destroy()
      // Clean up all glow tweens
      for (const [, tween] of this.agentGlowTweens.entries()) {
        tween.stop()
      }
      for (const [, tween] of this.agentDotTweens.entries()) {
        tween.stop()
      }
      this.agentSprites.clear()
      this.agentNameTags.clear()
      this.agentStatusDots.clear()
      this.agentSpeechBubbles.clear()
      this.agentPlatforms.clear()
      this.agentAvatarBgs.clear()
      this.agentStatusRings.clear()
      this.agentAnimIndicators.clear()
      this.agentEmojiTexts.clear()
      this.agentGlowTweens.clear()
      this.agentDotTweens.clear()
    }
  }

  return OfficeScene
}

// ===== React Component =====
export default function PhaserGame({ agents, onStatusUpdate, className }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<unknown>(null)
  const sceneRef = useRef<unknown>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const isLoadingRef = useRef(true)
  const prevAgentsRef = useRef<AgentData[]>(agents)
  const agentsRef = useRef<AgentData[]>(agents)

  // Keep agentsRef in sync with latest agents prop
  useEffect(() => {
    agentsRef.current = agents
  }, [agents])

  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    async function initPhaser() {
      try {
        const Phaser = await import('phaser')

        if (!mounted || !containerRef.current) return

        const OfficeSceneClass = await createOfficeScene(agents, onStatusUpdate)

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
          pixelArt: true,
          roundPixels: true,
          antialias: false,
          scene: OfficeSceneClass,
        }

        const game = new Phaser.Game(config)
        gameRef.current = game

        const scene = game.scene.getScene('OfficeScene')
        if (scene) {
          scene.events.once('create', () => {
            if (!mounted) return
            sceneRef.current = scene
            isLoadingRef.current = false
            setIsLoading(false)
            // Populate agents immediately if data is now available
            // (agents may have loaded while Phaser was initializing)
            const latestAgents = agentsRef.current
            if (latestAgents.length > 0) {
              const typedScene = scene as { updateAgents?: (agents: AgentData[]) => void }
              if (typedScene.updateAgents) {
                typedScene.updateAgents(latestAgents)
                prevAgentsRef.current = latestAgents
              }
            }
          })
        }

        // Fallback: retry agent population every 500ms for up to 10s
        // This handles the case where agents load after scene creates
        let retryCount = 0
        const retryInterval = setInterval(() => {
          if (!mounted) { clearInterval(retryInterval); return }
          retryCount++
          if (retryCount > 20) { clearInterval(retryInterval); return }
          const typedScene = sceneRef.current as { updateAgents?: (agents: AgentData[]) => void } | null
          const latestAgents = agentsRef.current
          if (typedScene && typedScene.updateAgents && latestAgents.length > 0) {
            typedScene.updateAgents(latestAgents)
            prevAgentsRef.current = latestAgents
            clearInterval(retryInterval)
          }
        }, 500)

        setTimeout(() => {
          if (mounted && isLoadingRef.current) {
            sceneRef.current = game.scene.getScene('OfficeScene')
            isLoadingRef.current = false
            setIsLoading(false)
          }
        }, 3000)
      } catch (err) {
        if (mounted) {
          console.error('Failed to load Phaser:', err)
          setLoadError('Failed to load game engine. Please refresh.')
          setIsLoading(false)
        }
      }
    }

    initPhaser()

    return () => {
      mounted = false
      const scene = sceneRef.current as { cleanup?: () => void } | null
      if (scene && scene.cleanup) {
        scene.cleanup()
      }
      const game = gameRef.current as { destroy: (complete?: boolean) => void } | null
      if (game) {
        game.destroy(true)
        gameRef.current = null
        sceneRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current as { updateAgents?: (agents: AgentData[]) => void } | null
    if (scene && scene.updateAgents) {
      const agentsChanged =
        prevAgentsRef.current.length !== agents.length ||
        prevAgentsRef.current.some(
          (prev, idx) =>
            prev.status !== agents[idx]?.status ||
            prev.id !== agents[idx]?.id ||
            prev.detail !== agents[idx]?.detail,
        )
      if (agentsChanged) {
        scene.updateAgents(agents)
        prevAgentsRef.current = agents
      }
    }
  }, [agents])

  useEffect(() => {
    function handleResize() {
      const game = gameRef.current as { scale: { resize: (w: number, h: number) => void } } | null
      if (game) {
        game.scale.resize(GAME_WIDTH, GAME_HEIGHT)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`relative w-full ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1a1a2e] rounded-lg gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-bounce">🛒</span>
            <span className="text-xl font-bold text-white font-mono">Loading Shopee Office...</span>
          </div>
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#EE4D2D] to-[#f97316] rounded-full animate-loading-bar"
              style={{
                width: '60%',
                animation: 'loadingBar 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <p className="text-sm text-gray-400 font-mono">Preparing affiliate workspace...</p>
          <style jsx>{`
            @keyframes loadingBar {
              0% { width: 0%; margin-left: 0%; }
              50% { width: 70%; margin-left: 15%; }
              100% { width: 0%; margin-left: 100%; }
            }
          `}</style>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1a1a2e] rounded-lg gap-3">
          <span className="text-4xl">⚠️</span>
          <p className="text-red-400 font-mono text-sm">{loadError}</p>
          <button
            className="px-4 py-2 bg-[#EE4D2D] text-white rounded-lg font-mono text-sm hover:bg-[#d4431f] transition-colors"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{
          imageRendering: 'pixelated',
          aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
        }}
      />
    </div>
  )
}
