# Implementation Plan — Full Roadmap (v11.0)

> **Status**: Active  
> **Created**: April 2026  
> **Version**: 11.0 — Post 5-Agent Audit  
> **Last Updated**: 12 April 2026  
> **Last Completed**: 5-Agent Security Audit (Qwen, Gemini, Codex, ClaudeCode, Opus)

---

## 🔴 5-AGENT AUDIT RESULTS (12 April 2026)

5 AI agents independently reviewed the project. Consolidated score: **~65/100 (C+)**

| Agent | Score | Strength |
|-------|-------|----------|
| Qwen Code | 61/100 C+ | Deepest architectural analysis, 8 unique security findings |
| Gemini CLI | —/100 | Brain directory optimization, polling→WS migration |
| OpenAI Codex | —/100 | Knowledge management system review |
| Claude Code (Opus 4.6) | 69/100 B- | 10 unique bugs found (Math.random, process.exit, mass assignment) |
| Antigravity (Opus) | 69/100 B- | Architecture mapping with Mermaid + progress tracking |

**Consensus issues (4/5+ agents agree):**
1. ❌ No User Model / Multi-Tenancy (4/5)
2. ❌ Hardcoded admin credentials (4/5)
3. ❌ Near-zero test coverage ~0.5% (3/5)
4. ❌ Missing security headers CSP/HSTS (3/5)
5. ❌ In-memory rate limiting / caching (3/5)

---

## Current State Summary

### ✅ Completed (All Sprints)
| Phase | Items | Status |
|-------|-------|--------|
| Sprint 0 (0A-0E) | OpenClaw Gateway Hardening, VPS Health, Real NiagaBot Chat, MCP Proxy, A2A Pipeline | ✅ Done |
| Phase 11 | Env Validation, Rate Limiting, Input Focus Guard, ESLint Cleanup | ✅ Done |
| Phase 12 | Camera Drag-to-Pan, API Caching, Keyboard Shortcuts Panel, Page Transitions | ✅ Done |
| Security Hardening | OAuth allowlist, Caddy lockdown, DB service bearer auth, error sanitization, rate limiting on AI routes | ✅ Done |
| FR-19 to FR-25 | Isometric Office, State Machine, Activity Monitor, Minimap, Themes, Performance | ✅ Done |
| OpenClaw Modular Refactor | 6-module directory, 8 agents, sessions_spawn, WebSocket, cron, hooks | ✅ Done |
| TypeScript Strict Mode | noImplicitAny: true, 7 files fixed, 5 ESLint rules enabled | ✅ Done |
| Vitest Setup | 16 tests across cache, rate-limit, validations | ✅ Done |
| 5-Agent Audit | Qwen, Gemini, Codex, ClaudeCode, Opus reviews + HTML comparison | ✅ Done |

### 📊 Project Stats
- **Build**: 58 pages, 0 errors
- **API Routes**: 69+
- **Components**: 50+
- **Test Coverage**: ~0.5% (16 tests, 3 files)
- **ESLint**: 0 errors, ~50 warnings (pre-existing)
- **Audit Score**: 65/100 average across 5 agents

---

## 🔥 P0: CRITICAL SECURITY (Week 1-2) — Audit Consensus

> All 5 agents agree: these MUST be fixed before any beta users can access the system.

### P0-1: User Model + Multi-Tenancy ⬜
**Agents**: Qwen ✓ Gemini ✗ Codex ✗ ClaudeCode ✓ Opus ✓ (4/5)  
**Effort**: 24-40 hours  
**Impact**: Platform can serve multiple users

| Step | Action | Files |
|------|--------|-------|
| 1 | Add `User` model to Prisma schema | `prisma/schema.prisma` |
| 2 | Add `userId` FK to all data models | `prisma/schema.prisma` |
| 3 | Run migration | `prisma/migrations/` |
| 4 | Update DB service to filter by userId | `mini-services/db-service/index.ts` |
| 5 | Update all 69 API routes with user context | `src/app/api/**/route.ts` |
| 6 | Update NextAuth to create User on login | `src/app/api/auth/[...nextauth]/route.ts` |

### P0-2: DB Service Authentication ⬜
**Agents**: Qwen ✓ ClaudeCode ✓ (2/5 — but critical severity)  
**Effort**: 4 hours

| Step | Action | Files |
|------|--------|-------|
| 1 | Add bearer token validation to DB service | `mini-services/db-service/index.ts` |
| 2 | Add Zod schemas for all DB service inputs | `mini-services/db-service/index.ts` |
| 3 | Add DB_SERVICE_TOKEN to env schema | `src/lib/env.ts` |

