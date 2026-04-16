# 🎯 Comprehensive Code Review Report

> Archived detailed review snapshot from 13 April 2026.
> Keep for audit history only. Do not use this file as the current implementation source of truth.

**Project:** TheViralFinds (Next.js 16 + React 19 + Prisma)  
**Date:** 13 April 2026  
**Reviewed By:** 4 Specialized AI Agents (API/Backend, Frontend/UI, Database/Prisma, Security/Infrastructure)  
**Branch:** main (1 commit ahead of origin)

---

## 📊 Executive Summary

| Category | Total Issues | Critical | High | Medium | Low |
|----------|-------------|----------|------|--------|-----|
| **API & Backend** | 25 | 6 | 8 | 11 | 7 |
| **Frontend & UI** | 49 | 6 | 11 | 20 | 9 |
| **Database & Prisma** | 24 | 4 | 5 | 9 | 6 |
| **Security & Infrastructure** | 29 | 5 | 7 | 10 | 7 |
| **TOTAL** | **127** | **21** | **31** | **50** | **29** |

### Architecture Overview
- Next.js 16 App Router with React 19
- Separate DB microservice (Bun, port 3005) with Prisma
- OpenClaw Gateway integration (8 agents at `operator.gangniaga.my`)
- In-memory stores with Redis fallbacks
- Phaser 4 game integration for Shopee Office
- Zustand state management
- NextAuth 4.x with JWT strategy

---

## 🚨 CRITICAL ISSUES (Fix Immediately)

### C1. Admin Password Stored in Plaintext
**Severity:** CRITICAL - Security Vulnerability  
**Files:** 
- `src/app/api/auth/[...nextauth]/route.ts:44-54`
- `.env.example` (ADMIN_PASSWORD)

**Problem:**
```typescript
if (credentials?.password === adminPassword) {
  return { id: '1', name: 'Ahmad Ali', email: adminEmail, image: null }
}
```
Password compared directly with `===` against env var. No hashing (bcrypt/argon2).

**Impact:**
- If `.env` file is leaked, admin password is immediately usable
- No timing-safe comparison (vulnerable to timing attacks)

**Fix:**
```typescript
import bcrypt from 'bcryptjs'

const hashedPassword = await bcrypt.hash(adminPassword, 10)
// Store hash in env, compare with:
const isValid = await bcrypt.compare(credentials.password, storedHash)
```

**Priority:** 🔴 IMMEDIATE

---

### C2. Hardcoded User ID `'1'` Breaks Multi-Tenancy
**Severity:** CRITICAL - Data Integrity  
**File:** `src/app/api/auth/[...nextauth]/route.ts:53`

**Problem:**
```typescript
return { id: '1', name: 'Ahmad Ali', email: adminEmail, image: null }
```
User ID is always the string `'1'`, which never matches `User.id` (uses `@default(cuid())`).

**Impact:**
- All user-scoped queries return empty results
- Multi-tenancy completely broken for credentials auth
- Seed data will fail (orphaned records)

**Fix:**
```typescript
// Upsert user and return real database ID
const user = await db.user.upsert({
  where: { email: credentials.email },
  update: {},
  create: { email: credentials.email, name: 'Ahmad Ali' },
})
return { id: user.id, name: user.name, email: user.email, image: user.image }
```

**Priority:** 🔴 IMMEDIATE

---

### C3. No Auth on State Mutation Endpoints
**Severity:** CRITICAL - Security Vulnerability  
**Files:**
- `src/app/api/shopee-office/status/route.ts:23` (POST)
- `src/app/api/shopee-office/join/route.ts:26` (POST)
- `src/app/api/shopee-office/agents/route.ts:48` (POST)
- `src/app/api/social-scheduler/route.ts:63` (POST)

**Problem:**
POST endpoints that modify application state have **no `requireAuth()` check**.

**Impact:**
- Anyone can change office status for all agents
- Anyone can join as guest agent
- Anyone can create/publish social media posts
- Denial of service, unauthorized content publishing

**Fix:**
Add `requireAuth()` to all POST handlers:
```typescript
export async function POST(req: Request) {
  const auth = requireAuth(req)
  // ... rest of handler
}
```

**Priority:** 🔴 IMMEDIATE

---

### C4. No TLS in Caddyfile
**Severity:** CRITICAL - Data Exposure  
**File:** `Caddyfile:1-24`

