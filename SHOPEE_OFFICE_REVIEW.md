# Shopee Office Components Review

> Review Date: 2026-04-16
> Reviewer: Claude Code
> Scope: TheViralFinds Shopee Office Phaser Game Components

---

## 📁 Component Structure Overview

```
src/components/shopee-office/
├── phaser-game.tsx              # Main React entry - mounts Phaser game
├── game/
│   ├── index.ts                 # Barrel exports
│   ├── config.ts                # Game constants, collision areas, POIs
│   ├── events.ts                # Typed event bus (Phaser ↔ React)
│   ├── scenes/
│   │   └── OfficeScene.ts       # Main game scene (400+ lines)
│   ├── entities/
│   │   ├── Player.ts            # Boss player character
│   │   ├── Worker.ts            # AI agents with state machine
│   │   ├── ChatBubble.ts        # Premium glassmorphism bubbles
│   │   ├── InteractionMenu.ts   # RPG-style context menu
│   │   └── ShortcutsOverlay.ts  # Keyboard help overlay
│   ├── systems/
│   │   ├── WorkerManager.ts     # Worker lifecycle management
│   │   ├── InteractionManager.ts # Proximity + interaction
│   │   └── CameraController.ts  # Follow/zoom/pan controls
│   └── utils/
│       └── Pathfinder.ts        # A* pathfinding with MinHeap
├── agent-state-machine.ts       # 10-state FSM + OpenClaw mapping
└── [React UI Components...]     # HUD panels, modals, etc.
```

---

## 🏗️ Architecture Analysis

### 1. phaser-game.tsx - React Integration

**Pattern:** React wrapper around Phaser with WebSocket monitoring

**Key Features:**
- WebSocket health monitoring via `getGatewayWS()`
- Loading state with Shopee branding animation
- Error boundary with retry
- Full-bleed vs contained mode support

```typescript
// WebSocket monitoring
const wsInterval = setInterval(checkWs, 2000)

// Phaser initialization
game.events.once('ready', () => {
  const scene = game.scene.getScene('OfficeScene') as OfficeScene
  scene.init({ agents, onStatusUpdate, onAgentSelected })
})
```

**Strengths:**
- ✅ Proper cleanup (destroy game, clear intervals)
- ✅ Syncs worker data via `useEffect` when agents change
- ✅ WS status propagated to scene via `setWsStatus()`

**Consideration:**
- Polling WS health every 2s could be replaced with event-driven approach

---

### 2. OfficeScene.ts - Main Game Scene

**Initialization Flow:**
```
preload()  → Load backgrounds, spritesheets
create()   → Build world → Init systems → Setup bridge
update()   → Update player → workers → camera
```

**Scene Components:**
| System | Purpose |
|--------|---------|
| `Pathfinder` | A* navigation with collision grid |
| `Player` | Boss character with WASD/Arrow controls |
| `WorkerManager` | Manages 8 AI agents |
| `CameraController` | Smooth follow + zoom/pan |
| `InteractionManager` | Proximity detection, E-key prompts |
| `ShortcutsOverlay` | Help modal (H key) |
| `SceneEventBridge` | React-Phaser event wiring |

**Procedural Texture Generation:**
```typescript
// Dynamic humanoid generation
generateHumanoidTextures() {
  // Creates 8 worker textures programmatically
  // Body colors, skin tones, Shopee orange accents
}
```

**Environmental Props (Non-fullBleed):**
- Animated coffee machine (96 frames @ 12.5fps)
- Animated server room (40 frames @ 6fps)
- Interactive cat (click to change frame)
- Flowers, plants, posters with bloom animation

**HUD Elements:**
- Connection status dot (green/red with pulse animation)
- Earnings ticker (random commission messages)
- Typewriter text (status messages)

**Strengths:**
- ✅ Deferred asset loading for performance
- ✅ Procedural texture generation (no sprite sheet dependencies)
- ✅ Environmental animations add life
- ✅ Comprehensive cleanup in `cleanup()`

