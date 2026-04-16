# Changelog

All notable changes to TheViralFinds are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- `ROADMAP.md` as the current execution source of truth for implementation sequencing

### Changed
- Synced primary documentation to current code reality with explicit drift notes and updated dates
- Clarified that archived prompt packs and historical reviews are not the live implementation authority
- Linked `ROADMAP.md` from main repo entry points

### Removed
- Deprecated and redundant markdown files that were superseded by `AGENTS.md`, `ROADMAP.md`, or active docs

## [9.2.0] - 2026-04-12

### Added
- 5-agent audit synthesis with interactive comparison dashboards
- `Agent-Reviews-Comparison.html` — Chart.js radar, glassmorphism UI
- `5-Way-Review-Comparison.html` — detailed audit with contradictions
- Comprehensive `docs/` documentation structure (8 files)
- `AI-Review-Comparison.html` — cross-AI consensus dashboard

### Changed
- `IMPLEMENTATION_PLAN.md` restructured to v11.0 with P0-P3 priorities
- `README.md` slimmed from 31KB to ~10KB
- `AGENTS.md` updated with Vitest info and 6 known issues from audit
- `CLAUDE.md` updated with 12 known issues from audit
- Security headers added to `next.config.ts` (CSP, HSTS, X-Frame, etc.)
- Hardcoded admin email moved to `ADMIN_EMAIL` env var
- `process.exit(1)` in env.ts replaced with graceful error throwing

### Removed
- `CODEX-PROMPT.md` (task completed, 501 lines dead documentation)
- `GEMINI.md` (redundant with AGENTS.md)
- `QWEN.md` (redundant with README.md + docs/)

## [9.1.0] - 2026-04-12

### Added
- OpenClaw modular refactor — 6-module architecture in `src/lib/openclaw/`
- `gateway-client.ts` with circuit breaker, retry, streaming
- `ws-client.ts` for real-time WebSocket events
- `tools.ts` for dynamic tool discovery + invocation
- `agents.ts` for 8-agent registry + `sessions_spawn` orchestration
- `automation.ts` for cron jobs, hooks, webhooks

### Changed
- All AI calls now use `openclaw/<agentId>` model format
- Tool invocation switched from legacy to `POST /tools/invoke`

## [9.0.0] - 2026-04-11

### Added
- Comprehensive PRD v9.0 (1,900+ lines)
- VPS deployment configuration (PostgreSQL, nginx, OpenClaw)
- DB Service bearer token authentication
- Environment validation with Zod schemas (`src/lib/env.ts`)
- Rate limiting implementation (60/30/10 per-tier)

### Changed
- Database migrated from SQLite to PostgreSQL 16
- All API routes now use Zod input validation
- Rate limiting implemented for API endpoints

## [8.0.0] - 2026-04-10

### Added
- Pixel RPG Agent Office (Phaser 3) with ECS architecture
- Real-time notifications via Socket.IO (port 3004)
- Dashboard with glassmorphism UI
- Campaign management system
- Payout tracking and earning goals
- QR code generation for affiliate links
- Link sharing with social platform support
- Command palette with fuzzy search
- Onboarding tour system
- PWA support with service worker

### Changed
- Architecture refactored to 3-process model (Next.js + DB + Notif)
- Root layout migrated to Server Component
- App Router file-based routing (15 dashboard routes)