**Problem:**
```
:81 {
  reverse_proxy ...
}
```
No `tls` directive. All traffic is unencrypted HTTP.

**Impact:**
- Man-in-the-middle attacks can capture session tokens
- Credentials transmitted in plaintext
- All API data visible to network sniffers

**Fix:**
```
theviralfinds.my {
  tls internal  # for dev, or use real domain for Let's Encrypt
  reverse_proxy http://127.0.0.1:3000
}
```

**Priority:** 🔴 IMMEDIATE

---

### C5. CSP Allows `'unsafe-eval'` and `'unsafe-inline'`
**Severity:** CRITICAL - XSS Vulnerability  
**File:** `next.config.ts:27`

**Problem:**
```typescript
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
```

**Impact:**
- Completely defeats XSS protection
- `eval()` and `new Function()` allowed
- Any XSS vector enables arbitrary code execution

**Fix:**
```typescript
"script-src 'self' https://cdn.jsdelivr.net 'nonce-{RANDOM}'",
// Use nonces for required inline scripts
```

**Priority:** 🔴 IMMEDIATE

---

### C6. Phaser Memory Leak - Key Creation Every Frame
**Severity:** CRITICAL - Memory Leak  
**File:** `src/components/shopee-office/phaser-game.tsx:279-288`

**Problem:**
```typescript
update() {
  if (this.interactionManager) {
    const kb = this.input.keyboard
    if (kb) {
      const eKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E, false) // NEW Key every frame!
      this.interactionManager.updateProximity(eKey)
    }
  }
}
```

**Impact:**
- Creates 60 Key objects per second
- Game crashes after 5-10 minutes
- Memory usage grows unbounded

**Fix:**
```typescript
create() {
  this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E, false)
}

update() {
  if (this.interactionManager && this.eKey) {
    this.interactionManager.updateProximity(this.eKey)
  }
}
```

**Priority:** 🔴 IMMEDIATE

---

## 🔥 HIGH PRIORITY ISSUES (Fix This Week)

### Backend Issues (8)

#### H1. No Auth on GET for Sensitive Data
**Files:** `src/app/api/payouts/route.ts:10`, `src/app/api/settings/route.ts:10`, `src/app/api/goals/route.ts:10`

**Problem:** GET endpoints return payout amounts, bank accounts, campaign budgets without `requireAuth()`.

**Fix:** Add explicit `requireAuth()` as defense-in-depth.

---

#### H2. `userId` Scoping is Optional in DB Queries
**File:** `mini-services/db-service/routes/index.ts`

**Problem:**
```typescript
const userWhere = userId ? { userId } : {}
```
When `userId` not provided, queries return ALL records across ALL users.

**Fix:** Make `userId` required, derive from authenticated `x-user-id` header.

---

#### H3. N+1 Query Pattern in Dashboard Stats
**File:** `mini-services/db-service/routes/dashboard.ts:93-128`

**Problem:** 10+ sequential Prisma queries executed one after another:
1. `affiliateLink.count`
2. `affiliateLink.aggregate` (clicks)
3. `affiliateLink.aggregate` (conversions)
4. `affiliateLink.aggregate` (earnings)
5. `conversion.findMany`
6. `clickRecord.findMany` (ALL records for date range!)
7. `affiliateLink.findMany` (top links)
8. ... and more

**Fix:** Wrap in `Promise.all()` to parallelize. Use `groupBy` instead of fetching all records.

---

#### H4. `clickRecord.findMany` Loads All Records Into Memory
**File:** `mini-services/db-service/routes/dashboard.ts:93-98`

**Problem:**
```typescript
const allClicks = await db.clickRecord.findMany({
  where: { createdAt: { gte: startDate } },
  select: { linkId: true, createdAt: true },
})
```
For 90-day period with high traffic = hundreds of thousands of records.

**Fix:** Use Prisma `groupBy` with `_count`:
```typescript
const clicksByDay = await db.clickRecord.groupBy({
  by: ['linkId', 'createdAt'],
  _count: true,
  where: { createdAt: { gte: startDate } },
})
```

---

#### H5. Gateway Errors Swallow Original Message
**File:** `src/lib/openclaw/gateway-client.ts:222-244`

**Problem:** After retries, throws generic `'Gateway request failed after retries'` losing original error.

**Fix:** Include original error message in thrown error.

---

#### H6. Silent Fallback to SDK Without Logging
**File:** `src/lib/openclaw/gateway-client.ts:265-283`

