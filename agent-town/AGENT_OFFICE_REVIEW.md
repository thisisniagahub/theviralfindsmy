# Agent Office Components Review

> Review Date: 2026-04-16
> Reviewer: Claude Code
> Scope: Phaser-based Agent Office Game Components

---

## 📁 Component Structure Overview

```
components/game/
├── PhaserGame.tsx           # Main entry - mounts Phaser game
├── config.ts               # Phaser game configuration
├── scenes/
│   └── OfficeScene.ts      # Main game scene
├── entities/
│   ├── Player.ts           # Player (Boss) character
│   ├── Worker.ts           # AI Worker/Agent character
│   ├── ChatBubble.ts       # HTML-based chat bubbles
│   ├── InteractionMenu.ts # RPG-style interaction menu
│   └── worker/
│       ├── types.ts        # Worker type definitions
│       ├── movement.ts     # Movement & pathfinding logic
│       ├── idle.ts         # Idle/wandering behavior
│       └── task.ts         # Task assignment/completion logic
├── systems/
│   ├── WorkerManager.ts    # Manages all workers
│   ├── InteractionManager.ts # Player-worker interactions
│   ├── CameraController.ts # Camera follow/zoom/drag
│   ├── DoorManager.ts      # Animated door system
│   └── SceneEventBridge.ts # React-Phaser event bridge
└── config/
    ├── animations.ts       # Sprite animation configs
    └── emotes.ts          # Emote bubble configs
```

---

## 🏗️ Architecture Analysis

### 1. PhaserGame.tsx - Game Mount

**Pattern:** Lazy-loaded Phaser with SSR safety

```typescript
// Dynamic import ensures Phaser only loads in browser
const { gameConfig } = await import("./config");
const Phaser = await import("phaser");
```

**Strengths:**
- ✅ Proper cleanup on unmount (`game.destroy(true)`)
- ✅ Uses `useRef` to prevent re-initialization
- ✅ `mounted` flag prevents state updates after unmount

**Considerations:**
- No loading state while Phaser loads
- Could add error boundary for init failures

---

### 2. OfficeScene.ts - Main Scene

**Role:** Orchestrates all game systems

**Initialization Flow:**
```
preload() → load tilemap, sprites, spritesheets
create() → build map → init systems → start event bridge
update() → update player → update workers → update doors
```

**System Architecture:**
| System | Responsibility |
|--------|--------------|
| `CameraController` | Follow player, zoom, drag pan |
| `WorkerManager` | Spawn/sync/destroy workers |
| `InteractionManager` | Proximity detection, menus |
| `DoorManager` | Automatic door animations |
| `SceneEventBridge` | Wire gameEvents to worker actions |

**Key Design Patterns:**
- Event-driven: Uses `gameEvents` bus for cross-system communication
- Composition: Scene owns systems, systems own entities
- Cleanup: Proper `shutdown`/`destroy` event handlers

**Potential Issues:**
1. **Hardcoded door positions** (line 25-28):
   ```typescript
   const doorPositions = [
     { x: 528, y: 528 },
     { x: 960, y: 528 },
   ];
   ```
   Should be parsed from tilemap object layer

2. **Input focus detection** could be more robust:
   ```typescript
   function isInputFocused(): boolean {
     // Currently only checks INPUT/TEXTAREA/contentEditable
     // Missing: check for modal overlays, HUD focus
   }
   ```

---

### 3. Player.ts - Player Character

**Features:**
- WASD + Arrow key movement
- 4-directional idle/walk animations
- Diagonal movement normalization (× √0.5)
- Golden arrow indicator (until first movement)

**Strengths:**
- ✅ Physics body sized correctly (50% width, 20% height)
- ✅ Proper body offset for feet positioning
- ✅ Animation only plays if different from current

**Code Quality:**
```typescript
// Good: Velocity normalization for diagonals
if (vx !== 0 && vy !== 0) {
  const factor = Math.SQRT1_2;
  vx *= factor;
  vy *= factor;
}
```

