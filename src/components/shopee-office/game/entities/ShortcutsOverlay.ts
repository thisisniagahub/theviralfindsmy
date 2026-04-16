import * as Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../config'

export class ShortcutsOverlay {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  toggle() {
    if (this.container) {
      this.destroy()
      return
    }

    this.container = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(4000)
    this.container.setScrollFactor(0)
    
    const bg = this.scene.add.graphics()
    bg.fillStyle(0x000000, 0.85)
    bg.fillRoundedRect(-200, -180, 400, 360, 12)
    bg.lineStyle(2, 0xEE4D2D, 0.8)
    bg.strokeRoundedRect(-200, -180, 400, 360, 12)
    this.container.add(bg)

    const shortcuts = [
      ['WASD / ←↑↓→', 'Move Boss'],
      ['E', 'Interact with Agent'],
      ['H', 'Toggle Help'],
      ['Click Agent', 'View Details'],
      ['Scroll', 'Zoom In/Out'],
    ]

    const title = this.scene.add.text(0, -160, '⌨️ Keyboard Shortcuts', {
      fontFamily: 'monospace', fontSize: '16px', color: '#EE4D2D', fontStyle: 'bold',
    }).setOrigin(0.5, 0)
    this.container.add(title)

    shortcuts.forEach(([key, action], i) => {
      const keyText = this.scene.add.text(-170, -120 + i * 40, key, {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffd700',
        backgroundColor: 'rgba(255,255,255,0.1)', padding: { x: 6, y: 4 },
      })
      const actionText = this.scene.add.text(-30, -120 + i * 40, action, {
        fontFamily: 'monospace', fontSize: '13px', color: '#e0e0e0',
        padding: { x: 0, y: 4 },
      })
      this.container!.add([keyText, actionText])
    })

    // Click to close
    bg.setInteractive(new Phaser.Geom.Rectangle(-200, -180, 400, 360), Phaser.Geom.Rectangle.Contains)
    bg.on('pointerdown', () => this.destroy())
  }

  destroy() {
    if (this.container) {
      this.container.destroy()
      this.container = null
    }
  }
}