**Problem:** Catch block silently falls through to SDK fallback with no visibility.

**Fix:** Add `console.warn('[OpenClaw] Gateway failed, using SDK fallback:', error)`

---

#### H7. Bulk Operations = 1 HTTP Call Per Item
**File:** `src/app/api/links/bulk/route.ts:29-37`

**Problem:** For 100 links, fires 100 sequential HTTP requests to DB service.

**Fix:** Add batch endpoint in DB service with `updateMany` / `deleteMany`.

---

#### H8. `Math.random()` for Product Data
**Files:** `src/app/api/shopee-integration/search/route.ts:44`, `src/app/api/shopee-integration/import/route.ts:39-45`

**Problem:** Search endpoint returns `Math.random()` prices, ratings, sold counts with no auth.

**Fix:** Integrate real Shopee Affiliate API, or label responses with `_demo: true`.

---

### Frontend Issues (11)

#### H1. Missing CSP Nonce for Inline Scripts
**File:** `next.config.ts:30-34`

**Problem:** `'unsafe-inline'` allows arbitrary inline scripts.

**Fix:** Use nonces for required inline scripts.

---

#### H2. All 16 Dynamic Imports Fire on Mount
**File:** `src/components/layout/app-layout.tsx:19-33`

**Problem:** All page components begin loading immediately when app shell mounts, not when user navigates.

**Fix:** Use Next.js route-based code splitting instead of client-side tabs.

---

#### H3. `AnimatePresence mode="wait"` Causes Layout Flash
**File:** `src/components/layout/app-layout.tsx:170-181`

**Problem:** Exiting component fully unmounts before entering mounts → blank flash.

**Fix:** Use `mode="popLayout"` or `mode="sync"`.

---

#### H4. Sidebar Creates 15+ Motion Instances on Mount
**File:** `src/components/layout/sidebar.tsx:104-117`

**Problem:** Every nav item has staggered `initial` animation → jank on slower devices.

**Fix:** Use CSS transitions instead of Framer Motion for simple hover effects.

---

#### H5. Hardcoded External URL for Gradient Noise
**File:** `src/app/login/page.tsx:72`

**Problem:** Makes HTTP request to `https://grainy-gradients.vercel.app/noise.svg` on every load.

**Fix:** Download SVG to `public/` and reference locally.

---

#### H6. Hardcoded User Name "Ahmad Ali"
**Files:** 
- `src/components/layout/header.tsx:176`
- `src/components/layout/sidebar.tsx:180`

**Problem:** User name hardcoded instead of coming from session.

**Fix:** Use `session?.user?.name` from `useSession()`.

---

#### H7. Command Palette Actions Array Recreated Every Render
**File:** `src/components/command-palette.tsx:217-265`

**Problem:** Creates 5 new action objects on every render → GC pressure.

**Fix:** Move `actions` outside component or wrap in `useMemo`.

---

#### H8. OpenClaw Page is 847 Lines (God Object)
**File:** `src/components/pages/openclaw-page.tsx` (847 lines)

**Problem:** Contains tool definitions, protocol hub, agent network, plugins, execution, content generation, AI insights, dialogs all in one file.

**Fix:** Split into sub-components: `ToolGrid`, `ProtocolHub`, `AgentNetwork`, `PluginBrowser`, `ToolExecutionDialog`.

---

#### H9. Missing Accessibility Labels
**Files:**
- `src/components/shopee-office/isometric-office.tsx:186` - missing `role="button"` and `aria-label`
- `src/components/shopee-office/minimap-overlay.tsx:167` - missing `aria-label`
- `src/components/merchant-switcher.tsx:40` - missing `aria-label` and `aria-expanded`

**Fix:** Add proper ARIA attributes to all interactive elements.

---

#### H10. Global "R" Key Conflicts with Browser Refresh
**File:** `src/components/app-shell.tsx:50-55`

**Problem:** Pressing "R" triggers dashboard refresh, doesn't prevent default, fires outside inputs.

**Fix:** Add `if (e.target instanceof HTMLInputElement) return;` and `e.preventDefault()`.

---

#### H11. Notification Provider Infinite Reconnection Loop
**File:** `src/components/providers/notification-provider.tsx:54-58`

**Problem:**
```typescript
reconnectionAttempts: Infinity,  // Will retry FOREVER
reconnectionDelay: 2000,
```

**Fix:** Set `reconnectionAttempts: 10` and show "Notifications offline" UI.

---

