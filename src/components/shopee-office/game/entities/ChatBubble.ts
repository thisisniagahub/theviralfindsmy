/**
 * Chat Bubble entity for agents.
 * Speech bubbles that appear above agents showing their current activity.
 * Glassmorphism inspired premium design.
 */

import * as Phaser from 'phaser'

export class ChatBubble {
  private container: Phaser.GameObjects.Container | null = null
  private bg: Phaser.GameObjects.Graphics | null = null
  private text: Phaser.GameObjects.Text | null = null
  private hideTimer: Phaser.Time.TimerEvent | null = null
  private scene: Phaser.Scene
  private visible = false
  private currentMessage = ''
  private typingTimer: Phaser.Time.TimerEvent | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  show(message: string, x: number, y: number, ttl = 5000) {
    // If the same message is already being typed/shown, don't restart (less flickering)
    if (this.visible && this.currentMessage === message) return
    
    this.hide(true) // Immediate hide for replacement

    this.currentMessage = message
    this.visible = true

    // Create container
    this.container = this.scene.add.container(x, y - 60).setDepth(1000)
    this.container.setAlpha(0)
    this.container.setScale(0.8)

    // Text object (styled for premium look)
    const textObj = this.scene.add.text(0, 0, '', {
      fontFamily: '"Outfit", "Inter", "sans-serif"',
      fontSize: '12px',
      color: '#ffffff',
      wordWrap: { width: 180 },
      align: 'left',
      lineSpacing: 4,
      fontStyle: '500',
    }).setOrigin(0.5, 0.5).setDepth(1002)

    this.text = textObj
    this.bg = this.scene.add.graphics().setDepth(1001)
    this.container.add([this.bg, this.text])

    // Pre-calculate bubble size
    const tempText = this.scene.add.text(0, 0, message, {
      fontFamily: '"Outfit", "Inter", "sans-serif"',
      fontSize: '12px',
      wordWrap: { width: 180 }
    }).setVisible(false)
    
    const textWidth = Math.max(tempText.width + 24, 60)
    const textHeight = Math.max(tempText.height + 20, 36)
    tempText.destroy()

    // Draw Premium Bubble (Glassmorphism look)
    // 1. Shadow
    this.bg.fillStyle(0x000000, 0.3)
    this.bg.fillRoundedRect(-textWidth / 2 + 4, -textHeight / 2 + 4, textWidth, textHeight, 12)
    
    // 2. Main Body (Darker, translucent)
    this.bg.fillStyle(0x1a1a2e, 0.85)
    this.bg.fillRoundedRect(-textWidth / 2, -textHeight / 2, textWidth, textHeight, 12)
    
    // 3. Subtle Gradient/Border
    this.bg.lineStyle(1.5, 0xffffff, 0.15)
    this.bg.strokeRoundedRect(-textWidth / 2, -textHeight / 2, textWidth, textHeight, 12)
    
    // 4. Shopee Orange Tick (Side Accent instead of full border for cleaner look)
    this.bg.fillStyle(0xee4d2d, 1)
    this.bg.fillRoundedRect(-textWidth / 2, -textHeight / 2 + 8, 3, textHeight - 16, { tl: 0, bl: 0, tr: 2, br: 2 })
    
    // 5. Tail
    this.bg.fillStyle(0x1a1a2e, 0.85)
    this.bg.fillTriangle(-8, textHeight / 2 - 1, 8, textHeight / 2 - 1, 0, textHeight / 2 + 10)
    this.bg.lineStyle(1.5, 0xffffff, 0.1)
    this.bg.lineBetween(-8, textHeight / 2 - 1, 0, textHeight / 2 + 10)
    this.bg.lineBetween(8, textHeight / 2 - 1, 0, textHeight / 2 + 10)

    // Pop and Fade In
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      y: y - 80,
      duration: 500,
      ease: 'Back.easeOut',
    })

    // Typewriter Effect
    let currentIdx = 0
    this.typingTimer = this.scene.time.addEvent({
      delay: 35,
      callback: () => {
        if (!this.text) return
        if (currentIdx < message.length) {
          this.text.text += message[currentIdx]
          currentIdx++
        }
      },
      repeat: message.length - 1
    })

    // Auto-hide
    if (this.hideTimer) this.hideTimer.destroy()
    this.hideTimer = this.scene.time.delayedCall(ttl + (message.length * 35), () => this.hide())
  }

  hide(immediate = false) {
    if (!this.container || !this.visible) return

    const container = this.container
    this.visible = false
    this.container = null
    this.bg = null
    this.text = null
    this.currentMessage = ''

    if (this.hideTimer) {
      this.hideTimer.destroy()
      this.hideTimer = null
    }
    if (this.typingTimer) {
      this.typingTimer.destroy()
      this.typingTimer = null
    }

    if (immediate) {
      container.destroy()
    } else {
      this.scene.tweens.add({
        targets: container,
        alpha: 0,
        y: container.y - 15,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 300,
        ease: 'Power2.easeIn',
        onComplete: () => container.destroy(),
      })
    }
  }

  updatePosition(x: number, y: number) {
    if (this.container && this.visible) {
      // Smoothly follow (lerp-like)
      const targetY = y - 80
      this.container.x = x
      this.container.y += (targetY - this.container.y) * 0.1
    }
  }

  setDepth(depth: number) {
    this.container?.setDepth(depth)
  }

  isVisible(): boolean {
    return this.visible
  }

  destroy() {
    this.hide(true)
  }
}