**Potential Issues:**

1. **Texture Key Dependency** (line 399-400):
   ```typescript
   this.sprite = scene.physics.add.sprite(x, y, textureKey)
   // If textureKey doesn't exist, Phaser shows pink box
   ```

2. **Animation Frame Count Mismatch:**
   ```typescript
   // shopee_working has frames 0-10 (11 frames)
   // But spritesheet grid may have different count
   ```

---

### 3. Player.ts - Boss Character

**Features:**
- WASD + Arrow key movement
- Diagonal normalization (√0.5 factor)
- Crown emoji indicator (👑)
- Name tag with golden text
- Golden arrow bounce animation (until first movement)
- Y-sorting (depth = y position)

**Input Focus Guard:**
```typescript
const active = document.activeElement
if (active?.tagName === 'INPUT' ||
    active?.tagName === 'TEXTAREA' ||
    active?.closest('[role="dialog"]')) {
  body.setVelocity(0, 0)
  return
}
```

**Visual Elements:**
- Crown floating above head (sine wave motion)
- "Boss (You)" name tag
- Depth-based sorting

**Strengths:**
- ✅ Proper input focus detection
- ✅ Y-sorting for depth
- ✅ Cleanup in destroy()

---

### 4. Worker.ts - AI Agent Entity

**State Machine (10 States):**
```typescript
export type WorkerStatus = 
  | 'idle' 
  | 'writing' 
  | 'researching' 
  | 'executing' 
  | 'syncing' 
  | 'error' 
  | 'thinking' 
  | 'collaborating' 
  | 'reporting' 
  | 'break'
```

**Status Colors:**
| Status | Color | Hex |
|--------|-------|-----|
| idle | Green | #22c55e |
| writing | Orange | #f97316 |
| researching | Purple | #a855f7 |
| executing | Yellow | #eab308 |
| syncing | Blue | #3b82f6 |
| error | Red | #ef4444 |
| thinking | Cyan | #06b6d4 |
| collaborating | Pink | #ec4899 |
| reporting | Violet | #8b5cf6 |
| break | Gray | #6b7280 |

**Movement System:**
- A* pathfinding via `pathfinder.findPath()`
- Stuck detection (position delta over frames)
- Auto-unstuck (returns home if stuck >120 frames)
- Bobble animation while moving/working

**Visual Feedback:**
- Emoji floating above head
- Status dot (color-coded)
- Health/productivity bar
- Task status text
- Glassmorphism chat bubble
- Bobble tween when working
- Glow effect on selection

**Task Queue:**
```typescript
taskQueue: QueuedTask[] = []
// When task completes, automatically processes queue
if (this.taskQueue.length > 0) {
  const next = this.taskQueue.shift()!
  this.setStatus('executing')
}
```

**Idle Behavior:**
- POI wandering (35% chance)
- Seat activities (emotes + bubbles)
- Staggered timing (wanderClock prevents all agents moving together)

**Strengths:**
- ✅ Comprehensive state management
- ✅ State change tracking via `agentStateTracker`
- ✅ Context-aware bubbles (different messages per state)
- ✅ Task queue system
- ✅ Y-sorting for depth
- ✅ Smooth animations (bobble, glow)

**Potential Issues:**

1. **Memory Leak - Tween References:**
   ```typescript
   // bobbleTween and glowTween created but never explicitly cleaned
   // May accumulate if workers are destroyed/recreated frequently
   ```

2. **Pathfinder Null Checks:**
   ```typescript
   if (ctx.pathfinder) {  // Could be null
     const path = ctx.pathfinder.findPath(...)
   }
   ```

---

### 5. ChatBubble.ts - Premium UI

**Design:** Glassmorphism style with:
- Drop shadow
- Translucent dark background (0.85 alpha)
- Subtle white border
- Shopee orange accent tick
- Animated tail
- Back ease-in animation