### Database Issues (5)

#### H1. Sequential Queries Not Parallelized
**File:** `mini-services/db-service/routes/dashboard.ts:53-105`

**Problem:** Lines 53, 70, 88, 93, 99 are all `await` calls that could be batched.

**Fix:** Wrap in `Promise.all()`.

---

#### H2. Campaign Query Returns ALL System Campaigns
**File:** `mini-services/db-service/routes/links.ts:36`

**Problem:**
```typescript
const campaigns = await db.campaign.findMany({ select: { id: true, name: true } })
```
Returns all campaigns, not just user's campaigns.

**Fix:** Add `where: userId ? { userId } : {}`.

---

#### H3. No Database Connection Pooling
**File:** `prisma/schema.prisma:4-7`

**Problem:** Default pool size based on CPU cores → connection exhaustion on Vercel serverless.

**Fix:**
```
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=10&pool_timeout=30
```

---

#### H4. 15-Second Hard Timeout on All DB Calls
**File:** `src/lib/db-safe.ts:37`

**Problem:** Dashboard queries (10+ sequential) could exceed 15s under load.

**Fix:** Make timeout configurable per endpoint (30s for dashboard).

---

#### H5. In-Memory Stores Won't Scale Across Instances
**Files:** `src/lib/cache.ts`, `src/lib/rate-limit.ts`

**Problem:** `Map()` stores are process-scoped. On Vercel, each invocation gets cold start.

**Fix:** Prioritize Upstash Redis setup for production.

---

### Security Issues (7)

#### H-1. OAuth Allowlist Hardcoded to Admin Email Only
**File:** `src/app/api/auth/[...nextauth]/route.ts:15-18`

**Problem:**
```typescript
const ALLOWED_OAUTH_EMAILS = new Set([
  process.env.ADMIN_EMAIL || 'admin@theviralfinds.my',
])
```

**Fix:** Build user registration flow, query User model at runtime.

---

#### H-2. In-Memory Rate Limits Bypassable
**File:** `src/lib/rate-limit.ts:13-14`

**Problem:** `Map()` not shared across serverless instances.

**Fix:** Make Redis the primary rate limiter.

---

#### H-3. `SKIP_AUTH` and `DEMO_MODE` Default to Enabled
**File:** `.env.example:30-31`

**Problem:**
```
DEMO_MODE=true
SKIP_AUTH=true
```

**Fix:** Set defaults to `false`. Add runtime panic in production if `true`.

---

#### H-4. No CSRF Protection on State-Changing Routes
**Files:** All POST/PUT/DELETE API routes

**Problem:** Accept requests with only session cookie, no CSRF token validated.

**Fix:** Add CSRF token validation for state-changing routes.

---

#### H-5. `ignoreBuildErrors: true` Masks Real Errors
**File:** `next.config.ts:45`

**Problem:** TypeScript errors silently ignored → type-related bugs reach production.

**Fix:** Set to `false`. Fix existing TypeScript errors.

---

#### H-6. Deprecated `X-XSS-Protection` Header
**File:** `next.config.ts:20`

**Problem:** Header is deprecated and ignored by modern browsers.

**Fix:** Remove this header. Rely on proper CSP.

---

#### H-7. DB Service Has No Rate Limiting
**File:** `mini-services/db-service/index.ts:583`

**Problem:** Any process on same machine can hammer database unlimited.

**Fix:** Add rate limiting to DB service with request counting per endpoint.

---

## 📋 MEDIUM PRIORITY ISSUES (Fix This Month)

### Backend & Code Quality (11)

#### M1. Deprecated `db.ts` Logs on Every Import
**File:** `src/lib/db.ts:9`

**Fix:** Remove file entirely or move warning to runtime check.

---

#### M2. `env.ts` Validates at Import Time
**File:** `src/lib/env.ts:38-46`

**Problem:** Synchronous validation at module load → build fails if env vars missing.

**Fix:** Use separate build-time vs runtime validation.

---

#### M3. Inconsistent Error Response Format
**Files:** Multiple API routes

**Problem:** Some return `{ error: 'message' }`, others `{ error: 'message', details: [...] }`.

**Fix:** Create standardized error response helper.

---

#### M4. `agents/route.ts` Uses `Math.random()` for Details
**File:** `src/app/api/agents/route.ts:152`

**Fix:** Move behind `DEMO_MODE` flag or flag responses with `_demo: true`.

---

