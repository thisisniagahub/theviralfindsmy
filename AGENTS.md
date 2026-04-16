> This file is the universal AI agent context for TheViralFinds.
> It replaces the deprecated GEMINI.md, QWEN.md, and CODEX-PROMPT.md files.
> Last updated: 15 April 2026
>
> **Extended docs:** [`ROADMAP.md`](ROADMAP.md) · [`docs/MASTER_STRUCTURE.md`](docs/MASTER_STRUCTURE.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) · [`docs/DATABASE.md`](docs/DATABASE.md) · [`docs/AI_ARCHITECTURE.md`](docs/AI_ARCHITECTURE.md) · [`docs/SECURITY.md`](docs/SECURITY.md) · [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) · [`docs/TESTING.md`](docs/TESTING.md) · [`docs/DESIGN.md`](docs/DESIGN.md)

---

# AGENT.md — TheViralFinds AI Agent Guidelines

---

## Table of Contents

1. [Project Structure & Module Organization](#1-project-structure--module-organization)
2. [Agent Reasoning Protocol](#2-agent-reasoning-protocol)
3. [Agent Routing Guide](#3-agent-routing-guide)
4. [OpenClaw Integration](#4-openclaw-integration)
5. [Build, Test & Development Commands](#5-build-test--development-commands)
6. [Common Codebase Patterns](#6-common-codebase-patterns)
7. [Task Handoff Contract](#7-task-handoff-contract)
8. [Error Recovery Playbook](#8-error-recovery-playbook)
9. [Pre-Action Self-Audit Checklist](#9-pre-action-self-audit-checklist)
10. [Codebase Navigation Strategy](#10-codebase-navigation-strategy)
11. [Coding Style & Naming Conventions](#11-coding-style--naming-conventions)
12. [Testing Guidelines](#12-testing-guidelines)
13. [Known Issues](#13-known-issues)
14. [Commit & Pull Request Guidelines](#14-commit--pull-request-guidelines)
15. [Security & Configuration Tips](#15-security--configuration-tips)
16. [Common Anti-Patterns (Do NOT)](#16-common-anti-patterns-do-not)

---

## Quick Reference

The 5 commands you'll use most often:

```bash
bun run dev:all          # Start everything (app + mini-services)
bun run lint             # Check code quality
bun run build            # Verify production build
bun run test             # Run test suite
bun run db:generate      # Regenerate Prisma client after schema changes
```

Auth import (copy-paste): `import { authOptions } from '@/app/api/auth/[...nextauth]/route'`

---

## 1. Project Structure & Module Organization

This repo is a **Next.js 16 + React 19** app using the App Router.

```
src/
├── app/              # Routes and API handlers (App Router)
├── components/       # Reusable UI components
│   └── pages/        # Page-specific components (colocated)
├── hooks/            # Custom React hooks
├── lib/              # Shared utilities and integrations
│   └── openclaw/     # AI agent integration layer (see §4)
└── store/            # Zustand global state

prisma/               # DB schema and seed files
public/               # Static assets, product art
  └── shopee-office/  # Game assets
mini-services/
  ├── db-service/     # Local DB support service
  └── notification-service/  # Local notification support service
examples/             # Reference code only — DO NOT import in production
```

> **Rule**: If a file lives in `examples/`, treat it as read-only documentation, not importable code.

---

## 2. Agent Reasoning Protocol

> This is the most important section. Follow this before taking **any** action.

### 2.1 Think-Before-Act Order

```
1. CLARIFY   → Do I have enough context?
               If not, ask ONE specific, targeted question before proceeding.
               Never make assumptions silently.

2. PLAN      → Write out steps before executing.
               Never jump straight to code or tool calls.
               For multi-step tasks, list every step and expected output.

3. EXECUTE   → Run one step at a time.
               Verify output matches expectation before next step.

4. VERIFY    → After each action, confirm the result is correct.
               If not, stop and diagnose before continuing.

5. ROLLBACK  → If a step fails, revert before proceeding.
               Never leave the system in a half-committed state.
```

### 2.2 Decision Heuristics

When choosing between two valid approaches, always prefer the one that is:

- **More reversible** — prefer soft deletes over hard deletes, feature flags over deploys
- **Closer to existing patterns** — read surrounding code first, match conventions
- **Safer for live users** — if in doubt, do less and confirm

### 2.3 Confidence Threshold

Before returning a result or committing a change, ask:

> "Am I at least 80% confident this is correct and won't break anything?"

If no → stop, surface uncertainty, and request clarification. Never fake confidence.

### 2.4 Scope Discipline

- **Do only what was asked.** Do not add unrequested features or refactors.
- **One concern per action.** Don't mix a bug fix with a refactor in the same commit.
- **Document side effects.** If your change affects more than the target, say so explicitly.

---

## 3. Agent Routing Guide

8 live agents are registered on the VPS. Always route to the **most specific** agent.

### 3.1 Routing Table

| Task Type | Preferred Agent |
|---|---|
| Market research, trends, competitor analysis | `niagaresearch` |
| Social content, copywriting, campaigns | `niagamarketing` |
| DB queries, migrations, data ops | `niagaops` |
| Code execution, file operations, scripting | `niagacomputer` |
| Aggregating multi-source data | `niagaaggregator` |
| Reporting, summaries, dashboards | `niagareporter` |
| Hub / cross-system coordination | `niagahubbot` |
| General fallback (spans 3+ domains) | `main` (NiagaBot) |

### 3.2 Routing Rules

```
RULE 1: Always prefer specialist agent over `main`.
RULE 2: Only escalate to `main` if task genuinely spans 3+ domains.
RULE 3: If unsure, default to `niagaresearch` for information tasks,
        `niagacomputer` for execution tasks.
RULE 4: Never hardcode agent assumptions — verify agent availability
        dynamically via GET /v1/models before spawning.
```

### 3.3 Multi-Agent Orchestration

For tasks requiring multiple agents, use `sessions_spawn` — not manual pipeline loops.

```
Parent agent (main/niagahubbot)
├── spawns → niagaresearch  (gather data)
├── spawns → niagamarketing (generate content)
└── spawns → niagareporter  (compile report)
```

Each sub-agent operates independently. Parent collects results only after all complete (or timeout).

---

## 4. OpenClaw Integration

The AI integration layer lives in `src/lib/openclaw/` as a modular directory.

### 4.1 Module Map

| File | Responsibility |
|---|---|
| `gateway-client.ts` | Core HTTP client — circuit breaker, retry, streaming |
| `ws-client.ts` | WebSocket client — presence, health events, agent activity |
| `tools.ts` | Tool discovery (`GET /v1/models`) and invocation (`POST /tools/invoke`) |
| `agents.ts` | Agent discovery and native sub-agent orchestration via `sessions_spawn` |
| `automation.ts` | Cron jobs, hooks (`/hooks/wake`, `/hooks/agent`), scheduled tasks |
| `index.ts` | Barrel export — maintains backward compatibility |

### 4.2 Hard Rules

```
✅ DO:   Use `openclaw/<agentId>` model format (e.g., openclaw/niagaresearch)
✅ DO:   Use POST /tools/invoke with body { tool, action, args, sessionKey }
✅ DO:   Pass `x-openclaw-session-key` header for persistent sessions
✅ DO:   Use native sessions_spawn for sub-agent orchestration
✅ DO:   Fetch tools and agents dynamically from gateway
✅ DO:   Auth via Bearer token in OPENCLAW_GATEWAY_TOKEN env var

❌ DON'T: Use `niaga-default` as model name
❌ DON'T: Call /v1/tools/execute (does not exist)
❌ DON'T: Hardcode agent or tool lists
❌ DON'T: Retry when circuit breaker is OPEN
```

### 4.3 Gateway Info

- External URL: `https://operator.gangniaga.my` (via nginx reverse proxy)
- VPS binding: `127.0.0.1:18789` (loopback only — not directly accessible)
- Auth: Bearer token via `OPENCLAW_GATEWAY_TOKEN`

---

## 5. Build, Test & Development Commands

Use **Bun** at the repo root for all commands.

```bash
# Setup
bun install              # Install deps + trigger prisma generate

# Development
bun run dev              # Start Next.js on http://localhost:3000
bun run dev:all          # Start app + both mini-services
bun run dev:db           # Start DB mini-service only
bun run dev:notif        # Start notification mini-service only

# Quality Gates (run ALL before PR)
bun run lint             # ESLint across repo
bun run build            # Production build check
bun run test             # Run Vitest suite
bun run test:watch       # Run Vitest in watch mode (interactive dev)
bun run test:coverage    # Run Vitest with coverage report

# Database
bun run db:generate      # Regenerate Prisma client after schema changes
bun run db:push          # Sync schema (DEV ONLY)
bun run db:migrate       # Run migrations (use in staging/prod)
bun run db:reset         # Reset local migrations (DEV ONLY)
```

> ⚠️ **Never run `db:push` or `db:reset` in production.** Always use `db:migrate`.

---

## 6. Common Codebase Patterns

Read this before writing any new code. Match existing patterns — don't invent new ones.

### 6.1 API Route Template

All routes follow: **validate → auth check → execute → typed response**

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  // 1. Auth check — always first
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validate input
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  // 3. Execute
  const result = await prisma.something.findUnique({ where: { id } })
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 4. Return typed response — never return raw Prisma objects
  return NextResponse.json({ data: { id: result.id, name: result.name } })
}
```

### 6.2 Auth Check Pattern

```typescript
// Always use this exact pattern — never reinvent auth checking
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
const userId = session.user.id // always string, never undefined after this point
```

### 6.3 Redis Cache Pattern (Read-Through)

```typescript
// Check Redis first → fallback to DB → repopulate cache
const cacheKey = `resource:${id}`

const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const fresh = await prisma.resource.findUnique({ where: { id } })
if (!fresh) return null

await redis.setex(cacheKey, 300, JSON.stringify(fresh)) // 5 min TTL
return fresh
```

### 6.4 OpenClaw Tool Invocation Pattern

```typescript
// Always handle circuit breaker open state
import { gatewayClient } from '@/lib/openclaw'

try {
  const res = await gatewayClient.post('/tools/invoke', {
    tool: 'toolName',
    action: 'actionName',
    args: { /* ... */ },
    sessionKey: 'session-id'
  })
  return res.data
} catch (err: unknown) {
  if (err instanceof CircuitOpenError) {
    // Do NOT retry — surface to caller immediately
    throw new Error('AI gateway temporarily unavailable')
  }
  throw err
}
```

### 6.5 Zustand Store Pattern

```typescript
// src/store/example-store.ts
import { create } from 'zustand'

interface ExampleState {
  items: Item[]
  isLoading: boolean
  fetchItems: () => Promise<void>
}

export const useExampleStore = create<ExampleState>((set) => ({
  items: [],
  isLoading: false,
  fetchItems: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/items')
      const { data } = await res.json()
      set({ items: data })
    } finally {
      set({ isLoading: false })
    }
  }
}))
```

---

## 7. Task Handoff Contract

When spawning sub-agents via `sessions_spawn`, always use this structured payload format.

### 7.1 Input Payload (Parent → Sub-Agent)

```json
{
  "task": "One sentence, imperative mood. E.g.: Fetch top 10 trending products from Shopee MY.",
  "context": "What the parent agent already knows — avoid re-fetching known data.",
  "constraints": [
    "Return JSON only",
    "Max 10 results",
    "Do not modify any database records"
  ],
  "output_format": "json | markdown | plain",
  "timeout_ms": 30000,
  "on_failure": "abort | fallback | escalate"
}
```

### 7.2 Output Payload (Sub-Agent → Parent)

```json
{
  "status": "success | partial | failed",
  "result": "...",
  "confidence": 0.85,
  "warnings": ["Rate limit approaching on source API"],
  "metadata": {
    "agent": "niagaresearch",
    "duration_ms": 1240,
    "tools_used": ["web_search", "data_parser"]
  }
}
```

### 7.3 Handoff Rules

```
- task field: one sentence max, always imperative mood
- context field: include only what sub-agent needs — no noise
- on_failure:
    "abort"     → stop entire pipeline, return error to user
    "fallback"  → use cached/default result, continue pipeline
    "escalate"  → hand off to main (NiagaBot) for human-in-the-loop
- confidence < 0.6 → parent must flag result as "low confidence" to caller
```

---

## 8. Error Recovery Playbook

**Principle: Fail loudly, fail fast. Never swallow errors silently.**

### 8.1 Gateway / HTTP Errors

| Status | Meaning | Action |
|---|---|---|
| `401` | Token invalid/expired | Refresh `OPENCLAW_GATEWAY_TOKEN`. Never retry with same token. |
| `429` | Rate limited | Wait 30s, retry once. If fails again — abort and report. |
| `503` | Circuit breaker open | Log state, notify via notification-service. DO NOT retry. |
| `504` | Gateway timeout | Check VPS health. Single retry after 10s. If fails — abort. |

### 8.2 Database Errors

```
Schema mismatch      → Run `bun run db:push` in DEV ONLY.
                       In production: write migration, get review, then deploy.

Connection timeout   → Check DATABASE_URL. Retry max 2x with exponential backoff (1s, 2s).
                       If still failing — return 503 to caller, alert ops.

Unique constraint    → This is a logic error, not a DB error.
                       Fix the upstream logic. Never catch and ignore.

Transaction rollback → Log full error with context. Surface to caller.
                       Never retry a failed transaction automatically.
```

### 8.3 Agent Spawn Failures

```
sessions_spawn fails → Fallback to sequential single-agent execution.
                       Log: which agent failed + full input payload.
                       Surface degraded mode warning to caller.

Sub-agent timeout    → Cancel session, log timeout + agent ID.
                       Return partial results if available, with warning.

All agents fail      → Escalate to main (NiagaBot) with full context.
                       If main also fails → return 503, log incident.
```

### 8.4 General Recovery Rules

```
1. Log first, then handle — never handle without logging.
2. Include context in every error: { error, input, agentId, timestamp }
3. Surface errors to caller with enough context to debug.
4. Never silently swallow: catch (e) {} is forbidden.
5. Prefer explicit error types over generic Error throws.
```

---

## 9. Pre-Action Self-Audit Checklist

Run through this mentally before **writing code** and before **returning a result**.

### 9.1 Before Writing Code

```
[ ] Does this touch auth, payments, or user PII? → Extra caution required.
[ ] Am I modifying a shared utility in src/lib/? → Check all callers first.
[ ] Am I adding a new env var? → Update .env.example with a placeholder.
[ ] Am I adding a new Prisma model? → Write a proper migration, not just db:push.
[ ] Am I changing an existing API response shape? → Check all consumers first.
[ ] Does this introduce new dependencies? → Justify why existing tools can't solve it.
[ ] Is this in examples/? → Do not modify. Reference only.
```

### 9.2 Before Returning a Result

```
[ ] Did I run: bun run lint?
[ ] Did I verify: bun run build completes without errors?
[ ] Did I run: bun run test (all existing tests still pass)?
[ ] Is my output format exactly what the caller specified?
[ ] Did I document all side effects?
[ ] Is my confidence ≥ 80%? If not, flag uncertainty explicitly.
[ ] Did I avoid hardcoding any values that should be env vars or config?
```

---

## 10. Codebase Navigation Strategy

### 10.1 How to Find Things

```
Find a route          → src/app/api/** — folder structure mirrors URL structure
Find a component      → src/components/pages/ (page-specific)
                        src/components/ (shared/reusable)
Find state logic      → src/store/ — Zustand stores, named by domain
Find a utility        → src/lib/ — grouped by concern (openclaw, auth, cache, etc.)
Understand DB shape   → prisma/schema.prisma — always read this before writing queries
Find reference code   → examples/ — read-only, do not import
Find mini-services    → mini-services/db-service, mini-services/notification-service
```

### 10.2 Search Strategy

```
GOOD: Search by feature name or business concept (e.g., "product", "order", "affiliate")
BAD:  Search by file name guessing (e.g., "utils", "helper", "misc")

When exploring an unfamiliar area:
1. Read prisma/schema.prisma for the data model
2. Find the API route in src/app/api/
3. Trace from route → lib → DB
4. Then look at the component that consumes it
```

### 10.3 Before Touching Any File

1. Read the file fully — understand intent before editing
2. Check git history for context on why something was done
3. Search for all imports/usages of the file
4. Understand the test coverage (if any) before making changes

---

## 11. Coding Style & Naming Conventions

TypeScript is `strict`. Path alias: `@/*` maps to `src/*`.

```
Indentation:      2 spaces
Quotes:           Single quotes
Semicolons:       None
Components:       PascalCase    (e.g., ProductCard, DashboardPage)
Functions/stores: camelCase     (e.g., fetchProducts, useCartStore)
Route segments:   kebab-case    (e.g., /api/product-listings)
File names:       kebab-case    (e.g., dashboard-page.tsx, service-urls.ts)
API handlers:     src/app/api/**/route.ts
Page components:  src/components/pages/*
```

**Type discipline:**

- Never use `as any` unless absolutely unavoidable — define proper types instead
- Never use `@ts-ignore` — fix the actual type issue
- Prefer `unknown` over `any` when type is truly unknown, then narrow with guards

---

## 12. Testing Guidelines

**Current state:** Vitest — run `bun run test` to see current count. Coverage ~0.5% (run `bun run test:coverage` to check).

> ℹ️ Test files: `cache.test.ts`, `rate-limit.test.ts`, `validations.test.ts` — see `src/` for colocated tests.

**Minimum quality gate (must pass before every PR):**

```bash
bun run lint
bun run build
bun run test
```

### 12.1 Test File Conventions

- Colocate tests near the feature: `*.test.ts` or `*.spec.tsx`
- Unit tests: pure functions, utilities, validators
- Integration tests: API routes with mocked DB/Redis
- Never test implementation details — test behaviour and contracts

### 12.2 Priority Areas for New Tests

```
Priority 1 (Critical):
  - Auth routes (login, session, logout)
  - OpenClaw gateway-client circuit breaker logic
  - DB service input validation

Priority 2 (High):
  - Top 20 most-used API routes
  - Redis cache read/write/invalidation
  - Task handoff payload validation

Priority 3 (Medium):
  - Zustand store actions
  - Critical UI components (forms, data tables)
  - Agent routing logic
```

**Coverage target:** Move from 0.5% → 30% covering all Priority 1 areas first.

---

## 13. Known Issues

### ✅ Resolved (from 5-Agent Audit — 12 April 2026)

- ~~**No User Model**~~ — FIXED: User model in Prisma schema with full relations
- ~~**In-memory stores**~~ — FIXED: Upstash Redis is PRIMARY for rate-limiting and caching
- ~~**Missing security headers**~~ — FIXED: CSP, HSTS, X-Frame-Options in next.config.ts
- ~~**Dead code**~~ — FIXED: config.ts and db-timeout.ts removed
- ~~**Math.random() in production**~~ — FIXED: DEMO_MODE production hard-fail guard added
- ~~**WebSocket singleton**~~ — FIXED: ws-client.ts uses lazy initialization
- ~~**Middleware static bypass**~~ — FIXED: Specific file extensions only
- ~~**Plaintext passwords**~~ — FIXED: bcrypt only, account lockout added
- ~~**Temporary user ID**~~ — FIXED: Auth fails closed on upsert failure

### ⚠️ Remaining Issues

| Issue | Priority | Notes |
|---|---|---|
| Test coverage ~0.5% | **High** | All Priority 1 areas have zero coverage |
| No structured logging | Medium | Replace console.log with pino or winston |
| `as any` type assertions remain | Medium | Define proper session types |
| No API size limits at edge | Medium | Vercel/edge limits not enforced yet |

---

## 14. Commit & Pull Request Guidelines

### 14.1 Commit Format

Follow Conventional Commits:

```
feat: add product recommendation agent route
fix: resolve session expiry on gateway timeout
chore: update openclaw gateway-client retry logic
docs: update agent routing table in AGENT.md
test: add circuit breaker unit tests
refactor: replace as any with typed session interface
```

### 14.2 PR Checklist

Every PR must include:

```
[ ] Short description — what changed and why
[ ] Impacted areas — list all touched modules/routes
[ ] Env changes — any new/modified env vars (update .env.example)
[ ] Schema changes — any Prisma model changes + migration file
[ ] Manual verification steps — how to test this change locally
[ ] Quality gates passed — lint + build + test all green
[ ] Screenshots/recordings — for any UI changes under src/components/pages
      or src/components/shopee-office
```

---

## 15. Security & Configuration Tips

### 15.1 Environment Variables

```bash
# Required secrets — keep local or in Vercel env vars only
DATABASE_URL          # PostgreSQL connection string
NEXTAUTH_SECRET       # NextAuth signing secret
OPENCLAW_GATEWAY_TOKEN # Bearer token for AI gateway
# + any service tokens from .env.example
```

**Rules:**

- Start from `.env.example` — never commit actual secrets
- `SKIP_AUTH=false` and `DEMO_MODE=false` must be set in staging and production
- Any new env var must be added to `.env.example` with a placeholder comment

### 15.2 Security Checklist

```
[ ] No secrets in Git — ever
[ ] bcrypt only for passwords — no plaintext, no MD5/SHA1
[ ] Account lockout active — check auth config
[ ] CSP, HSTS, X-Frame-Options confirmed in next.config.ts
[ ] All API routes have auth check as first operation
[ ] No raw Prisma objects returned in API responses
[ ] Input validation before any DB write
[ ] Redis keys namespaced to avoid collisions
```

### 15.3 Gateway Security

The OpenClaw Gateway:

- Binds to `127.0.0.1:18789` on the VPS — loopback only
- Only accessible externally via nginx reverse proxy at `operator.gangniaga.my`
- All requests require Bearer token auth
- Never expose the VPS IP or internal port directly

---

## 16. Common Anti-Patterns (Do NOT)

Learned from past incidents and audits. **Never repeat these.**

### 16.1 Code Anti-Patterns

```
❌ import { authOptions } from '@/lib/auth'
✅ import { authOptions } from '@/app/api/auth/[...nextauth]/route'
   → authOptions is exported from the NextAuth route handler, not a lib file.

❌ catch (e) {}          // silently swallowing errors
✅ catch (err: unknown) { console.error('[context]', err); throw err }

❌ as any                // type escape hatch
✅ as TypedSession       // define and use proper types

❌ Math.random()         // for IDs, tokens, or security
✅ crypto.randomUUID()   // cryptographically secure

❌ return NextResponse.json(prismaResult)
✅ return NextResponse.json({ data: { id: result.id, name: result.name } })
   → Never expose raw Prisma objects; always shape the response.
```

### 16.2 Architecture Anti-Patterns

```
❌ Importing from examples/ in production code
   → examples/ is reference-only. Copy and adapt, never import.

❌ Running db:push or db:reset in staging/production
   → Always use db:migrate with a proper migration file.

❌ Hardcoding agent names: if (agent === 'niagaresearch') { ... }
   → Fetch dynamically via GET /v1/models.

❌ Manual multi-agent pipeline loops
   → Use sessions_spawn for orchestrated sub-agent execution.

❌ Storing secrets in code or committing .env
   → Use .env.example with placeholders; real values in Vercel/local only.
```

### 16.3 Operational Anti-Patterns

```
❌ Retrying when circuit breaker is OPEN
   → Log and surface immediately. Wait for circuit to close.

❌ Retrying with the same expired token on 401
   → Refresh OPENCLAW_GATEWAY_TOKEN first.

❌ Mixing a bug fix with a refactor in one commit
   → One concern per commit. Always.

❌ Deploying without running: bun run lint && bun run build && bun run test
   → These three are the minimum quality gate. No exceptions.
```

---

*End of AGENTS.md — When in doubt, re-read §2 (Reasoning Protocol), §9 (Self-Audit Checklist), and §16 (Anti-Patterns).*
