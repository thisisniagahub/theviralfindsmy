# Phase 3: API Route Fixes

**Task ID**: phase3-api-fixes
**Agent**: API Fix Agent
**Status**: Completed

## Changes Made

### 1. Updated dbFetch in db-safe.ts to include API key header
- Added `DB_SERVICE_API_KEY` constant using `process.env.DB_SERVICE_API_KEY || 'tvf-internal-api-key-2024'`
- Updated `dbFetch` function to include `x-api-key` header in all requests
- Added proper header merging (preserves caller-provided headers)
- Added `cache: 'no-store'` and `AbortSignal.timeout(15_000)` as defaults
- Enhanced error handling with response body text in error messages

### 2. Added DB_SERVICE_API_KEY to env.ts
- Added `DB_SERVICE_API_KEY: z.string().min(1).default('tvf-internal-api-key-2024')` to the Microservices section
- Validated at startup with Zod, defaults to internal key if not set

### 3. Migrated ALL 19 API routes from raw fetch to dbFetch
Each route was migrated with:
- Removed `const DB_URL = process.env.DB_SERVICE_URL`
- Added `import { dbFetch, isDemoMode } from '@/lib/db-safe'`
- Replaced `process.env.DEMO_MODE === 'true'` with `isDemoMode()`
- Replaced `fetch(\`${DB_URL}/path\`, ...)` with `dbFetch('/path', ...)`
- Removed `if (!DB_URL)` guard checks (dbFetch handles this internally)
- Replaced inline `.then(r => r.json())` patterns with dbFetch's built-in JSON parsing

Files migrated:
1. `src/app/api/links/route.ts`
2. `src/app/api/links/[id]/route.ts`
3. `src/app/api/links/[id]/stats/route.ts`
4. `src/app/api/links/[id]/share/route.ts`
5. `src/app/api/links/bulk/route.ts`
6. `src/app/api/dashboard/route.ts`
7. `src/app/api/campaigns/route.ts`
8. `src/app/api/campaigns/[id]/route.ts`
9. `src/app/api/conversions/route.ts`
10. `src/app/api/payouts/route.ts`
11. `src/app/api/notifications/route.ts`
12. `src/app/api/settings/route.ts`
13. `src/app/api/activity/route.ts`
14. `src/app/api/analytics/route.ts`
15. `src/app/api/click-stats/route.ts`
16. `src/app/api/goals/route.ts`
17. `src/app/api/goals/[id]/route.ts`
18. `src/app/api/goals/[id]/update-progress/route.ts`
19. `src/app/api/redirect/[shortCode]/route.ts`

Note: `agents/route.ts`, `agents/activity/route.ts`, and `agents/memory/route.ts` do NOT use DB_URL (in-memory or @/lib/agent-memory), so they were not migrated.

### 4. Added Zod validation to 3 PUT routes that were missing it

- **`campaigns/[id]/route.ts` PUT**: Added `updateCampaignSchema = createCampaignSchema.partial()`, validates body with `safeParse`, uses `validated.data` instead of raw body
- **`links/[id]/route.ts` PUT**: Added `updateLinkSchema` validation with `safeParse`, uses `validated.data` instead of raw body
- **`goals/[id]/route.ts` PUT**: Added `updateGoalSchema = createGoalSchema.partial()`, validates body with `safeParse`, uses `validated.data` instead of raw body

### 5. Minor fix
- Removed unused `NextRequest` import from `click-stats/route.ts` (was causing lint warning)

## Verification
- ESLint: 0 errors, 25 warnings (all pre-existing, reduced from 26 by fixing unused import)
- All `DB_URL` / `DB_SERVICE_URL` references removed from `src/app/api/`
- All `process.env.DEMO_MODE` references in API routes replaced with `isDemoMode()`
