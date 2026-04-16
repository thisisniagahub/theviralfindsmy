import * as Phaser from 'phaser'
import {
  AGENT_SEAT_DEFS,
  BOSS_SPAWN_FACING,
  BOSS_SPAWN_X,
  BOSS_SPAWN_Y,
  SHOPEE_AGENT_SEAT_ORDER,
  type POI,
  type SeatDef,
} from '../config'

type Facing = SeatDef['facing']

export interface MapSpawnPoint {
  x: number
  y: number
  facing: Facing
}

function getFacing(obj: Phaser.Types.Tilemaps.TiledObject): Facing {
  const props = obj.properties as Array<{ name: string; value: unknown }> | undefined
  const facing = props?.find((prop) => prop.name === 'facing')?.value

  if (facing === 'up' || facing === 'down' || facing === 'left' || facing === 'right') {
    return facing
  }

  return 'down'
}

function getRenderableGid(gid: number) {
  return gid & 0x1fffffff
}

export function getTilesetBasename(imagePath: string) {
  const normalized = imagePath.replace(/\\/g, '/')
  const basename = normalized.split('/').pop()
  return basename || imagePath
}

export function parseOfficeSpawns(map: Phaser.Tilemaps.Tilemap) {
  const spawnsLayer = map.getObjectLayer('spawns')
  const fallbackBoss: MapSpawnPoint = {
    x: BOSS_SPAWN_X,
    y: BOSS_SPAWN_Y,
    facing: BOSS_SPAWN_FACING,
  }

  if (!spawnsLayer || spawnsLayer.objects.length === 0) {
    return {
      bossSpawn: fallbackBoss,
      workerSpawns: AGENT_SEAT_DEFS,
    }
  }

  const spawnPoints = spawnsLayer.objects.filter(
    (obj): obj is Phaser.Types.Tilemaps.TiledObject & { x: number; y: number } =>
      typeof obj.x === 'number' && typeof obj.y === 'number',
  )

  if (spawnPoints.length === 0) {
    return {
      bossSpawn: fallbackBoss,
      workerSpawns: AGENT_SEAT_DEFS,
    }
  }

  let bossPoint = spawnPoints.find((obj) => obj.name === 'boss')
  if (!bossPoint) {
    bossPoint = [...spawnPoints].sort((a, b) => a.x - b.x || a.y - b.y).pop()
  }

  const bossSpawn = bossPoint
    ? { x: bossPoint.x, y: bossPoint.y, facing: getFacing(bossPoint) }
    : fallbackBoss

  const workerSpawns = spawnPoints
    .filter((obj) => obj !== bossPoint)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((obj, index) => ({
      seatId: SHOPEE_AGENT_SEAT_ORDER[index] ?? `seat-${index + 1}`,
      x: obj.x,
      y: obj.y,
      facing: getFacing(obj),
      index,
    }))

  return {
    bossSpawn,
    workerSpawns: workerSpawns.length > 0 ? workerSpawns : AGENT_SEAT_DEFS,
  }
}

export function parseOfficePOIs(map: Phaser.Tilemaps.Tilemap): POI[] {
  const layer = map.getObjectLayer('pois')
  if (!layer) return []

  return layer.objects
    .filter(
      (obj): obj is Phaser.Types.Tilemaps.TiledObject & { x: number; y: number; name: string } =>
        typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.name === 'string' && obj.name.length > 0,
    )
    .map((obj) => ({
      name: obj.name,
      x: obj.x,
      y: obj.y,
      facing: getFacing(obj),
    }))
}

export function buildCollisionRects(
  map: Phaser.Tilemaps.Tilemap,
  collisionGroup: Phaser.Physics.Arcade.StaticGroup,
) {
  const collisionRects: { x: number; y: number; width: number; height: number }[] = []
  const collisionLayer = map.getObjectLayer('collisions')

  const addCollisionRect = (x: number, y: number, width: number, height: number) => {
    const rect = collisionGroup.create(
      x + width / 2,
      y + height / 2,
      undefined,
      undefined,
      false,
    ) as Phaser.Physics.Arcade.Sprite

    rect.body?.setSize(width, height)
    rect.setVisible(false)
    rect.setActive(true)
    ;(rect.body as Phaser.Physics.Arcade.StaticBody).enable = true

    collisionRects.push({ x, y, width, height })
  }

  if (collisionLayer) {
    for (const obj of collisionLayer.objects) {
      const x = obj.x ?? 0
      const y = obj.y ?? 0
      const width = obj.width ?? 0
      const height = obj.height ?? 0

      if (width === 0 || height === 0) {
        continue
      }

      addCollisionRect(x, y, width, height)
    }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = 0
  let maxY = 0

  if (collisionRects.length === 0) {
    return collisionRects
  }

  for (const rect of collisionRects) {
    minX = Math.min(minX, rect.x)
    minY = Math.min(minY, rect.y)
    maxX = Math.max(maxX, rect.x + rect.width)
    maxY = Math.max(maxY, rect.y + rect.height)
  }

  const mapWidth = map.widthInPixels
  const mapHeight = map.heightInPixels

  if (minX > 0) addCollisionRect(0, 0, minX, mapHeight)
  if (minY > 0) addCollisionRect(0, 0, mapWidth, minY)
  if (maxX < mapWidth) addCollisionRect(maxX, 0, mapWidth - maxX, mapHeight)
  if (maxY < mapHeight) addCollisionRect(0, maxY, mapWidth, mapHeight - maxY)

  return collisionRects
}

export function renderTileObjectLayer(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  layerName: string,
  tilesets: Phaser.Tilemaps.Tileset[],
  depthOffset = 0,
) {
  const objectLayer = map.getObjectLayer(layerName)
  if (!objectLayer) return

  for (const obj of objectLayer.objects) {
    if (typeof obj.gid !== 'number' || typeof obj.x !== 'number' || typeof obj.y !== 'number') {
      continue
    }

    const gid = getRenderableGid(obj.gid)

    let tileset: Phaser.Tilemaps.Tileset | null = null
    for (let index = tilesets.length - 1; index >= 0; index -= 1) {
      if (gid >= tilesets[index].firstgid) {
        tileset = tilesets[index]
        break
      }
    }

    if (!tileset) {
      continue
    }

    const localId = gid - tileset.firstgid
    const frameKey = String(localId)
    const tileWidth = tileset.tileWidth
    const tileHeight = tileset.tileHeight
    const sourceX = (localId % tileset.columns) * tileWidth
    const sourceY = Math.floor(localId / tileset.columns) * tileHeight

    const texture = scene.textures.get(tileset.name)
    if (!texture.has(frameKey)) {
      texture.add(frameKey, 0, sourceX, sourceY, tileWidth, tileHeight)
    }

    scene.add
      .image(obj.x, obj.y - tileHeight, tileset.name, frameKey)
      .setOrigin(0, 0)
      .setDepth(obj.y + depthOffset)
  }
}