**Suggestion:**
- Add sprint modifier (Shift key)
- Consider adding controller support (Gamepad API)

---

### 4. Worker.ts - AI Worker Entity

**Complexity:** High - delegates to 3 sub-modules

**State Machine:**
```
idle → working → done/failed → idle
  ↓
wandering (optional during idle)
```

**Sub-module Pattern:**
```typescript
// Delegated methods pattern
navigateTo(x, y) { movNavigateTo(this, x, y) }
assignTask(runId, message) { taskAssignTask(this, runId, message) }
scheduleWander() { idleScheduleWander(this) }
```

**WorkerCtx Interface:**
- Exposes mutable state to sub-modules
- Avoids extra object allocation
- Keeps Worker class as thin coordinator

**Visual Elements:**
- Sprite (48×96 pixel art)
- Name tag (pixel font, dark background)
- Status dot (color: idle=gray, working=yellow, done=green, failed=red)
- Task status text (shows queue length)
- Emote sprite (above head)
- Chat bubble (HTML overlay)

**Strengths:**
- ✅ Comprehensive pause/resume for boss proximity
- ✅ Task queue system
- ✅ Automatic emote → bubble conflict resolution
- ✅ Proper cleanup in destroy()

**Potential Issues:**

1. **ChatBubble memory leak potential:**
   ```typescript
   bubbleAccum Map never cleaned
   // In gateway-handler.ts, bubbleAccum grows unbounded
   ```

2. **Stuck detection could be more robust:**
   ```typescript
   // Current: checks position delta
   // Could add: collision detection, path validity check
   ```

---

### 5. ChatBubble.ts - HTML Overlay

**Design Choice:** HTML DOM element instead of Phaser Text

**Benefits:**
- Better text rendering (CSS)
- Easier styling (shadows, borders)
- Automatic line wrapping
- No Phaser texture generation overhead

**Position Sync:**
```typescript
// World → Screen coordinates
const sx = (this.worldX - cam.worldView.x) * cam.zoom + cam.x;
const sy = (this.worldY - cam.worldView.y) * cam.zoom + cam.y;
```

**Strengths:**
- ✅ Tail indicator (CSS triangle)
- ✅ Fade in/out transitions
- ✅ Auto-truncate at 100 chars with "..."
- ✅ Proper timer cleanup

**Consideration:**
- DOM element not removed if scene destroyed improperly

---

### 6. InteractionMenu.ts - RPG Menu

**Features:**
- Keyboard navigation (WASD + Arrows)
- Mouse hover selection
- Visual highlight with border
- Disabled state support

**Depth Management:**
```typescript
const DEPTH = 30; // Above workers (5), bubbles (15), but below modals
```

**Strengths:**
- ✅ Calculates screen position from world coordinates
- ✅ Clamps to viewport bounds
- ✅ Keyboard + mouse hybrid input
- ✅ Proper key cleanup in destroy()

**Suggestion:**
- Could add animation (slide in/out)
- Could add sound effects

---

### 7. WorkerManager.ts - Worker Pool

**Responsibilities:**
- Spawn workers based on seat configs
- Sync workers when seat configs change
- Map runIds to workers
- Cleanup destroyed workers

**Sync Algorithm:**
```typescript
// Compare current workers vs desired seats
// 1. Destroy workers for unassigned seats
// 2. Create workers for new assignments
// 3. Recreate if sprite/label changed
// 4. Keep existing if unchanged
```

**Strengths:**
- ✅ `runWorkerMap` for O(1) lookup by runId
- ✅ Proper cleanup via `cleanupWorkerRunIds()`

**Potential Issue:**
```typescript
// clearNearest callback pattern is fragile
// Could use event emitter instead
```

---

### 8. InteractionManager.ts

**Features:**
- Proximity detection (find nearest interactable worker)
- "Press E" prompt display
- Worker menu opening
- Pause worker when player nearby

