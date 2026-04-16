# Agent Office (Virtual Headquarters) - Architecture & Integration Guide

> **Core Objective:** To visualize the backend operations of the OpenClaw AI Gateway (NiagaBot, MarketingBot, etc.) through a gamified, real-time isometric environment rendered entirely in-browser.

This document is a design and implementation brief for the **Agent Office** area. It is useful context, but it is not the sole source of truth; future agents should verify the current code under `src/components/shopee-office/**`, `src/app/api/shopee-office/**`, and `ROADMAP.md` before implementing against the assumptions below.

---

## 🏗 System Architecture

The Agent Office runs via a **Dual-Render Strategy** — pairing a robust Game Engine with Modern React UI overlays.

### 1. Rendering Engine (Phaser 3)
*   **Location:** `src/components/shopee-office/game/`
*   **Role:** Handles all spatial processing, WebGL rendering, sprite animations, collisions, pointer interactions, and pathfinding.
*   **Key Insight:** Phaser operates purely on the client side. We bypass Next.js SSR crashes by ensuring Phaser elements are lazily loaded or only invoked inside `useEffect` with proper memory cleanup. Modules use `import * as Phaser` due to ESM strictness in Next 15/16.

### 2. UI Overlay (Next.js / React)
*   **Location:** `src/components/shopee-office/*.tsx`
*   **Role:** Manages the Head-Up Display (HUD) including the Minimap, Toolbar, Chat Bubbles, and Settings.
*   **Key Insight:** React state drives the HUD, but complex spatial events (like a sprite reaching a desk) are dispatched from Phaser up to React natively via Custom Events or ref-callbacks. The aesthetics utilize our established "Premium Dark Glassmorphism" system.

---

## 📂 Codebase Geography

If you are an agent tasked to modify the Agent Office, study these critical domains:

- `components/shopee-office/isometric-office.tsx`: The master orchestrator component. Handles mounting criteria and lazy load wrappers for the game canvas.
- `components/shopee-office/phaser-game.tsx`: The React-to-Phaser bridge. Mounts the `HTMLCanvasElement`, injects configuration, initializes the `OfficeScene`, and manages `WorkerManager` & `Pathfinder`.
- `components/shopee-office/OfficeToolbar.tsx`: The bottom/side HUD for manual user actions (e.g. Call Agent, Zoom, Ping Server).
- `components/shopee-office/chat-bubbles.tsx`: Handles dynamic Type-Writer effect speech bubbles tracking floating entities.
- `components/shopee-office/minimap-overlay.tsx`: Radar and viewport representation showing real-time agent locations across the map floor.

---

## ✅ What Has Been Completed (Phase 1 & 2)

Treat this section as historical implementation context. Verify the current code before assuming every bullet here is fully complete or regression-free.

1.  **Memory Leak Resolution:** Implemented deterministic destruction mapping in `phaser-game.tsx`. Phaser contexts are fully wiped to prevent RAM lockups during Next.js Hot Module Reloads (HMR).
2.  **Module Interoperability:** Patched `import Phaser from 'phaser'` to `import * as Phaser from 'phaser'` resolving breaking TurboPack build failures.
3.  **Humanoid Sprite Integrations (Phase 2):** Replaced static mock graphics with fully animated isometric humanoid sprites with idle, walking, and "typing at desk" states.
4.  **UI Hardening:** Implemented premium frosted glass overlays. Chat bubbles are now context-aware, positioned dynamically mapping 2D HTML to Phaser camera coordinates.
5.  **A* Pathfinding:** Implemented a non-blocking pathfinding loop so Agent Sprites can navigate around desks, vending machines, and obstacles without clipping.

---

## 🚀 The Future Roadmap (Phase 3 & 4)

These are the immediate next steps and features planned for future Agents to implement:

### 1. Zero-Latency OpenClaw Data Binding (Top Priority)
Currently, agents act autonomously based on local frontend loops. **The goal is WebSocket driven presence.**
*   *Task:* Listen to `ws-client.ts` for Gateway signals. When `openclaw/niagaresearch` begins execution, command its corresponding 3D Sprite to physically walk to a "Terminal Desk" and trigger the "typing" animation.
*   *Task:* Render real-time text output from the OpenClaw Gateway directly into the visual Chat Bubbles floating above the agent's head.

### 2. Multi-Floor Navigation / Dynamic Instantiation
*   As the user unlocks more features (e.g., leveling up Affiliate Tier), the office expands.
*   *Task:* Scale the canvas world bounds dynamically.
*   *Task:* Implement an Elevator mechanic that teleports the camera view between the "Marketing Floor" and the "Logistics Floor".

### 3. Shopee Gamification & User Customization
*   *Task:* Build an inventory state leveraging Prisma (in the Database layer).
*   *Task:* Allow users to convert commission points into new Office Decor (Posters, Arcade Cabinets, Gold Play Buttons) dynamically injected into the Phaser map via X/Y coordinate persistence.

### 4. Interactive NPCs
*   *Task:* Convert the Agent Office from a pure dashboard visualization strictly into a pseudo-RPG. Users can click on an Agent (e.g., NiagaBot) to open up their specific interaction terminal directly above their sprite, bypassing traditional navigation menus.

---

**⚠️ Agent Warning:** 
When modifying Phaser code inside standard React hooks (`useState`, `useEffect`), be highly cognizant of scope. Phaser runs its own internal ticker loop (Update cycle is `~60fps`). Connecting React State directly into `scene.update()` will cause catastrophic re-rendering latency. **Always use Phaser's built in Event Emitter (`EventEmitter`) to communicate asynchronously between React and the Game Engine.**
