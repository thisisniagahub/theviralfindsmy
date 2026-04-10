/**
 * Camera Controller for the Shopee Office scene.
 * Smooth camera following with zoom controls.
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

    // Mouse wheel zoom
    const scene = this.camera.scene as Phaser.Scene
    scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _dx: number, dy: number) => {
      const newZoom = Phaser.Math.Clamp(
        this.camera.zoom - dy * ZOOM_SENSITIVITY,
        ZOOM_MIN,
        ZOOM_MAX,
      )
      this.camera.setZoom(newZoom)
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
    // This can be extended for drag-to-pan, etc.
  }

  destroy() {
    const scene = this.camera.scene as Phaser.Scene
    scene.input.off('wheel')
  }
}