**Priority System:**
```typescript
// Worker menu takes priority over boss terminal
if (nearest && Phaser.Input.Keyboard.JustDown(eKey)) {
  this.openWorkerMenu(nearest);
  return true; // signal: handled
}
```

**Strengths:**
- ✅ Resumes camera follow after menu closes
- ✅ Pauses worker AI during interaction

---

### 9. CameraController.ts

**Features:**
- Smooth follow with lerp
- Mouse wheel zoom (centered on cursor)
- Drag pan (stops follow)
- Resume follow on player movement

**Zoom Math:**
```typescript
// Zoom toward cursor position
const worldBefore = cam.getWorldPoint(sx, sy);
cam.setZoom(newZoom);
const worldAfter = cam.getWorldPoint(sx, sy);
cam.scrollX += worldBefore.x - worldAfter.x;
```

**Strengths:**
- ✅ Smooth zoom behavior
- ✅ Respects camera bounds
- ✅ Cleanup on resize

---

### 10. SceneEventBridge.ts

**Role:** Connects React state (via gameEvents) to Phaser entities

**Event Handlers:**
| Event | Action |
|-------|--------|
| `seat-configs-updated` | Sync workers |
| `task-assigned` | Route to worker, bind session |
| `task-bound` | Update runId mapping |
| `task-bubble` | Show bubble on worker |
| `task-completed` | Mark complete, process queue |
| `task-failed` | Mark failed, process queue |
| `task-aborted` | Stop task, process queue |
| `subagent-assigned` | Create subagent worker |
| `terminal-closed` | Update terminal state |

**Pattern:** Returns cleanup function
```typescript
return () => {
  for (const unsub of unsubs) unsub();
};
```

**Strengths:**
- ✅ Centralized event handling
- ✅ Proper cleanup on scene destroy
- ✅ Session binding (sessionKey → seatId)

---

### 11. Worker Sub-modules

#### movement.ts
- A* pathfinding integration
- Stuck detection (position delta over frames)
- Arrival callbacks
- Home position snapping

**Constants:**
```typescript
STUCK_FRAME_LIMIT = 10      // Frames before consider stuck
STUCK_MOVE_THRESHOLD = 0.1   // Pixels per frame
ARRIVE_THRESHOLD = 4         // Pixels to count as arrived
```

#### idle.ts
- Wander scheduling with stagger delay
- POI (Point of Interest) wandering
- Seat activities (emotes)
- Shared wanderClock to prevent simultaneous wandering

**Activity Cycle:**
```
Idle → Schedule Wander → [Walk to POI / Do Seat Activity] → Return Home → Repeat
```

#### task.ts
- Task assignment with "return to desk" behavior
- Task queue processing
- Complete/fail/abort handlers
- Visual feedback (bubbles, emotes)

**Task Lifecycle:**
```
assignTask() → [Return Home?] → showBubble() → onReady() → [Wait for completion]
                   ↓
completeTask() → setStatus(done) → setTimeout → setStatus(idle) → processQueue()
```

---

### 12. Animation Configuration

**Sprite Layout:**
```
Premade_Character_48x48_XX.png (56 cols × ~20 rows)
- Row 0: Preview thumbnails
- Row 1: Idle (right·up·left·down, 6 frames each)
- Row 2: Walk (right·up·left·down, 6 frames each)
```

**Worker Sprites:**
| Key | Path | Label |
|-----|------|-------|
| character_02 | Premade_Character_48x48_02.png | Alice |
| character_03 | Premade_Character_48x48_03.png | Bob |
| character_04 | Premade_Character_48x48_04.png | Carol |
| character_05 | Premade_Character_48x48_05.png | Dave |

**Emote Layout:**
- 480×480 spritesheet (10×10 grid)
- Each emote: 2 frames (normal + alt)
- Frame indices calculated as: `row * 10 + col`

---

## 🎯 Strengths Summary

1. **Clean Separation of Concerns**
   - Scene → Systems → Entities → Sub-modules
   - Each layer has single responsibility

2. **Event-Driven Architecture**
   - `gameEvents` bus decouples React from Phaser
   - Easy to extend with new event types

