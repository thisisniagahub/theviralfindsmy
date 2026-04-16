// Game engine exports for Shopee Office
export { gameEvents } from './events'
export type { GameEventMap } from './events'

export { Pathfinder, type PathPoint } from './utils/Pathfinder'
export {
  buildCollisionRects,
  getTilesetBasename,
  parseOfficePOIs,
  parseOfficeSpawns,
  renderTileObjectLayer,
} from './utils/MapHelpers'

export { Player } from './entities/Player'
export { Worker, type WorkerStatus } from './entities/Worker'
export { resetWanderClock } from './entities/worker/idle'
export { ChatBubble } from './entities/ChatBubble'
export { InteractionMenu, type MenuOption } from './entities/InteractionMenu'

export { CameraController } from './systems/CameraController'
export { WorkerManager, type WorkerConfig } from './systems/WorkerManager'
export { InteractionManager } from './systems/InteractionManager'

export {
  GAME_WIDTH,
  GAME_HEIGHT,
  OFFICE_MAP_KEY,
  OFFICE_MAP_PATH,
  OFFICE_TILESET_BASE_PATH,
  OFFICE_COLLISIONS,
  OFFICE_POIS,
  AGENT_SEAT_DEFS,
  BOSS_SPAWN_X,
  BOSS_SPAWN_Y,
  type SeatDef,
  type POI,
} from './config'
