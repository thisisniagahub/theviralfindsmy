/**
 * Player (Boss) entity for Shopee Office.
 * Inspired by agent-town's Player class.
 * The boss walks around the office using WASD/Arrow keys.
 */

import * as Phaser from 'phaser'
import { MOVE_SPEED, BOSS_SPAWN_X, BOSS_SPAWN_Y } from '../config'

type Direction = 'down' | 'up' | 'left' | 'right'

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd: Record<string, Phaser.Input.Keyboard.Key>
  private facing: Direction = 'up'
  private hasMovedOnce = false
  private arrow: Phaser.GameObjects.Sprite | null = null
  private nameTag: Phaser.GameObjects.Text | null = null

  constructor(scene: Phaser.Scene, x = BOSS_SPAWN_X, y = BOSS_SPAWN_Y, initialFacing: Direction = 'up') {
    this.facing = initialFacing

    // Create boss from a premium humanoid texture
    this.sprite = scene.physics.add.sprite(x, y, 'worker_male_1', 0)
    this.sprite.setDepth(15)
    this.sprite.setCollideWorldBounds(true)
    
    // Add a visual crown indicator since it's the boss
    const crown = scene.add.text(0, -20, '👑', { fontSize: '16px' }).setOrigin(0.5)
    this.sprite.setData('crown', crown)

    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setSize(24, 10)
    body.setOffset(12, 38)
    body.allowGravity = false
    body.pushable = false

    // Init arrow indicator
    this.initArrow(scene, x, y)

    // Name tag
    this.nameTag = scene.add
      .text(x, y + 30, '👤 Boss (You)', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffd700',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 0)
      .setDepth(20)

    // Controls
    const kb = scene.input.keyboard
    if (!kb) throw new Error('Keyboard plugin not available')
    this.cursors = kb.createCursorKeys()
    kb.clearCaptures()
    this.wasd = kb.addKeys(
      {
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
      },
      false,
    ) as Record<string, Phaser.Input.Keyboard.Key>
  }

  private drawBoss(g: Phaser.GameObjects.Graphics) {
    // Body
    g.fillStyle(0xee4d2d, 1) // Shopee brand red
    g.fillRoundedRect(12, 12, 24, 28, 4)
    // Head
    g.fillStyle(0xffcc99, 1)
    g.fillCircle(24, 10, 8)
    // Crown
    g.fillStyle(0xffd700, 1)
    g.fillTriangle(16, 4, 20, 0, 24, 4)
    g.fillTriangle(20, 2, 24, -2, 28, 2)
    g.fillTriangle(24, 0, 28, -2, 32, 4)
    // Eyes
    g.fillStyle(0x000000, 1)
    g.fillCircle(20, 9, 1.5)
    g.fillCircle(28, 9, 1.5)
    // Smile
    g.lineStyle(1.5, 0x000000, 1)
    g.beginPath()
    g.moveTo(20, 13)
    g.lineTo(28, 13)
    g.strokePath()
  }

  private initArrow(scene: Phaser.Scene, _x: number, y: number) {
    const arrowGfx = scene.add.graphics()
    arrowGfx.fillStyle(0xffd700, 1)
    // Simple down arrow
    arrowGfx.fillTriangle(20, 0, 28, 0, 24, 10)
    arrowGfx.fillRect(22, 10, 4, 6)
    arrowGfx.generateTexture('boss_arrow', 48, 20)
    arrowGfx.destroy()

    this.arrow = scene.add.sprite(24, y - 30, 'boss_arrow')
    this.arrow.setDepth(25)

    // Bounce animation
    if (!scene.anims.exists('boss_arrow_bounce')) {
      scene.anims.create({
        key: 'boss_arrow_bounce',
        frames: [],
        frameRate: 6,
        repeat: -1,
      })
    }
    scene.tweens.add({
      targets: this.arrow,
      y: y - 36,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  isMoving(): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    return body.velocity.x !== 0 || body.velocity.y !== 0
  }

  update() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    const speed = MOVE_SPEED

    // Input Focus Guard — don't move when typing in inputs or when a dialog is open
    const active = document.activeElement
    if (active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.getAttribute('contenteditable') === 'true' ||
      active.closest('[role="dialog"]') ||
      active.closest('.shopee-office-panel')
    )) {
      body.setVelocity(0, 0)
      return
    }

    let vx = 0
    let vy = 0

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed
    else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed

    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed
    else if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2
      vx *= factor
      vy *= factor
    }

    body.setVelocity(vx, vy)

    const moving = vx !== 0 || vy !== 0

    if (!this.hasMovedOnce && moving && this.arrow) {
      this.hasMovedOnce = true
      this.arrow.destroy()
      this.arrow = null
    }

    // Y-sorting
    this.sprite.setDepth(this.sprite.y)
    const uiDepth = this.sprite.y + 1
    this.nameTag?.setDepth(uiDepth)
    if (this.arrow) this.arrow.setDepth(uiDepth + 10)
    
    // Update indicator positions
    const crown = this.sprite.getData('crown') as Phaser.GameObjects.Text | undefined
    if (crown) {
      crown.setPosition(this.sprite.x, this.sprite.y - 32)
      crown.setDepth(uiDepth + 5)
    }

    if (this.arrow) {
      this.arrow.setPosition(this.sprite.x, this.sprite.y - 45)
    }

    // Update name tag position
    if (this.nameTag) {
      this.nameTag.setPosition(this.sprite.x, this.sprite.y + 34)
    }

    if (moving) {
      if (vx < 0) { this.facing = 'left' }
      else if (vx > 0) { this.facing = 'right' }
      else if (vy < 0) { this.facing = 'up' }
      else if (vy > 0) { this.facing = 'down' }
    }
  }

  destroy() {
    if (this.arrow) {
      this.arrow.destroy()
      this.arrow = null
    }
    if (this.nameTag) {
      this.nameTag.destroy()
      this.nameTag = null
    }
    this.sprite.destroy()
  }
}