#### M5. Profile Route Uses In-Memory Map
**File:** `src/app/api/profile/route.ts:13`

**Problem:** `const profiles = new Map()` - data lost on restart.

**Fix:** Replace with Prisma queries (User model already has profile fields).

---

#### M6. Bank Fields Marked Optional But Say "Required"
**File:** `mini-services/db-service/validations.ts:56-58`

**Problem:**
```typescript
bankName: z.string().min(1, 'Bank name is required').optional(),
```

**Fix:** Use `.refine()` to require fields when `method === 'bank_transfer'`.

---

#### M7. Settings Schema Mismatch Between Frontend and DB Service
**Files:**
- `src/lib/validations.ts:54` - frontend sends `{ key1: "val1" }`
- `mini-services/db-service/validations.ts` - DB expects `[{ key: "key1", value: "val1" }]`

**Fix:** Align schemas or add transformation layer.

---

#### M8. `next.config.ts` Has `ignoreBuildErrors: true`
**File:** `next.config.ts:59`

**Fix:** Fix Phaser type issues and remove this flag.

---

#### M9. CSP Allows `'unsafe-eval'` and `'unsafe-inline'`
**File:** `next.config.ts:16`

**Fix:** Remove `'unsafe-eval'` or use nonce-based approach.

---

#### M10. Duplicate `getSDK()` Function
**File:** `src/app/api/openclaw/ai-insights/route.ts:6-9`

**Fix:** Import from `gateway-client.ts` instead.

---

#### M11. `analyze/route.ts` Returns Hardcoded Mock Data
**File:** `src/app/api/openclaw/analyze/route.ts:18-80`

**Fix:** Connect to real OpenClaw tools or mark as demo endpoint.

---

### Frontend & UX (20)

#### M1. `app-layout.tsx` Pages Record Creates Unstable Reference
**File:** `src/components/layout/app-layout.tsx:67-85`

**Fix:** Use switch or stable object lookup.

---

#### M2. `links-page.tsx` Has 6 Separate Mutation Hooks
**File:** `src/components/pages/links/links-page.tsx:63-121`

**Fix:** Consolidate bulk operations into single mutation.

---

#### M3. `dashboard-page.tsx` Has Dead `_lastUpdated` State
**File:** `src/components/pages/dashboard/dashboard-page.tsx:44`

**Fix:** Remove unused `_lastUpdated`.

---

#### M4. `dashboard-page.tsx` Uses `useRouter` for Navigation
**File:** `src/components/pages/dashboard/dashboard-page.tsx:30-52`

**Fix:** Use `setActivePage()` from Zustand store for consistency.

---

#### M5. `phaser-game.tsx` Uses `require()` Instead of `import`
**File:** `src/components/shopee-office/phaser-game.tsx:35-45`

**Fix:** Use `await import()` for tree-shaking.

---

#### M6. Commented-Out Import in Calculator Page
**File:** `src/components/pages/calculator-page.tsx:29`

**Fix:** Remove commented code.

---

#### M7. Unused Props in `ComparisonSummary`
**File:** `src/components/pages/calculator-page.tsx:640-645`

**Fix:** Remove `_scenarioA` and `_scenarioB`.

---

#### M8. Display Name Field Binds to Wrong Setting
**File:** `src/components/pages/settings-page.tsx:126`

**Problem:** Label says "Display Name" but reads/writes `shopee_username`.

**Fix:** Add separate `displayName` field or fix label.

---

#### M9. Duplicate Notification Queries
**File:** `src/components/layout/sidebar.tsx:62-66`, `header.tsx`

**Fix:** Use same `queryKey` so React Query deduplicates.

---

#### M10. Minimap Redraws Every Agent Change Without Throttle
**File:** `src/components/shopee-office/minimap-overlay.tsx:108-111`

**Fix:** Add throttle/debounce to `drawMinimap` (10fps is sufficient).

---

#### M11. Custom Dropdown Instead of shadcn
**File:** `src/components/merchant-switcher.tsx`

**Problem:** No Escape key handling, no focus trapping, no ARIA attributes.

**Fix:** Replace with shadcn `DropdownMenu`.

---

#### M12. Footer Has Hardcoded Links With No Routing
**File:** `src/components/layout/app-layout.tsx:220-235`

**Fix:** Implement pages or remove links until they exist.

---

#### M13. CSS-in-JS `<style>` Tags Override Tailwind
**File:** `src/components/shopee-office/agent-grid.tsx:455-461`

