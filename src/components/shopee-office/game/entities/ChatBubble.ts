/**
 * Chat Bubble entity for agents.
 * Speech bubbles that appear above agents showing their current activity.
 * Inspired by agent-town's ChatBubble class.
 */

import * as Phaser from 'phaser'

export class ChatBubble {
  private container: Phaser.GameObjects.Container | null = null
  private bg: Phaser.GameObjects.Graphics | null = null
  private text: Phaser.GameObjects.Text | null = null
  private hideTimer: Phaser.Time.TimerEvent | null = null
  private scene: Phaser.Scene
  private visible = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  show(message: string, x: number, y: number, ttl = 5000) {
    this.hide()

    this.container = this.scene.add.container(x, y).setDepth(600)
    this.container.setAlpha(0)

    const textObj = this.scene.add.text(0, 0, message, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#333333',
      wordWrap: { width: 180 },
      align: 'left',
    }).setOrigin(0.5, 0.5)

    // Measure text to size the bubble
    const textWidth = Math.max(textObj.width + 24, 60)
    const textHeight = Math.max(textObj.height + 16, 30)

    this.bg = this.scene.add.graphics()

    // Shadow
    this.bg.fillStyle(0x000000, 0.12)
    this.bg.fillRoundedRect(-textWidth / 2 + 2, -textHeight / 2 + 2, textWidth, textHeight, 8)
    // Body
    this.bg.fillStyle(0xffffff, 0.97)
    this.bg.fillRoundedRect(-textWidth / 2, -textHeight / 2, textWidth, textHeight, 8)
    // Tail
    this.bg.fillTriangle(-5, textHeight / 2 - 1, 5, textHeight / 2 - 1, 0, textHeight / 2 + 8)
    // Border
    this.bg.lineStyle(1.5, 0xee4d2d, 0.6)
    this.bg.strokeRoundedRect(-textWidth / 2, -textHeight / 2, textWidth, textHeight, 8)
    // Top accent
    this.bg.fillStyle(0xee4d2d, 0.15)
    this.bg.fillRoundedRect(-textWidth / 2, -textHeight / 2, textWidth, 6, { tl: 8, tr: 8, bl: 0, br: 0 })

    this.text = textObj

    this.container.add([this.bg, this.text])
    this.visible = true

    // Slide-in animation
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      y: y - 12,
      duration: 300,
      ease: 'Back.easeOut',
    })

    // Auto-hide
    if (this.hideTimer) this.hideTimer.destroy()
    this.hideTimer = this.scene.time.delayedCall(ttl, () => this.hide())
  }

  hide() {
    if (!this.container || !this.visible) return

    const container = this.container
    this.visible = false
    this.container = null
    this.bg = null
    this.text = null

    if (this.hideTimer) {
      this.hideTimer.destroy()
      this.hideTimer = null
    }

    this.scene.tweens.add({
      targets: container,
      alpha: 0,
      y: container.y - 10,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 200,
      onComplete: () => container.destroy(),
    })
  }

  updatePosition(x: number, y: number) {
    if (this.container && this.visible) {
      // Keep relative offset
      this.container.setPosition(x, y)
    }
  }

  isVisible(): boolean {
    return this.visible
  }

  destroy() {
    this.hide()
  }
}