3. **Type Safety**
   - Full TypeScript coverage
   - Discriminated unions for events
   - Context interface for sub-modules

4. **Memory Management**
   - Proper destroy() methods
   - Timer cleanup
   - Event listener cleanup

5. **Visual Polish**
   - HTML chat bubbles with CSS
   - Status dots and task text
   - Emote animations
   - Door animations
   - Smooth camera

---

## ⚠️ Issues & Recommendations

### 🔴 Critical

#### 1. Hardcoded Door Positions
**File:** `DoorManager.ts:25-28`

**Issue:** Door positions hardcoded, won't adapt to map changes

**Fix:** Parse from tilemap object layer:
```typescript
// In OfficeScene.ts
const doorObjects = map.filterObjects("props", (obj) => obj.name?.startsWith("door"));
```

---

### 🟡 High Priority

#### 2. Missing Worker Limit Check
**File:** `SceneEventBridge.ts:24-53`

**Issue:** `findIdle()` returns null if all workers busy, task gets lost:
```typescript
if (!worker) {
  gameEvents.emit("task-ready", taskId, message, seatId); // Sends anyway?
  return;
}
```

**Fix:** Queue task globally when no workers available

---

#### 3. Camera Bounds Calculation Edge Case
**File:** `CameraController.ts:115-128`

**Issue:** When viewport > map at certain zooms, centering math may show empty space

**Fix:** Add clamp or black background:
```typescript
// Add black background that always fills viewport
document.body.style.backgroundColor = "#1a1814";
```

---

### 🟢 Medium Priority

#### 4. Worker Stuck Detection Can False-Positive
**File:** `movement.ts:111-129`

**Issue:** Worker legitimately waiting for path may appear stuck

**Fix:** Check if path is being recalculated before marking stuck

---

#### 5. Emote Animation Repeat Logic
**File:** `Worker.ts:193-212`

**Issue:** Emotes with `repeat: -1` never auto-hide

**Current:** Relies on `animationcomplete` which never fires for infinite repeats

**Fix:** Add manual timeout for infinite emotes

---

#### 6. Interaction Menu Keyboard Focus
**File:** `InteractionMenu.ts:157-190`

**Issue:** Menu keyboard handling doesn't check if input focused

**Fix:** Add `isInputFocused()` check like OfficeScene does

---

### 🟦 Low Priority

#### 7. No Sound Effects
**Suggestion:** Add:
- Footstep sounds (walk animation)
- Door open/close
- Menu open/close
- Task complete/fail chimes

#### 8. No Particle Effects
**Suggestion:** Add:
- Dust particles when walking
- Sparkle on task complete
- Emote burst effect

#### 9. Camera Could Follow Workers
**Suggestion:** When worker assigned task and walking, temporarily follow them

---

## 📊 Code Quality Metrics

| Metric | Score | Notes |
|--------|-------|-------|
| Type Safety | ⭐⭐⭐⭐⭐ | Full TypeScript, no any |
| Architecture | ⭐⭐⭐⭐⭐ | Clean layers, good patterns |
| Memory Management | ⭐⭐⭐⭐ | Mostly good, minor leaks |
| Documentation | ⭐⭐⭐ | Good inline comments |
| Test Coverage | ⭐⭐ | Needs unit tests |

---

## 🛠️ Quick Fixes (Under 30 mins)

1. **Add input focus check to InteractionMenu**
2. **Fix door positions to read from map**
3. **Add global task queue when workers busy**
4. **Add emote timeout for infinite repeats**

---

## 📋 Test Scenarios

- [ ] Spawn 4 workers, assign tasks to all
- [ ] Assign task when all workers busy
- [ ] Move player near worker, verify pause
- [ ] Complete task, verify queue processes
- [ ] Close terminal mid-task, verify abort
- [ ] Zoom/pan camera, verify bounds respected
- [ ] Walk through doors, verify animation
- [ ] Reload page with persisted tasks

---

*End of Review*