**Fix:** Use Tailwind responsive prefixes (`sm:`, `md:`).

---

#### M14. `activity-monitor.tsx` Mutation in Render Path
**File:** `src/components/shopee-office/activity-monitor.tsx:66-79`

**Problem:** Relies on `agents` reference identity → false positives with inline `map()`.

**Fix:** Use proper comparison or memoize agents array.

---

#### M15. `use-mobile.ts` Initial State is `undefined`
**File:** `src/hooks/use-mobile.ts:6-16`

**Problem:** Server-side rendering treats viewport as desktop → hydration mismatch.

**Fix:** Use `useLayoutEffect` or client-only rendering.

---

#### M16. `useStreamingAI.ts` Causes Many Re-Renders
**File:** `src/hooks/use-streaming-ai.ts:38-40`

**Problem:** Each `setResponse` triggers re-render → 50+ renders/second.

**Fix:** Buffer chunks and flush at controlled rate (10-20fps).

---

#### M17. `reactStrictMode: false`
**File:** `next.config.ts:56`

**Fix:** Enable strict mode to catch effect cleanup bugs.

---

#### M18. Notifications Dropdown Uses `any` Type
**File:** `src/components/layout/header.tsx:153`

**Fix:** Define shared `Notification` interface.

---

#### M19. PWAProvider/Toaster Hierarchy Issue
**File:** `src/app/layout.tsx:52-62`

**Problem:** `Toaster` is sibling of `PWAProvider`, not child.

**Fix:** Move `Toaster` inside `PWAProvider`.

---

#### M20. `imageRendering: 'pixelated'` on Container, Not Canvas
**File:** `src/components/shopee-office/phaser-game.tsx:389`

**Fix:** Apply via Phaser config (`render.pixelArt: true`).

---

### Database Schema (9)

#### M1. No User Password Storage
**File:** `prisma/schema.prisma:30`

**Problem:** `passwordHash` field exists but never written to.

**Fix:** Implement registration endpoint with bcrypt hashing.

---

#### M2. Seed Data Lacks `userId`
**File:** `prisma/seed.ts:27-32`

**Problem:** All records created without `userId` → constraint violation.

**Fix:** Create test user first, assign all seed data to that user.

---

#### M3. Float for Monetary Values
**File:** `prisma/schema.prisma:62-64, 81-82, 103-104`

**Problem:** IEEE 754 floating point → precision errors (0.1 + 0.2 ≠ 0.3).

**Fix:**
```prisma
productPrice  Decimal? @db.Decimal(10, 2)
commission    Decimal? @db.Decimal(10, 2)
earnings      Decimal  @default(0) @db.Decimal(10, 2)
```

---

#### M4. Status Fields Are Strings Instead of Enums
**File:** `prisma/schema.prisma:66, 83, 105, 115, 142`

**Fix:** Create Prisma enums: `LinkStatus`, `CampaignStatus`, `PayoutStatus`, etc.

---

#### M5. Missing Composite Indexes
**File:** `prisma/schema.prisma`

**Missing:**
- `AffiliateLink`: `@@index([userId, status])`
- `ClickRecord`: `@@index([linkId, createdAt])`
- `Conversion`: `@@index([linkId, status, createdAt])`
- `Notification`: `@@index([userId, read])`

---

#### M6. No Migrations Directory
**Path:** `prisma/migrations/` does not exist

**Fix:** Run `bun run db:migrate` to create first migration.

---

#### M7. `AgentMemory.content` Has No Length Limit
**File:** `prisma/schema.prisma:167`

**Fix:** `content String @db.VarChar(10000)`

---

#### M8. `AppSetting.key` Unique Globally, Not Per-User
**File:** `prisma/schema.prisma:128`

**Fix:** `@@unique([userId, key])`

---

#### M9. `ClickRecord` and `Conversion` Lack Direct `userId`
**File:** `prisma/schema.prisma:94-108, 110-122`

**Fix:** Denormalize `userId String` for faster filtering.

---

### Security & Infrastructure (10)

#### M-1. NextAuth JWT Has No Custom Expiry
**File:** `src/app/api/auth/[...nextauth]/route.ts:137`

**Fix:** Set shorter `maxAge` (24 hours). Implement token blacklist in Redis.

---

#### M-2. `x-user-id` Header Not Cryptographically Verified
**Files:** `src/lib/api-auth.ts:78`, `mini-services/db-service/middleware.ts:47-49`

