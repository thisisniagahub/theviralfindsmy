/**
 * Office constants for the Shopee Office Phaser scene.
 * Inspired by agent-town's constants.ts pattern.
 */

// Game canvas
export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720

// Boss spawn position (near the door)
export const BOSS_SPAWN_X = 640
export const BOSS_SPAWN_Y = 650
export const BOSS_INTERACT_DISTANCE = 60

// Agent interaction
export const INTERACT_DISTANCE = 64

// Movement
export const MOVE_SPEED = 160
export const ARRIVE_THRESHOLD = 8
export const WORKER_SPEED_FACTOR = 0.55
export const STUCK_FRAME_LIMIT = 120

// Camera
export const CAMERA_LERP = 0.1
export const ZOOM_DEFAULT = 1.0
export const ZOOM_MIN = 0.6
export const ZOOM_MAX = 2.0
export const ZOOM_SENSITIVITY = 0.001

// Worker wandering
export const WANDER_MIN_DELAY = 3000
export const WANDER_MAX_DELAY = 10000
export const WANDER_STAGGER_MS = 1800
export const WANDER_INITIAL_MIN = 500
export const WANDER_INITIAL_MAX = 4000
export const POI_WANDER_CHANCE = 0.35
export const POI_STAY_MIN = 3000
export const POI_STAY_MAX = 6000
export const STAGGER_EXTRA_MIN = 250
export const STAGGER_EXTRA_MAX = 1200

// Visual offsets
export const EMOTE_Y_OFFSET = 0.55
export const BUBBLE_Y_OFFSET = 0.45
export const PROMPT_Y_OFFSET = 0.5

// Task timing
export const TASK_BUBBLE_MS = 4000

// Press E prompt style
export const PRESS_E_STYLE: {
  fontFamily: string
  fontSize: string
  color: string
  backgroundColor: string
  padding: { x: number; y: number }
  align: string
} = {
  fontFamily: '"SF Mono", "Cascadia Code", Consolas, monospace',
  fontSize: '14px',
  color: '#c9a227',
  backgroundColor: 'rgba(37, 34, 25, 0.95)',
  padding: { x: 8, y: 4 },
  align: 'center',
}

// Collision rectangles for the office (furniture, walls)
// These are approximate collision areas based on the background image
export const OFFICE_COLLISIONS: { x: number; y: number; width: number; height: number }[] = [
  // Sofa area (left side)
  { x: 60, y: 80, width: 200, height: 100 },
  // Main desk area (center-left)
  { x: 100, y: 300, width: 250, height: 180 },
  // Coffee machine area
  { x: 560, y: 340, width: 120, height: 100 },
  // Server room (top-right)
  { x: 900, y: 60, width: 200, height: 200 },
  // Work desks (center)
  { x: 500, y: 140, width: 350, height: 80 },
  // Plants and decorative areas
  { x: 400, y: 450, width: 80, height: 60 },
  // Right wall shelves
  { x: 1100, y: 250, width: 100, height: 150 },
  // Bottom wall (desk row)
  { x: 700, y: 450, width: 200, height: 80 },
]

// Points of Interest (POI) for idle agent wandering
export interface POI {
  x: number
  y: number
  name: string
  facing?: 'up' | 'down' | 'left' | 'right'
}

export const OFFICE_POIS: POI[] = [
  // Water cooler area
  { x: 500, y: 420, name: 'water cooler', facing: 'left' },
  // Coffee machine
  { x: 620, y: 380, name: 'coffee', facing: 'left' },
  // Bookshelf
  { x: 1100, y: 300, name: 'book', facing: 'left' },
  // Whiteboard
  { x: 400, y: 200, name: 'whiteboard', facing: 'up' },
  // Sofa / rest area
  { x: 150, y: 150, name: 'sofa', facing: 'right' },
  // Printer area
  { x: 900, y: 350, name: 'printer', facing: 'left' },
]

// POI bubble texts when agents visit them
export const POI_BUBBLE_TEXTS: Record<string, string[]> = {
  water: ['Getting water...', 'Staying hydrated!', 'Refilling bottle~'],
  printer: ['Checking prints...', 'Printing reports...', 'Paper jam again?'],
  book: ['Browsing references...', 'Looking up Shopee trends~', 'Good read!'],
  whiteboard: ['Reviewing plans...', 'Sketching campaign ideas~', 'Hmm, let me think...'],
  sofa: ['Taking a break~', 'Quick rest...', 'So comfy...'],
  coffee: ['Need caffeine!', 'Making kopi~', 'Espresso time!'],
}

// Seat activity presets (what idle agents do at their desks)
export interface SeatActivityDef {
  emote: string
  bubbles: string[]
  minDuration: number
  maxDuration: number
}

export const SEAT_ACTIVITIES: SeatActivityDef[] = [
  {
    emote: 'sleep',
    bubbles: ['Zzz...', 'So sleepy...', '*dozing off*'],
    minDuration: 6000,
    maxDuration: 14000,
  },
  {
    emote: 'sleep',
    bubbles: ['*stretch*', '*yawn~*', '5 more minutes...'],
    minDuration: 4000,
    maxDuration: 8000,
  },
  {
    emote: 'thinking',
    bubbles: ['Hmm...', 'Let me think...', 'How to optimize this?'],
    minDuration: 5000,
    maxDuration: 10000,
  },
  {
    emote: 'thinking',
    bubbles: ['Reading trends...', 'Taking notes...', 'Interesting~'],
    minDuration: 5000,
    maxDuration: 10000,
  },
  {
    emote: 'device',
    bubbles: ['Generating links...', 'Writing code~', 'Fixing bugs...'],
    minDuration: 5000,
    maxDuration: 12000,
  },
  {
    emote: 'device',
    bubbles: ['Updating campaigns~', 'Almost done!', 'One more test...'],
    minDuration: 4000,
    maxDuration: 8000,
  },
  {
    emote: 'star',
    bubbles: ['Got it!', 'Eureka!', 'Great idea!'],
    minDuration: 2000,
    maxDuration: 4000,
  },
  {
    emote: 'heart',
    bubbles: ['Feeling great!', 'Love this~', 'Best day ever!'],
    minDuration: 3000,
    maxDuration: 5000,
  },
  {
    emote: 'music',
    bubbles: ['~♪♪~', 'Humming~', 'Good vibes~'],
    minDuration: 3000,
    maxDuration: 6000,
  },
  {
    emote: 'confused',
    bubbles: ['Huh?', 'This is weird...', 'What happened?'],
    minDuration: 3000,
    maxDuration: 6000,
  },
  {
    emote: 'angry',
    bubbles: ['Ugh...', 'This bug...', 'Not again!'],
    minDuration: 2000,
    maxDuration: 4000,
  },
]

// Agent desk spawn positions (where agents sit when working)
export interface SeatDef {
  seatId: string
  x: number
  y: number
  facing: 'up' | 'down' | 'left' | 'right'
}

export const AGENT_SEAT_DEFS: SeatDef[] = [
  { seatId: 'product-scout', x: 540, y: 180, facing: 'down' },
  { seatId: 'link-builder', x: 640, y: 180, facing: 'down' },
  { seatId: 'campaign-master', x: 740, y: 180, facing: 'down' },
  { seatId: 'analytics-agent', x: 200, y: 350, facing: 'down' },
  { seatId: 'content-writer', x: 300, y: 350, facing: 'down' },
  { seatId: 'payout-checker', x: 750, y: 480, facing: 'down' },
  { seatId: 'seo-optimizer', x: 850, y: 480, facing: 'down' },
  { seatId: 'review-monitor', x: 950, y: 350, facing: 'left' },
]