**Typewriter Effect:**
```typescript
this.typingTimer = this.scene.time.addEvent({
  delay: 35,
  callback: () => {
    if (currentIdx < message.length) {
      this.text.text += message[currentIdx]
      currentIdx++
    }
  },
  repeat: message.length - 1
})
```

**Strengths:**
- ✅ Premium glassmorphism design
- ✅ Typewriter effect with timing
- ✅ Deduplication (same message = no restart)
- ✅ Smooth position following
- ✅ Proper cleanup

---

### 6. InteractionMenu.ts - RPG Menu

**Features:**
- Keyboard navigation (WASD/Arrows)
- Mouse hover selection
- Scale-in animation (Back ease-out)
- Shopee brand accent
- Enabled/disabled states

**Menu Options:**
1. 💬 Assign Task / 📋 Queue Task
2. 🔄 New Session
3. 📥 Queue (n) - if tasks queued
4. 📊 Session History
5. ⏹ Stop Task - if working
6. ✕ Cancel

**Strengths:**
- ✅ Clean visual design
- ✅ Keyboard + mouse support
- ✅ Animation polish
- ✅ Proper cleanup

---

### 7. WorkerManager.ts - Worker Pool

**Responsibilities:**
- Spawn workers with texture mapping
- Sync workers when agent data changes
- Destroy stale workers

**Texture Mapping:**
```typescript
const textureMap: Record<string, string> = {
  'product-scout': 'worker_male_1',
  'link-builder': 'worker_female_1',
  'campaign-master': 'worker_male_2',
  'analytics-agent': 'worker_female_2',
  'content-writer': 'worker_female_3',
  'payout-checker': 'worker_male_3',
  'seo-optimizer': 'worker_male_4',
  'review-monitor': 'worker_female_4',
}
```

**Sync Algorithm:**
```typescript
// 1. Map new configs by seatId
// 2. Map existing workers by seatId
// 3. Destroy workers not in new configs
// 4. Recreate workers with changed labels
// 5. Update status for existing workers
// 6. Destroy any remaining stale workers
```

**Strengths:**
- ✅ Efficient diff-based syncing
- ✅ Clear texture mapping
- ✅ Proper cleanup

---

### 8. CameraController.ts - View Control

**Features:**
- Smooth follow with lerp (0.1)
- Mouse wheel zoom (zooms toward cursor)
- Drag-to-pan (middle click or shift+left)
- Bounds clamping

**Zoom Math:**
```typescript
const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y)
const zoomDiff = newZoom - this.camera.zoom
this.camera.scrollX += (worldPoint.x - this.camera.scrollX) * (zoomDiff / this.camera.zoom)
```

**Strengths:**
- ✅ Smooth zoom toward cursor
- ✅ Drag threshold (8px) prevents accidental drags
- ✅ Proper event cleanup

---

### 9. SceneEventBridge.ts - Event Wiring

**Bridge Pattern:**
```typescript
// React → Phaser
gameEvents.emit('task-assigned', taskId, message, agentId)
// → Worker.setStatus('executing')

// Phaser → React (via interval)
setInterval(() => {
  workerManager.workers.forEach(w => {
    onAgentStatusChanged?.(w.seatId, w.status)
  })
}, 1000)
```

**Events Handled:**
| Event | Direction | Action |
|-------|-----------|--------|
| `task-assigned` | React → Phaser | Set worker to executing |
| `task-completed` | React → Phaser | Set worker to idle |
| `agent-status-changed` | React → Phaser | Update worker status |
| `agent-selected` | Phaser → React | Callback to React |
| `open-terminal` | Phaser → React | Open task terminal |
| `new-session-for-agent` | Phaser → React | Create new session |
| `stop-task` | Phaser → React | Stop running task |

**Strengths:**
- ✅ Clean event abstraction
- ✅ Unsubscribe cleanup