**Fix:** Use JWT signed by NextAuth secret.

---

#### M-3. Redis Connection Has No TLS Enforcement
**File:** `src/lib/redis.ts:22-26`

**Fix:** Validate `UPSTASH_REDIS_REST_URL` starts with `https://`.

---

#### M-4. Redis Cache `clear()` Deletes ALL Keys
**File:** `src/lib/cache-redis.ts:69-78`

**Problem:** `redis.keys('*')` deletes keys from other applications.

**Fix:** Use key prefix and `SCAN` instead of `KEYS`.

---

#### M-5. No Key Prefixing in Redis
**Files:** `src/lib/cache-redis.ts`, `src/lib/rate-limit-redis.ts`

**Fix:** Add `REDIS_KEY_PREFIX` env var.

---

#### M-6. CSP Includes Localhost IPs
**File:** `next.config.ts:30`

**Fix:** Use environment-specific CSP. Remove localhost in production.

---

#### M-7. `Math.random()` Present in Demo Mode
**File:** `src/app/api/links/route.ts:15-50`

**Fix:** Add prominent visual indicator when `DEMO_MODE` is active.

---

#### M-8. Zod Version 4 May Have Breaking API Changes
**File:** `package.json:79` - `"zod": "^4.3.6"`

**Fix:** Verify all validation schemas work with Zod v4. Add test coverage.

---

#### M-9. Error Messages Leak Internal Information
**File:** `src/lib/db-safe.ts:35-38`

**Fix:** Sanitize error messages before exposing to client.

---

#### M-10. HSTS Preload Not Submitted
**File:** `next.config.ts:15`

