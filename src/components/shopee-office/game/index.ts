// Game engine exports for Shopee Office
export { gameEvents } from './events'
export type { GameEventMap } from './events'

export { Pathfinder, type PathPoint } from './utils/Pathfinder'

export { Player } from './entities/Player'
export { Worker, resetWanderClock, type WorkerStatus } from './entities/Worker'
export { ChatBubble } from './entities/ChatBubble'
export { InteractionMenu, type MenuOption } from './entities/InteractionMenu'

export { CameraController } from './systems/CameraController'
export { WorkerManager, type WorkerConfig } from './systems/WorkerManager'
export { InteractionManager } from './systems/InteractionManager'

export {
  GAME_WIDTH,
  GAME_HEIGHT,
  OFFICE_COLLISIONS,
  OFFICE_POIS,
  AGENT_SEAT_DEFS,
  BOSS_SPAWN_X,
  BOSS_SPAWN_Y,
  type SeatDef,
  type POI,
} from './config'