**Consideration:**
- Status polling via `setInterval` every 1s could be event-driven instead

---

### 10. Pathfinder.ts - A* Navigation

**Implementation:**
- Binary heap (MinHeap) for open set
- 8-directional movement (cardinal + diagonal)
- Diagonal cost: √2 ≈ 1.414
- Cell size: 16px
- Max iterations: 20,000

**Heuristic:**
```typescript
// Chebyshev distance with diagonal weight
h(r1, c1, r2, c2) {
  const dr = Math.abs(r1 - r2)
  const dc = Math.abs(c1 - c2)
  return Math.max(dr, dc) + (Math.SQRT2 - 1) * Math.min(dr, dc)
}
```

**Path Simplification:**
```typescript
// Removes collinear points
if (c.x - p.x !== n.x - c.x || c.y - p.y !== n.y - c.y) {
  result.push(c)
}
```

**Collision Inflation:**
```typescript
// Inflates collision rects by padding (half body width)
// Ensures agents don't clip into furniture
```

**Strengths:**
- ✅ Efficient MinHeap implementation
- ✅ Path smoothing
- ✅ Nearest walkable cell fallback
- ✅ Diagonal movement support

---

### 11. agent-state-machine.ts - FSM

**10 Extended States:**
```
idle → writing, researching, thinking, break, error
thinking → researching, writing, collaborating, idle, error
researching → thinking, writing, collaborating, reporting, idle, error
writing → executing, syncing, thinking, idle, error
executing → syncing, reporting, idle, error
syncing → idle, reporting, error
collaborating → writing, researching, idle, error
reporting → idle, syncing, error
break → idle, thinking, error
error → idle, break
```

**OpenClaw Activity Mapping:**
```typescript
'scanning trends' → 'researching'
'crafting content' → 'writing'
'calculating roi' → 'executing'
'generating report' → 'reporting'
// ... etc
```

**State Tracker:**
```typescript
class AgentStateTracker {
  recordStateChange(agentId, newState)  // Tracks timing
  getHistory(agentId)                    // State history
  isStuck(agentId, thresholdMs)         // 10min default
  getTotalTimeInState(agentId, state)   // Analytics
}
```

**Strengths:**
- ✅ Validated state transitions
- ✅ OpenClaw activity mapping
- ✅ Duration tracking per state
- ✅ "Stuck" detection (10min threshold)

---

## 🎯 Strengths Summary

1. **State Machine Architecture**
   - 10 distinct states with validated transitions
   - Context-aware visual feedback (bubbles, emotes)
   - Duration tracking for analytics

2. **Visual Polish**
   - Glassmorphism chat bubbles
   - Smooth bobble animations
   - Status color coding
   - Y-sorting for depth

3. **Navigation System**
   - A* pathfinding with collision avoidance
   - Stuck detection and auto-recovery
   - POI-based idle wandering

4. **Event-Driven Bridge**
   - Clean React ↔ Phaser communication
   - Typed event map
   - Proper cleanup

5. **Procedural Generation**
   - Runtime texture generation
   - No external sprite dependencies

6. **Premium UI/UX**
   - Typewriter text effect
   - Keyboard shortcuts (H for help)
   - Interactive elements (cat, coffee machine)

---

## ⚠️ Issues & Recommendations

### 🔴 Critical

#### 1. Memory Leak: Tween References
**File:** `Worker.ts:376, 555`

**Issue:** `bobbleTween` and `glowTween` created but never explicitly destroyed
```typescript
this.bobbleTween = this.scene.tweens.add({...})
// Missing: this.bobbleTween.remove() in destroy()
```

**Fix:**
```typescript
destroy() {
  this.bobbleTween?.stop()
  this.bobbleTween?.remove()
  this.glowTween?.stop()
  this.glowTween?.remove()
  // ... rest of cleanup
}
```

---

### 🟡 High Priority

#### 2. Missing Texture Fallback
**File:** `Worker.ts:400`