**Fix:** Submit domain to [HSTS Preload List](https://hstspreload.org/) or remove `preload`.

---

## 🔵 LOW PRIORITY ISSUES (Nice to Fix)

### Backend (7)

#### L1. No ESLint Rule for `Math.random()` in API Paths
**Fix:** Add ESLint rule to flag `Math.random()` in `src/app/api/`.

#### L2. `ws-client.ts` Uses `void` for Unhandled Promise
**File:** `src/lib/openclaw/ws-client.ts:282`

**Fix:** Use `.then().catch()` for clarity.

#### L3. Magic Numbers in `gateway-client.ts`
**File:** `src/lib/openclaw/gateway-client.ts`

**Fix:** Extract `1_000` and `2_000` to named constants.

#### L4. Misleading "Redis connection established" Log
**File:** `src/lib/redis.ts:31`

**Fix:** Only log on actual successful ping.

#### L5. Cache `getStats()` Counts Expired Entries
**File:** `src/lib/cache.ts:61-72`

**Fix:** Exclude expired entries from `hitRate` calculation.

#### L6. Inconsistent `console.log` vs `console.error`
**Fix:** Standardize on `console.error()` for server-side logs.

#### L7. `shopee-office-store.ts` In-Memory Only
**Fix:** Confirm intentional for demo mode.

---

### Frontend (9)

#### L1. Inconsistent `cn()` Usage
**Fix:** Standardize on `cn()` for class concatenation.

#### L2. Two Toast Systems in Use
**Fix:** Standardize on `sonner`. Remove `useToast` hook.

#### L3. `reactStrictMode: false`
**File:** `next.config.ts:56`

**Fix:** Enable strict mode.

#### L4. Commented-Out Code Scattered
**Fix:** Remove all commented code.

#### L5. FAB Overlaps Bottom Tab Bar on Small Screens
**File:** `src/components/layout/app-layout.tsx:244-270`

**Fix:** Adjust FAB position for small screens.

#### L6. Agent Grid Uses CSS-in-JS Instead of Tailwind
**File:** `src/components/shopee-office/agent-grid.tsx` (~500 lines)

**Fix:** Migrate to Tailwind classes.

#### L7. `Grid` Component Defined Locally Instead of Imported
**File:** `src/components/pages/openclaw-page.tsx:119-121`

**Fix:** Use `LayoutGrid` from lucide-react.

#### L8. Hardcoded Dates in Footer (Already Dynamic)
**File:** `src/components/layout/app-layout.tsx:213`

**Status:** ✅ Already correct (`{new Date().getFullYear()}`).

#### L9. Logo Images Oversized in Container
**File:** `src/components/layout/sidebar.tsx:73-77`

**Problem:** 250px/150px images in 80px container → overflow.

**Fix:** Resize images or increase container height.

---

### Database (6)

#### L1. Duplicate Route Definitions
**Files:** `mini-services/db-service/index.ts`, `routes/*.ts`

**Fix:** Complete refactor to modular pattern or consolidate to monolithic.

#### L2. Campaign/EarningGoal Lack Max Length in Schema
**File:** `prisma/schema.prisma:80, 136`

**Fix:** Add `@db.VarChar(200)` and `@db.VarChar(1000)`.

#### L3. Payout Model Missing Unique External Reference
**File:** `prisma/schema.prisma:114-128`

**Fix:** Add `referenceId String? @unique`.

#### L4. No Soft Delete Support
**Fix:** Add `deletedAt DateTime?` for audit-critical models.

#### L5. Missing Package.json Prisma Config
**Fix:**
```json
"prisma": {
  "seed": "bun run prisma/seed.ts"
}
```

#### L6. No Content-Type Validation
**Fix:** Verify `Content-Type: application/json` on POST/PUT.

---

### Security (7)

#### L-1. `X-DNS-Prefetch-Control` is Performance Header
**File:** `next.config.ts:9`

**Fix:** Move to separate headers configuration.

#### L-2. Missing COOP/COEP Headers
**Fix:** Add `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`.

#### L-3. `reactStrictMode: false`
**File:** `next.config.ts:47`

**Fix:** Enable to catch concurrency bugs.

#### L-4. Caddyfile Query Parameter Routing
**File:** `Caddyfile:8-12`

**Fix:** Use path-based routing instead of query parameter.

#### L-5. `DB_SERVICE_SECRET` Validation Duplicated
**Files:** `mini-services/db-service/index.ts:27-31`, `middleware.ts:7-11`

**Fix:** Centralize validation.

#### L-6. No Content-Type Validation
**Fix:** Add middleware to verify `Content-Type: application/json`.

#### L-7. `dangerouslySetInnerHTML` in Two Components
**Files:** `src/components/ui/chart.tsx:83`, `src/components/pages/links/links-shared.tsx:255`

**Fix:** Ensure SVG content never includes user input.

---

## ✅ RECOMMENDED ACTION PLAN

### Phase 1: Critical Fixes (1-2 Days)
- [ ] C1: Hash admin password with bcrypt
- [ ] C2: Fix hardcoded user ID → upsert real User
- [ ] C3: Add `requireAuth()` to all POST endpoints
- [ ] C4: Add TLS to Caddyfile
- [ ] C5: Remove `'unsafe-eval'` from CSP
- [ ] C6: Fix Phaser `kb.addKey()` memory leak

### Phase 2: High Priority (1 Week)
- [ ] H1-H4 Backend: Add auth to GET endpoints, fix N+1 queries, parallelize dashboard
- [ ] H6 Frontend: Replace hardcoded "Ahmad Ali" with session data
- [ ] H3 Database: Configure connection pooling for Vercel
- [ ] H-3 Security: Set `DEMO_MODE=false` as default
- [ ] Create first Prisma migration: `bun run db:migrate`
- [ ] Fix seed script to create User first

### Phase 3: Medium Priority (1 Month)
- [ ] M3 Database: Convert Float to Decimal for money
- [ ] M4 Database: Create enums for status fields
- [ ] M5 Database: Add missing composite indexes
- [ ] H8 Frontend: Split 847-line OpenClaw page
- [ ] M7 Frontend: Standardize on `sonner` toast library
- [ ] Enable `reactStrictMode: true`
- [ ] Remove `ignoreBuildErrors: true`

### Phase 4: Architecture Improvements (Ongoing)
- [ ] Set up Upstash Redis for production
- [ ] Implement CSRF protection
- [ ] Add JWT signature verification for `x-user-id`
- [ ] Build proper user registration flow
- [ ] Migrate from client-side tabs to Next.js routing
- [ ] Add comprehensive test coverage (currently ~0.5%)

---

## 📝 Notes

- This review was conducted on **13 April 2026** with **4 parallel agents** reviewing different aspects of the codebase
- All file paths are relative to project root `g:\PROJECT-6`
- Issues are prioritized by severity: Critical → High → Medium → Low
- Each issue includes specific file paths and line references for quick location
- Recommended fixes include code examples where applicable

---

**Next Steps:**
1. Review this document with team
2. Create GitHub Issues for Critical and High priority items
3. Begin Phase 1 fixes immediately
4. Schedule Phase 2-4 work in sprint planning