### P0-3: Remove Hardcoded Credentials ⬜
**Agents**: Qwen ✓ Gemini ✓ ClaudeCode ✓ Opus ✓ (4/5)  
**Effort**: 1 hour

| Step | Action | Files |
|------|--------|-------|
| 1 | Move admin email to `ADMIN_EMAIL` env var | `src/app/api/auth/[...nextauth]/route.ts` |
| 2 | Remove auto-signin logic | auth route |
| 3 | Rotate all secrets in `.env` | `.env` |

### P0-4: Security Headers ⬜
**Agents**: Qwen ✓ ClaudeCode ✓ Opus ✓ (3/5)  
**Effort**: 1 hour

| Step | Action | Files |
|------|--------|-------|
| 1 | Add CSP, HSTS, X-Frame-Options, X-Content-Type-Options | `next.config.ts` |
| 2 | Add Permissions-Policy header | `next.config.ts` |

---

## 🟡 P0.5: DATA INTEGRITY (Week 2) — Critical Bugs

> Found by Claude Code — no other agent caught these.

### P0.5-1: Remove Math.random() from Production ⬜
**Effort**: 2 hours

| Step | Action | Files |
|------|--------|-------|
| 1 | Replace Math.random() with real aggregates or null | `mini-services/db-service/index.ts` |
| 2 | Replace Math.random() in dashboard demo | `src/app/api/dashboard/route.ts` |
| 3 | Use deterministic seed data for DEMO_MODE | `src/lib/demo.ts` |

### P0.5-2: Fix process.exit(1) → Typed Error ⬜
**Effort**: 30 minutes  
**File**: `src/lib/env.ts`

### P0.5-3: Fix SDK Fallback role: 'assistant' → 'system' ⬜
**Effort**: 30 minutes  
**Files**: `src/lib/openclaw/tools.ts`, `src/app/api/openclaw/ai-content/route.ts`, `src/app/api/openclaw/trending/route.ts`

### P0.5-4: Fix DELETE with Body in Cron Route ⬜
**Effort**: 1 hour  
**File**: `src/app/api/openclaw/cron/route.ts`

### P0.5-5: Fix updateSettingsSchema (too permissive) ⬜
**Effort**: 1 hour  
**File**: `src/lib/validations.ts`

---

## 🟠 P1: INFRASTRUCTURE (Week 3-4)

### P1-1: Redis (Upstash) for Cache + Rate Limiting ⬜
**Agents**: Qwen ✓ ClaudeCode ✓ Opus ✓ (3/5)  
**Effort**: 8-12 hours

| Step | Action | Files |
|------|--------|-------|
| 1 | Install `@upstash/redis` | `package.json` |
| 2 | Create Redis adapter interface | `src/lib/redis.ts` (new) |
| 3 | Refactor cache.ts with Redis backend | `src/lib/cache.ts` |
| 4 | Refactor rate-limit.ts with Redis backend | `src/lib/rate-limit.ts` |
| 5 | Add UPSTASH_REDIS_URL to env | `src/lib/env.ts` |

### P1-2: Test Suite Foundation ⬜
**Agents**: Qwen ✓ ClaudeCode ✓ Opus ✓ (3/5)  
**Effort**: 3-4 days  
**Target**: 20 API route tests + 5 core lib tests

| Priority Test Files | Current Coverage |
|---------------------|-----------------|
| `src/lib/validations.test.ts` | ✅ 8 tests |
| `src/lib/rate-limit.test.ts` | ✅ 3 tests |
| `src/lib/cache.test.ts` | ✅ 5 tests |
| `mini-services/db-service/index.test.ts` | ❌ 0% |
| `src/lib/openclaw/gateway-client.test.ts` | ❌ 0% |
| Top 20 API routes | ❌ 0% |

### P1-3: CI/CD Pipeline (GitHub Actions) ⬜
**Agents**: ClaudeCode ✓ Opus ✓ (2/5)  
**Effort**: 4 hours

```yaml
# .github/workflows/ci.yml
steps:
  - lint: bun run lint
  - typecheck: tsc --noEmit
  - test: bun run test
  - build: bun run build
```

### P1-4: Lazy WebSocket Initialization ⬜
**Effort**: 1 hour  
**File**: `src/lib/openclaw/ws-client.ts`  
Change `export const wsClient = new OpenClawWSClient()` to lazy `getWsClient()`.

---

## 🔵 P2: PERFORMANCE & CLEANUP (Week 5)