**Issue:** If `textureKey` doesn't exist, Phaser shows pink error box

**Fix:**
```typescript
const texture = scene.textures.exists(textureKey) ? textureKey : 'worker_male_1'
this.sprite = scene.physics.add.sprite(x, y, texture)
```

---

#### 3. Pathfinder Polling Instead of Event-Driven
**File:** `SceneEventBridge.ts:55-59`

**Issue:** Status polled every 1s via `setInterval`

**Fix:** Use event-driven approach:
```typescript
// Instead of polling, emit on state change
worker.setStatus(status) {
  // ... existing code
  gameEvents.emit('worker-status-changed', this.seatId, status)
}
```

---

#### 4. Worker Status Not Synced Back to React
**File:** `Worker.ts:492-509`

**Issue:** State changes tracked but not emitted to React

**Fix:**
```typescript
setStatus(status) {
  // ... existing code
  gameEvents.emit('agent-status-changed', this.seatId, status)
}
```

---

### 🟢 Medium Priority

#### 5. Animation Key Fragility
**File:** `Worker.ts:612-629`

**Issue:** Animation keys constructed with string concatenation
```typescript
const animKey = `${this.textureKey}_walk_${this.facing}`
// If textureKey or facing is unexpected, animation fails
```

**Fix:** Validate before play:
```typescript
const animKey = `${this.textureKey}_walk_${this.facing}`
if (this.scene.anims.exists(animKey)) {
  this.sprite.play(animKey)
}
```

---

#### 6. Emoji Text Not Cleaned Up
**File:** `Worker.ts:411-414`

**Issue:** Emoji text added as sprite data but may not be destroyed

**Fix:**
```typescript
destroy() {
  const emojiText = this.sprite.getData('emojiText')
  emojiText?.destroy()
  // ... rest
}
```

---

### 🟦 Low Priority

#### 7. Collision Areas Hardcoded
**File:** `game/config.ts:82-99`

**Suggestion:** Load from JSON or parse from tilemap for flexibility

#### 8. No Save/Load State
**Suggestion:** Persist agent positions, states, task queue to localStorage

#### 9. Missing Sound Effects
**Suggestion:** Add:
- Footstep sounds
- Chat bubble pop
- Task complete chime
- Door open/close

---

## 📊 Code Quality Metrics

| Metric | Score | Notes |
|--------|-------|-------|
| Architecture | ⭐⭐⭐⭐⭐ | Clean FSM, event-driven |
| Type Safety | ⭐⭐⭐⭐⭐ | Full TypeScript, typed events |
| Visual Polish | ⭐⭐⭐⭐⭐ | Premium glassmorphism |
| Memory Management | ⭐⭐⭐ | Minor tween leaks |
| Performance | ⭐⭐⭐⭐ | A* with MinHeap, deferred loading |
| Documentation | ⭐⭐⭐⭐ | Good inline comments |
| Test Coverage | ⭐⭐ | Needs unit tests |

**Overall: A (88/100)**

---

## 🛠️ Quick Fixes (Under 30 mins)

1. **Fix tween memory leak** in `Worker.destroy()`
2. **Add texture fallback** in `Worker.constructor()`
3. **Add animation validation** before `sprite.play()`
4. **Destroy emoji text** in `Worker.destroy()`
5. **Emit status changes** to React immediately

---

## 📋 Test Scenarios

- [ ] Spawn all 8 agents, verify textures load
- [ ] Move player, verify Y-sorting
- [ ] Assign task, verify status dot changes
- [ ] Complete task, verify idle transition
- [ ] Queue multiple tasks, verify processing
- [ ] Click cat, verify frame changes
- [ ] Press H, verify shortcuts overlay
- [ ] Zoom in/out, verify smooth zoom
- [ ] Walk through collision areas, verify blocked
- [ ] Let agent idle, verify POI wandering

---

*End of Review*
