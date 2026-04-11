# Implementation Plan — Remaining Tasks (Phase 13-16)

> **Status**: Planning Document  
> **Created**: April 2026  
> **Version**: 9.0  
> **Last Completed**: Phase 11-12 (Camera Drag-to-Pan, Env Validation, Rate Limiting, API Caching, Keyboard Shortcuts, Page Transitions)

---

## Current State Summary

### ✅ Completed (All Sprints)
| Phase | Items | Status |
|-------|-------|--------|
| Sprint 0 (0A-0E) | OpenClaw Gateway Hardening, VPS Health, Real NiagaBot Chat, MCP Proxy, A2A Pipeline | ✅ Done |
| Phase 11 | Env Validation, Rate Limiting, Input Focus Guard (existing), ESLint Cleanup | ✅ Done |
| Phase 12 | Camera Drag-to-Pan, API Caching, Keyboard Shortcuts Panel, Page Transitions | ✅ Done |
| FR-19 to FR-25 | Isometric Office, State Machine, Activity Monitor, Minimap, Themes, Performance | ✅ Already existed |

### 📊 Project Stats
- **Build**: 58 pages, 0 errors
- **API Routes**: 60+
- **Components**: 50+
- **ESLint**: 8 errors (pre-existing Phaser `require()`), ~50 warnings (pre-existing)

---

## Task Breakdown — What's Left

### PRIORITY 1: TypeScript Strict Mode (Phase 13 — IMP-04)

**Why**: Currently `noImplicitAny: false` means 50+ hidden type errors. Strict mode catches bugs at compile time.

**Current tsconfig.json**:
```json
{
  "strict": true,
  "noImplicitAny": false  // ← This overrides strict mode
}
```

**Implementation Steps**:

| Step | Action | Files Affected | Estimated Time |
|------|--------|---------------|----------------|
| 1 | Enable `noImplicitAny: true` | `tsconfig.json` | 5min |
| 2 | Run `bun run build` to surface errors | — | 1min |
| 3 | Fix Phaser `require()` imports — convert to dynamic `import()` | `phaser-game.tsx` (8 errors) | 2h |
| 4 | Fix `any` types — replace with proper interfaces | `a2a-proxy/route.ts`, `Worker.ts`, `SceneEventBridge.ts`, `phaser-game.tsx` (~15 locations) | 3h |
| 5 | Fix unused vars/imports from test files | `__tests__/` files | 1h |
| 6 | Fix implicit return types on functions | Various route handlers | 2h |
| 7 | Run `bun run lint` — target < 20 warnings | All files | 1h |
| 8 | Final build verification | — | 1min |

**Total Estimated Time**: 9-10 hours

**Risks**:
- Phaser's API uses `any` extensively — may need `// @ts-expect-error` in game-specific code
- Some route handlers use `Record<string, unknown>` which needs tightening

**Acceptance Criteria**:
- [ ] `noImplicitAny: true` in tsconfig.json
- [ ] `bun run build` passes with 0 TypeScript errors
- [ ] ESLint warnings < 20
- [ ] All `any` types replaced with proper interfaces (except Phaser game internals)

---

### PRIORITY 2: OAuth Providers (Phase 13 — IMP-05)

**Why**: Reduce login friction. Malaysian users prefer Google login over email/password.

**Prerequisites Needed From User**:
- [ ] Google OAuth Client ID (from Google Cloud Console)
- [ ] Google OAuth Client Secret
- [ ] Facebook App ID (from Meta Developers) — optional
- [ ] Facebook App Secret — optional

**Implementation Steps**:

| Step | Action | Files Affected | Estimated Time |
|------|--------|---------------|----------------|
| 1 | Install `@auth/core` for NextAuth v4 provider support | `package.json` | 5min |
| 2 | Add `GoogleProvider` to `[...nextauth]/route.ts` | `src/app/api/auth/[...nextauth]/route.ts` | 30min |
| 3 | Add `FacebookProvider` (optional) | Same file | 30min |
| 4 | Update `User` Prisma model — add `googleId`, `facebookId`, `image` fields | `prisma/schema.prisma` | 15min |
| 5 | Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` to `.env.example` | `.env.example` | 5min |
| 6 | Add `image` field to NextAuth session callback | Auth route | 30min |
| 7 | Update login page — add "Sign in with Google" button | `src/app/login/page.tsx` | 1h |
| 8 | Add `skipLogin` env option for local dev without auth | `src/lib/config.ts` | 15min |
| 9 | Test: Login flow, session persistence, user creation in DB | — | 1h |

**Total Estimated Time**: 3-4 hours

**Risks**:
- Google requires HTTPS callback URL (won't work on localhost without ngrok)
- Need to verify OAuth works on VPS with custom domain

**Acceptance Criteria**:
- [ ] Google login button on login page
- [ ] Successful OAuth flow → user created in DB
- [ ] Session persists with OAuth user
- [ ] Fallback to email/password still works

---

### PRIORITY 3: Affiliate Profile System (Phase 13 — IMP-33)

**Why**: Let affiliates share a public profile with their stats and promoted products.

**Implementation Steps**:

| Step | Action | Files Affected | Estimated Time |
|------|--------|---------------|----------------|
| 1 | Add `Profile` Prisma model: bio, avatar, socialLinks, publicProfileSlug | `prisma/schema.prisma` | 30min |
| 2 | Run `bun run db:push` to migrate | — | 5min |
| 3 | Create `/profile/[slug]/page.tsx` — public profile page | New page | 2h |
| 4 | Create profile settings page under Settings tab | `src/components/pages/settings/` | 1h |
| 5 | Create API routes: GET/PUT `/api/profile` | `src/app/api/profile/` | 1h |
| 6 | Profile components: AvatarUpload, BioEditor, SocialLinks, StatsDisplay | `src/components/profile/` | 2h |
| 7 | Add "Share Profile" button to dashboard | `src/components/pages/dashboard/` | 30min |
| 8 | SEO: Add OpenGraph meta tags for profile sharing | `[slug]/page.tsx` | 30min |

**Total Estimated Time**: 7-8 hours

**Acceptance Criteria**:
- [ ] Public profile page renders at `/profile/[slug]`
- [ ] Profile shows: name, bio, avatar, top products, stats (clicks, conversions, earnings)
- [ ] Users can edit profile from Settings
- [ ] Shareable link with proper OG meta tags

---

### PRIORITY 4: Scheduled Reports (Phase 13 — IMP-32)

**Why**: Auto-generate weekly/monthly PDF reports for affiliates to review performance.

**Implementation Steps**:

| Step | Action | Files Affected | Estimated Time |
|------|--------|---------------|----------------|
| 1 | Install PDF library: `@react-pdf/renderer` | `package.json` | 10min |
| 2 | Create PDF report component with charts, stats, tables | `src/components/reports/` | 3h |
| 3 | Create API route `POST /api/reports/generate` | `src/app/api/reports/` | 1h |
| 4 | Add report scheduling to Prisma: `ScheduledReport` model | `prisma/schema.prisma` | 30min |
| 5 | Create schedule management UI in Settings | `src/components/pages/settings/` | 1h |
| 6 | Implement cron-like scheduling using `setInterval` or server action | `src/lib/scheduler.ts` | 2h |
| 7 | Add email delivery (via Telegram bot or email API) | `src/lib/notifications.ts` | 1h |
| 8 | Test: Generate report, verify PDF content, check scheduling | — | 1h |

**Total Estimated Time**: 9-10 hours

**Acceptance Criteria**:
- [ ] PDF report generates with: earnings chart, top links, conversion summary, goals progress
- [ ] Users can schedule weekly/monthly reports
- [ ] Reports are downloadable from dashboard
- [ ] Optional: Reports sent via Telegram/email

---

### PRIORITY 5: Dashboard Widget Customization (Phase 13 — IMP-23)

**Why**: Users want to choose which widgets appear on their dashboard.

**Implementation Steps**:

| Step | Action | Files Affected | Estimated Time |
|------|--------|---------------|----------------|
| 1 | Install `@dnd-kit/core`, `@dnd-kit/sortable` (already installed) | `package.json` | 0min |
| 2 | Create `WidgetConfig` Prisma model: userId, widgetId, position, enabled | `prisma/schema.prisma` | 30min |
| 3 | Create widget registry: define all available widgets with IDs | `src/lib/widget-registry.ts` | 1h |
| 4 | Refactor dashboard to use widget system instead of hardcoded layout | `dashboard-page.tsx` | 3h |
| 5 | Create "Customize Dashboard" modal with drag-and-drop reorder | `src/components/dashboard/` | 3h |
| 6 | Persist widget config to DB, load on page mount | `src/store/dashboard-store.ts` | 1h |
| 7 | Add "Customize" button to dashboard header | `header.tsx` | 15min |
| 8 | Test: Drag, reorder, toggle widgets, verify persistence | — | 1h |

**Total Estimated Time**: 9-10 hours

**Acceptance Criteria**:
- [ ] Dashboard loads widgets based on user config
- [ ] "Customize" button opens drag-and-drop panel
- [ ] Users can reorder, enable/disable widgets
- [ ] Config persists across sessions

---

### PRIORITY 6: PWA Support (Phase 14 — IMP-24)

**Why**: Make the app installable on mobile with offline support and push notifications.

**Note**: PWA icons and manifest already partially set up (see `metadata` in layout.tsx and `ServiceWorkerProvider`).

**Implementation Steps**:

| Step | Action | Files Affected | Estimated Time |
|------|--------|---------------|----------------|
| 1 | Install `next-pwa` | `package.json` | 5min |
| 2 | Configure `next.config.ts` with PWA plugin | `next.config.ts` | 30min |
| 3 | Create `public/manifest.json` with full PWA metadata | `public/manifest.json` | 30min |
| 4 | Create `public/sw.js` (service worker) with caching strategy | `public/sw.js` | 2h |
| 5 | Create install prompt component | `src/components/pwa-install-prompt.tsx` | 1h |
| 6 | Add offline page: `public/offline.html` | New file | 1h |
| 7 | Add runtime caching for API responses in service worker | `sw.js` | 1h |
| 8 | Test: Install on Android/iOS, offline mode, caching | — | 2h |

**Total Estimated Time**: 7-8 hours

**Acceptance Criteria**:
- [ ] "Add to Home Screen" prompt appears on mobile
- [ ] App works offline (cached dashboard data)
- [ ] Install banner shows on first visit
- [ ] Lighthouse PWA score > 90

---

### PRIORITY 7: Multi-Merchant Support (Phase 14 — IMP-27)

**Why**: Expand beyond Shopee to include Lazada, TikTok Shop, Amazon.

**This is the BIGGEST feature.** Requires architectural changes.

**Implementation Steps**:

| Step | Action | Files Affected | Estimated Time |
|------|--------|---------------|----------------|
| 1 | Add `merchant` field to Prisma models (AffiliateLink, Campaign, Conversion) | `prisma/schema.prisma` | 1h |
| 2 | Create `Merchant` enum: SHOPEE, LAZADA, TIKTOK_SHOP, AMAZON | `prisma/schema.prisma` | 15min |
| 3 | Run migration | — | 15min |
| 4 | Add merchant selector dropdown in header | `src/components/layout/header.tsx` | 30min |
| 5 | Create merchant switcher component with logo icons | `src/components/merchant-switcher.tsx` | 1h |
| 6 | Update all API routes to filter by merchant | All API routes | 3h |
| 7 | Update dashboard to show merchant-specific stats | `dashboard-page.tsx` | 2h |
| 8 | Add merchant-specific color themes | `globals.css` | 1h |
| 9 | Create API integration scaffolding for Lazada | `src/lib/lazada-api.ts` | 2h |
| 10 | Create API integration scaffolding for TikTok Shop | `src/lib/tiktok-api.ts` | 2h |
| 11 | Test: Switch merchants, verify data isolation | — | 2h |

**Total Estimated Time**: 15-16 hours

**Acceptance Criteria**:
- [ ] Merchant selector in header (Shopee default, Lazada, TikTok Shop)
- [ ] All data filtered by selected merchant
- [ ] Dashboard shows merchant-specific stats
- [ ] API scaffolding ready for Lazada/TikTok integration

---

### PRIORITY 8: Predictive Earnings (Phase 15 — IMP-30)

**Why**: Help users forecast future earnings based on historical trends.

**Implementation Steps**:

| Step | Action | Files Affected | Estimated Time |
|------|--------|---------------|----------------|
| 1 | Create earnings forecasting algorithm (linear regression + moving average) | `src/lib/forecast.ts` | 3h |
| 2 | Create API route `GET /api/forecast/earnings` | `src/app/api/forecast/` | 30min |
| 3 | Create forecast chart component (extends existing earnings chart) | `src/components/dashboard/forecast-chart.tsx` | 2h |
| 4 | Add "Next 30 Days Forecast" widget to dashboard | `dashboard-page.tsx` | 1h |
| 5 | Add confidence intervals (best case / worst case) | `forecast.ts` | 1h |
| 6 | Add "Optimal Commission Rate" suggestion | `forecast.ts` | 1h |
| 7 | Test: Verify forecast accuracy against historical data | — | 1h |

**Total Estimated Time**: 9-10 hours

**Acceptance Criteria**:
- [ ] Forecast chart shows projected earnings for next 7/30/90 days
- [ ] Confidence intervals displayed (optimistic, expected, pessimistic)
- [ ] Commission rate suggestion based on historical performance
- [ ] Widget on dashboard

---

### PRIORITY 9: Image-Based Product Analysis (Phase 15 — IMP-35)

**Why**: Let users upload product screenshots for automatic analysis.

**Note**: `/api/openclaw/analyze-image` route already exists. The image-analyzer component needs to be built.

**Implementation Steps**:

| Step | Action | Files Affected | Estimated Time |
|------|--------|---------------|----------------|
| 1 | Create image upload component with drag-and-drop | `src/components/shopee-office/image-analyzer.tsx` | 2h |
| 2 | Integrate with existing `/api/openclaw/analyze-image` route | — | 30min |
| 3 | Display analysis results: product name, competition level, pricing | `image-analyzer.tsx` | 1h |
| 4 | Add "Create Affiliate Link from Analysis" button | `image-analyzer.tsx` | 30min |
| 5 | Add image analyzer to Agent Office as a new panel | `agent-office-page.tsx` | 1h |
| 6 | Test: Upload image, verify analysis, create link | — | 1h |

**Total Estimated Time**: 5-6 hours

**Acceptance Criteria**:
- [ ] Drag-and-drop image upload zone
- [ ] NiagaBot analyzes image and returns structured data
- [ ] Results display: product info, competition, pricing suggestion
- [ ] One-click affiliate link creation from analysis

---

### PRIORITY 10: Subscription Tiers UI (Phase 16 — IMP-38)

**Why**: Monetize the platform with Free/Pro/Enterprise tiers.

**Implementation Steps**:

| Step | Action | Files Affected | Estimated Time |
|------|--------|---------------|----------------|
| 1 | Add `SubscriptionTier` enum and `subscriptionTier` field to User | `prisma/schema.prisma` | 30min |
| 2 | Run migration | — | 5min |
| 3 | Create tier definitions: Free, Pro, Enterprise | `src/lib/tiers.ts` | 30min |
| 4 | Create pricing page: `/pricing/page.tsx` | New page | 2h |
| 5 | Create pricing comparison component (3-tier table) | `src/components/pricing/` | 2h |
| 6 | Add feature gates based on tier | `src/lib/feature-gates.ts` | 1h |
| 7 | Update Settings to show current tier and upgrade button | `src/components/pages/settings/` | 1h |
| 8 | Add "Upgrade" modal with plan selection | `src/components/pricing/upgrade-modal.tsx` | 1h |
| 9 | (Future) Integrate Stripe for billing — placeholder for now | — | 0min (future phase) |
| 10 | Test: Feature gates work correctly per tier | — | 1h |

**Total Estimated Time**: 8-9 hours

**Acceptance Criteria**:
- [ ] `/pricing` page shows 3 tiers with feature comparison
- [ ] Feature gates restrict AI tools, advanced analytics for Free tier
- [ ] Upgrade button in Settings
- [ ] Tier displayed in user profile

---

## Dependencies & Order

```
Phase 13 (Must Do First):
  ├── TypeScript Strict Mode  ← Foundation, unlocks everything
  ├── OAuth Providers         ← Can be done independently
  └── Affiliate Profile       ← Independent

