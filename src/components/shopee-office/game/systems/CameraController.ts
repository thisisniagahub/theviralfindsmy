/**
 * Camera Controller for the Shopee Office scene.
 * Smooth camera following with zoom controls and drag-to-pan.
 * Inspired by agent-town's CameraController.
 */

import * as Phaser from 'phaser'
import { CAMERA_LERP, ZOOM_DEFAULT, ZOOM_MIN, ZOOM_MAX, ZOOM_SENSITIVITY } from '../config'

export class CameraController {
  private camera: Phaser.Cameras.Scene2D.Camera
  private target: Phaser.GameObjects.Sprite
  private mapWidth: number
  private mapHeight: number
  private _cameraFollowing = true

  // Drag-to-pan
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private cameraStartX = 0
  private cameraStartY = 0
  private dragThreshold = 8 // pixels before drag registers

  constructor(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.Sprite,
    mapWidth: number,
    mapHeight: number,
  ) {
    this.camera = scene.cameras.main
    this.target = target
    this.mapWidth = mapWidth
    this.mapHeight = mapHeight
  }

  init() {
    this.camera.startFollow(this.target, true, CAMERA_LERP, CAMERA_LERP)
    this.camera.setBounds(0, 0, this.mapWidth, this.mapHeight)
    this.camera.setZoom(ZOOM_DEFAULT)

    const scene = this.camera.scene as Phaser.Scene

    // Mouse wheel zoom (zoom toward cursor)
    scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _dx: number, dy: number) => {
      const pointer = scene.input.activePointer
      // Get world point from pointer using Phaser 3 API
      const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y)

      const newZoom = Phaser.Math.Clamp(
        this.camera.zoom - dy * ZOOM_SENSITIVITY,
        ZOOM_MIN,
        ZOOM_MAX,
      )

      // Zoom toward cursor
      const zoomDiff = newZoom - this.camera.zoom
      this.camera.scrollX += (worldPoint.x - this.camera.scrollX) * (zoomDiff / this.camera.zoom)
      this.camera.scrollY += (worldPoint.y - this.camera.scrollY) * (zoomDiff / this.camera.zoom)
      this.camera.setZoom(newZoom)
    })

    // Drag-to-pan: mouse down
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only drag with middle mouse button or left mouse + shift key
      // @ts-expect-error - Phaser 4 Pointer API
      if (pointer.button === 1 || (pointer.button === 0 && pointer.shiftKey)) {
        this.isDragging = true
        this.dragStartX = pointer.x
        this.dragStartY = pointer.y
        this.cameraStartX = this.camera.scrollX
        this.cameraStartY = this.camera.scrollY
        this.pauseCameraFollow()
      }
    })

    // Drag-to-pan: mouse move
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return

      const dx = pointer.x - this.dragStartX
      const dy = pointer.y - this.dragStartY

      // Check threshold
      if (Math.abs(dx) < this.dragThreshold && Math.abs(dy) < this.dragThreshold) return

      this.camera.scrollX = this.cameraStartX - dx
      this.camera.scrollY = this.cameraStartY - dy
    })

    // Drag-to-pan: mouse up
    scene.input.on('pointerup', () => {
      if (this.isDragging) {
        this.isDragging = false
        this.resumeCameraFollow()
      }
    })
  }

  get cameraFollowing(): boolean {
    return this._cameraFollowing
  }

  pauseCameraFollow() {
    this._cameraFollowing = false
    this.camera.stopFollow()
  }

  resumeCameraFollow() {
    if (this._cameraFollowing) return
    this._cameraFollowing = true
    this.camera.startFollow(this.target, true, CAMERA_LERP, CAMERA_LERP)
  }

  update() {
    // Camera naturally follows via Phaser's built-in follow
    // Extended for drag-to-pan above
  }

  destroy() {
    const scene = this.camera.scene as Phaser.Scene
    scene.input.off('wheel')
    scene.input.off('pointerdown')
    scene.input.off('pointermove')
    scene.input.off('pointerup')
  }
}
