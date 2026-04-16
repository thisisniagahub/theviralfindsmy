# CLAUDE.md

> Claude-specific helper context for this repository.
> `AGENTS.md` and `ROADMAP.md` are the primary source of truth. If this file conflicts with them or with the current codebase, prefer `AGENTS.md`, `ROADMAP.md`, and live code over this snapshot.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TheViralFinds — AI-Powered Shopee Affiliate Management System for the Malaysian market. Next.js 16 + React 19 App Router app with 8 OpenClaw AI agents, a Phaser game engine "Agent Office", Shopee SDK integration, and real-time Socket.IO notifications.

## Commands

```bash
bun install                  # Install deps (auto-runs prisma generate)
bun run dev                  # Next.js on :3000
bun run dev:all              # Next.js + DB service (:3005) + Notification service (:3004)
bun run dev:db               # DB microservice only
bun run dev:notif            # Notification service only
bun run build                # Production build
bun run lint                 # ESLint
bun run test                 # Vitest (run once)
bun run test:watch           # Vitest watch mode
bun run test:coverage        # Vitest with coverage
bun run db:push              # Push Prisma schema to DB (dev)
bun run db:migrate           # Run migrations (prod)
bun run db:reset             # Reset DB (dev only)
```

## Architecture

### Three-process microservice layout

```
Next.js (:3000)  ──fetch()──>  DB Service (:3005)  ──Prisma──>  PostgreSQL
    │
    └──Socket.IO────────────>  Notification Service (:3004)
```

The DB microservice exists because **Prisma hangs inside Next.js 16 API route handlers when using Turbopack**. All API routes that need the database `fetch()` from the DB service at `DB_SERVICE_URL` (default `http://127.0.0.1:3005`). Do not import PrismaClient directly in Next.js API routes — route through the DB service instead. `mini-services/` is excluded from `tsconfig.json`.

### AI integration pattern (OpenClaw)

`src/lib/openclaw/` is a 6-module barrel export. Every AI call follows **gateway-first with SDK fallback**: the circuit breaker opens after 5 consecutive failures (30s cooldown), at which point calls fall back to `z-ai-web-dev-sdk`.

- `gateway-client.ts` — HTTP client with retry (2 retries, 1s/2s backoff), SSE streaming, health check
- `ws-client.ts` — WebSocket with RPC, exponential backoff reconnect (1s→8s), heartbeat
- `tools.ts` — Dynamic discovery via `GET /v1/models`, invocation via `POST /tools/invoke`
- `agents.ts` — 8 agents, native `sessions_spawn` for sub-agent orchestration
- `automation.ts` — Cron CRUD, wake hooks (`/hooks/wake`), agent hooks (`/hooks/agent`)
- `index.ts` — Barrel export; always import from `@/lib/openclaw`

### Shopee integration

`src/lib/shopee/` wraps `@congminh1254/shopee-sdk` with 8 domain modules (client, affiliate, ams, orders, products, promotions, shipping, shop). Affiliate endpoints use GraphQL; seller endpoints use REST.

### Demo mode

`DEMO_MODE=true` returns mock/demo data on selected routes. When false, API routes should use the real DB service. `SKIP_AUTH=true` bypasses NextAuth in development only.

### Auth

NextAuth.js v4 with credentials provider + OAuth email allowlist. JWT sessions. Enforced at the `(dashboard)` route group level.

### Rate limiting

Rate limiting is mixed: the repo now contains both in-memory and Redis-backed helpers. Verify the current route path before assuming a given limiter is live everywhere.

- `api`: 60/min (read routes)
- `ai`: 10/min (OpenClaw routes)
- `auth`: 5/5min (login/register)
- `mutation`: 30/min (write routes)

### Validation

All POST/PUT endpoints use Zod schemas from `src/lib/validations.ts`. Env vars validated at startup by `src/lib/env.ts` (Zod, fail-fast).

## OpenClaw Conventions

These are critical and not obvious from reading the code:

- **Model format**: Always `openclaw/<agentId>` (e.g., `openclaw/niagaresearch`). Never `niaga-default`.
- **Tool invocation**: `POST /tools/invoke` with body `{ tool, action, args, sessionKey }`. The endpoint `/v1/tools/execute` does not exist.
- **Sub-agent orchestration**: Use native `sessions_spawn` tool. Never manually loop completions.
- **Discovery**: Fetch tools and agents dynamically from the gateway. Avoid hardcoding lists.
- **Auth**: Bearer token via `OPENCLAW_GATEWAY_TOKEN` env var.
- **Session persistence**: Pass `x-openclaw-session-key` header.

## Key Paths

| Concern | Location |
|---------|----------|
| API routes | `src/app/api/**/route.ts` |
| Page components | `src/components/pages/*` |
| Layout components | `src/components/layout/` |
| Providers | `src/components/providers/` |
| shadcn/ui | `src/components/ui/` (49 components) |
| Phaser game | `src/components/shopee-office/` |
| Zustand store | `src/store/app-store.ts` |
| Service URLs config | `src/lib/service-urls.ts` |
| Demo data | `src/lib/demo.ts` |
| Prisma schema | `prisma/schema.prisma` (8 models — ⚠️ no User model) |
| Game assets | `public/shopee-office/` |

## Coding Style

- 2-space indent, single quotes, no semicolons
- PascalCase components, camelCase functions, kebab-case files/routes
- `@/*` path alias → `src/*`
- TypeScript strict: `noImplicitAny: true`
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Run `bun run lint` before committing

## Known Issues

1. **Prisma + Turbopack hang** — worked around with DB microservice. Never import PrismaClient in Next.js routes.
2. **ESLint**: ~70 warnings (mostly `no-explicit-any`, unused imports). 0 errors.
3. **WebSocket reconnection gap** — brief disconnect during gateway restarts (auto-recovers).
4. Background processes die with shell — use `dev:all` or PM2/systemd for persistence.
5. **No User Model** — All data is single-tenant. Prisma schema needs `User` model with `userId` FK on all data models. **P0 blocker**.
6. **In-memory stores** — `rate-limit.ts` and `cache.ts` use `Map()`. Need Redis/Upstash for production.
7. ~~**Missing security headers**~~ — ✅ Fixed 2026-04-12 (CSP, HSTS, X-Frame, etc.)
8. **Dead code** — `src/lib/config.ts` (117 lines) and `src/lib/db-timeout.ts` are never imported.
9. **Math.random() in production** — DB service generates random data even when `DEMO_MODE=false`. **P0**.
10. ~~**process.exit(1)**~~ — ✅ Fixed 2026-04-12 (throws Error instead)
11. **WebSocket singleton** — `ws-client.ts` connects on import; should use lazy `getWsClient()`.
12. **SDK fallback role bug** — Fallback code sends system prompt as `role: 'assistant'` instead of `role: 'system'`.
13. ~~**Hardcoded admin email**~~ — ✅ Fixed 2026-04-12 (now uses `ADMIN_EMAIL` env var)

## 5-Agent Audit (12 April 2026)

Score: **~65/100 (C+)**. See `IMPLEMENTATION_PLAN.md` v11.0 for priorities.
Top consensus: User Model (4/5), Hardcoded Credentials (4/5), Testing (3/5), Security Headers (3/5).

## Documentation

See `docs/` for detailed docs: ARCHITECTURE.md, API_REFERENCE.md, DATABASE.md, SECURITY.md, AI_ARCHITECTURE.md, DEPLOYMENT.md, TESTING.md, RUNBOOK.md.
