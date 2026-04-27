# Task: phase2-config-phaser — Config & Phaser Fixes

## Agent: Config Agent

## Changes Made

### 1. next.config.ts
- Set `ignoreBuildErrors: false` (was `true` with TODO comment)
- Set `reactStrictMode: true` (was `false`)

### 2. tsconfig.json
- Changed `"jsx": "react-jsx"` to `"jsx": "preserve"` (required for Next.js App Router JSX transformation)

### 3. phaser-game.tsx — Dynamic Import
- Changed `createOfficeScene` from sync to async function
- Replaced `const Phaser = require('phaser')` with `const Phaser = (await import('phaser')).default`
- Updated call site: `const OfficeSceneClass = await createOfficeScene(agents, onStatusUpdate)`
- Removed eslint-disable for `@typescript-eslint/no-require-imports`

### 4. agent-office-page.tsx — next/dynamic
- Added `import dynamic from 'next/dynamic'`
- Changed `import { PhaserGame, type AgentData }` to separate imports
- PhaserGame loaded via: `dynamic(() => import('@/components/shopee-office/phaser-game').then(m => ({ default: m.PhaserGame })), { ssr: false })`
- AgentData type imported from `@/components/shopee-office/phaser-game`

### 5. notification-service/index.ts — Currency Fix
- Line 77: `₱${commission.toFixed(2)}` → `RM ${commission.toFixed(2)}`
- Line 101: `₱${amount.toFixed(2)}` → `RM ${amount.toFixed(2)}`
- Line 109: `₱10,000` → `RM 10,000` (2 instances in same line)

### 6. notification-provider.tsx — Reconnection Limit
- Changed `reconnectionAttempts: Infinity` to `reconnectionAttempts: 10`

## Lint Result
- 0 errors, 26 warnings (all pre-existing)