### P2-1: CDN for Game Assets (13.2MB) ⬜
**Effort**: 4 hours  
Move `public/shopee-office/` to Cloudflare R2 or BunnyCDN.

### P2-2: Polling → WebSocket for Agent Office ⬜
**Agents**: Gemini ✓ (1/5 — unique finding)  
**Effort**: 4-6 hours  
Replace 3-second polling with SSE/Socket.IO.

### P2-3: Delete Dead Code ⬜
**Effort**: 1 hour

| File | Status |
|------|--------|
| `src/lib/config.ts` (117 lines) | Dead — duplicate of env.ts |
| `src/lib/db-timeout.ts` | Dead — never imported |
| `src/lib/service-urls.ts` → `isServiceConfigured()` | Unreliable |
| Orphan images (14.2MB) | Uncleaned |

### P2-4: Split Large Components ⬜
**Effort**: 4 hours

| Component | Lines | Action |
|-----------|-------|--------|
| `agent-profile.tsx` | 981 | Split into subcomponents |
| `openclaw-page.tsx` | 846 | Split into tool-specific panels |

---

## 🟢 P3: FEATURE DEVELOPMENT (Week 6+)

### P3-1: OAuth Providers ⬜
**Effort**: 3-4 hours  
Google login button + OAuth flow.

### P3-2: Affiliate Profile System ⬜
**Effort**: 7-8 hours  
Public profile at `/profile/[slug]`.

### P3-3: Scheduled Reports via OpenClaw Cron ⬜
**Effort**: 9-10 hours

### P3-4: Multi-Merchant Support (Lazada, TikTok Shop) ⬜
**Effort**: 15-16 hours  
Unique competitive advantage — no other affiliate platform has this.

### P3-5: Stripe Subscription Tiers ⬜
**Effort**: 8-9 hours  
Free / Pro / Enterprise tier enforcement.

### P3-6: RAG Pipeline + NL Analytics ⬜
**Effort**: 10-12 hours  
"Tunjuk top product minggu ini" → real chart from database.

---

## Dependencies & Execution Order

```
Week 1-2 (P0 — CRITICAL):
  ├── P0-1: User Model + Multi-Tenancy (24-40h)
  ├── P0-2: DB Service Input Validation (4h)
  ├── P0-3: Remove Hardcoded Credentials (1h)
  ├── P0-4: Security Headers (1h)
  └── P0.5: Data Integrity Bug Fixes (5h)

Week 3-4 (P1 — INFRASTRUCTURE):
  ├── P1-1: Redis (Upstash) Migration (8-12h)
  ├── P1-2: Test Suite — 20 API routes (3-4 days)
  ├── P1-3: CI/CD Pipeline (4h)
  └── P1-4: Lazy WebSocket Init (1h)

Week 5 (P2 — PERFORMANCE):
  ├── P2-1: CDN for Game Assets (4h)
  ├── P2-2: Polling → WebSocket (4-6h)
  ├── P2-3: Delete Dead Code (1h)
  └── P2-4: Split Large Components (4h)

Week 6+ (P3 — FEATURES):
  ├── P3-1: OAuth Providers (3-4h)
  ├── P3-2: Affiliate Profile (7-8h)
  ├── P3-3: Scheduled Reports (9-10h)
  ├── P3-4: Multi-Merchant (15-16h)
  ├── P3-5: Subscription Tiers (8-9h)
  └── P3-6: RAG Pipeline (10-12h)
```

## Total Remaining Work

| Phase | Hours | Duration |
|-------|-------|----------|
| P0 — Critical Security | ~35-50h | 2 weeks |
| P0.5 — Data Integrity | ~5h | 1 day |
| P1 — Infrastructure | ~40-48h | 2 weeks |
| P2 — Performance | ~13-15h | 1 week |
| P3 — Features | ~53-60h | 3-4 weeks |
| **Total** | **~150-180h** | **~10 weeks** |

---

## Quick Wins Still Available (< 1 hour each)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Fix health endpoint version (8.0.0 → package.json) | 15min | Correct health reporting |
| 2 | Diagonal Speed Normalization | 5min | Fix 41% faster diagonal movement |
| 3 | Delete `config.ts` + `db-timeout.ts` | 10min | Remove dead code |
| 4 | Fix `isServiceConfigured()` in service-urls.ts | 15min | Reliable service detection |
| 5 | Remove duplicate SDK imports in 2 API routes | 15min | Cleaner imports |
| 6 | Keyboard Shortcuts Panel | ✅ Done | — |
| 7 | Page Transitions | ✅ Done | — |