Phase 13-14 (Can Do in Parallel):
  ├── Scheduled Reports       ← Independent
  ├── Dashboard Customization ← Independent
  └── PWA Support             ← Independent

Phase 14-15 (Depends on Phase 13):
  ├── Multi-Merchant          ← Big architectural change
  └── Predictive Earnings     ← Independent

Phase 15-16 (Final):
  ├── Image Analysis          ← Builds on existing API
  └── Subscription Tiers      ← Foundation for monetization
```

## Recommended Execution Order

| Sprint | Tasks | Total Time |
|--------|-------|------------|
| **Sprint 1** | TypeScript Strict Mode + ESLint Cleanup | 10h |
| **Sprint 2** | OAuth Providers + Affiliate Profile | 11h |
| **Sprint 3** | PWA Support + Scheduled Reports | 17h |
| **Sprint 4** | Dashboard Customization + Image Analysis | 15h |
| **Sprint 5** | Multi-Merchant Support | 16h |
| **Sprint 6** | Predictive Earnings + Subscription Tiers | 18h |

**Total Remaining Work**: ~87 hours across 6 sprints

---

## Quick Wins Still Available (< 1 hour each)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Path Simplification (A* smoothing) | 30min | Smoother NPC movement |
| 2 | Diagonal Speed Normalization | 5min | Fix 41% faster diagonal movement |
| 3 | DOM Overlay Chat Bubbles | 1-2h | Better text rendering in game |
| 4 | Animated Environment Objects | 1-2h | Doors, coffee machine, server blink |
| 5 | Emote Spritesheets | 2-3h | Replace emoji with animated sprites |
| 6 | Keyboard Shortcuts Panel | ✅ Done | — |
| 7 | Page Transitions | ✅ Done | — |

---

## Files That Will Be Created/Modified (Summary)

### New Files (~30 files)
```
src/lib/forecast.ts
src/lib/tiers.ts
src/lib/feature-gates.ts
src/lib/scheduler.ts
src/lib/lazada-api.ts
src/lib/tiktok-api.ts
src/components/reports/report-pdf.tsx
src/components/reports/report-generator.tsx
src/components/dashboard/forecast-chart.tsx
src/components/dashboard/widget-customizer.tsx
src/components/dashboard/widget-registry.tsx
src/components/profile/profile-page.tsx
src/components/profile/avatar-upload.tsx
src/components/profile/bio-editor.tsx
src/components/profile/stats-display.tsx
src/components/pricing/pricing-page.tsx
src/components/pricing/tier-comparison.tsx
src/components/pricing/upgrade-modal.tsx
src/components/pwa/pwa-install-prompt.tsx
src/components/merchant-switcher.tsx
src/components/shopee-office/image-analyzer.tsx
src/app/profile/[slug]/page.tsx
src/app/pricing/page.tsx
src/app/api/profile/route.ts
src/app/api/profile/[slug]/route.ts
src/app/api/reports/generate/route.ts
src/app/api/forecast/earnings/route.ts
public/manifest.json
public/sw.js
public/offline.html
```

### Modified Files (~20 files)
```
tsconfig.json
prisma/schema.prisma
src/app/api/auth/[...nextauth]/route.ts
src/app/login/page.tsx
src/components/pages/dashboard/dashboard-page.tsx
src/components/pages/settings/settings-page.tsx
src/components/layout/header.tsx
src/app/(dashboard)/layout.tsx
src/app/layout.tsx
src/lib/config.ts
... and more
```
