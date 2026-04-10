# PRD — Product Requirements Document

## TheViralFinds: Shopee Affiliate Management System

**Version:** 6.0
**Last Updated:** July 2025
**Status:** VPS Migration Phase (SQLite → PostgreSQL, MCP & A2A Overhaul)
**Author:** TheViralFinds Team
**Repository:** [github.com/thisisniagahub/theviralfindsmy](https://github.com/thisisniagahub/theviralfindsmy)
**VPS:** 76.13.176.142 | **OpenClaw Gateway:** https://operator.gangniaga.my

---

## 1. Executive Summary

**TheViralFinds** is a comprehensive Shopee Affiliate Management System designed to empower Malaysian content creators, social media influencers, and affiliate marketers with a single, powerful dashboard to manage their entire affiliate business. The platform combines real-time analytics, AI-powered intelligence tools, gamification, and seamless link management into one unified experience.

### Key Value Proposition
- **All-in-one platform** — Eliminates the need for multiple tools (analytics, link shorteners, content schedulers, competitor research)
- **AI-powered insights** — Trending product discovery, keyword research, and competitor analysis powered by real AI models
- **Real-time intelligence** — WebSocket push notifications, live conversion tracking, and interactive analytics
- **Gamification** — Leaderboards, achievements, and performance scoring to motivate and engage affiliates
- **Mobile-first design** — Full functionality on any device with responsive layouts and iOS safe area support
- **Pixel RPG Office** — Interactive Phaser 3 game scene with AI agents working in a virtual office

### Current State (v5.0 → v6.0 VPS Migration In Progress)
- **16 pages** including Agent Office with Phaser game
- **40+ API routes** with Zod validation
- **8 Prisma models** (AffiliateLink, Campaign, ClickRecord, Conversion, Payout, AppSetting, EarningGoal, Notification)
- **3 mini-services** (notification-service, MCP server, A2A agent) — ⚠️ MCP & A2A being overhauled to VPS OpenClaw
- **NextAuth.js authentication** with credentials provider
- **Error boundaries** and production hardening applied
- **Comprehensive CSS utility library** (2,000+ lines)
- **🔴 CRITICAL MIGRATION IN PROGRESS**: SQLite → PostgreSQL on VPS 76.13.176.142
- **🔴 MCP Proxy overhaul**: localhost:3005 → OpenClaw Gateway at operator.gangniaga.my
- **🔴 A2A Agent Network overhaul**: localhost:3006 → Real chained agent pipeline via OpenClaw

---

## 2. Target Audience

### Primary Users
| Segment | Description | Pain Points |
|---------|-------------|-------------|
| **Shopee Affiliates** | Malaysian content creators earning commissions via Shopee affiliate links | Scattered tools, no unified dashboard, manual tracking |
| **Social Media Influencers** | TikTok/Instagram creators promoting Shopee products | No scheduling tools, no trending product discovery |
| **Niche Site Operators** | Bloggers and review site owners | Poor analytics, no SEO/keyword tools, no competitor intel |

### Secondary Users
| Segment | Description |
|---------|-------------|
| **Affiliate Agencies** | Managing multiple affiliate accounts |
| **E-commerce Merchants** | Understanding affiliate performance for their products |

### User Personas

#### Persona 1: Ahmad (Full-time Affiliate)
- 28-year-old Malaysian, full-time Shopee affiliate
- Manages 50+ active links across 10 categories
- Needs: Real-time earnings tracking, performance analytics, bulk link management
- Pain: Currently uses 5 different platforms to manage his affiliate business

#### Persona 2: Sarah (Social Media Creator)
- 24-year-old TikTok creator with 100K followers
- Posts 3-5 product recommendations daily
- Needs: Trending product discovery, optimal posting schedule, content ideas
- Pain: Spends hours researching trending products manually

#### Persona 3: Raj (Agency Manager)
- 35-year-old, manages affiliate programs for 20+ clients
- Needs: Multi-account dashboard, competitor intelligence, automated reporting
- Pain: No unified view of all affiliate performance

---

## 3. Product Overview

### 3.1 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (SPA)                        │
│  Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui    │
│  16 Pages | 44+ UI Components | Framer Motion           │
│  Phaser 3 Game Engine | Agent Grid | Agent Profile      │
├─────────────────────────────────────────────────────────┤
│                    API Layer (40+ Routes)                │
│  REST API | Next.js App Router | Zod Validation         │
│  NextAuth.js Authentication | Auth Middleware            │
├──────────┬──────────────────────────────────────────────┤
│ PostgreSQL│ OpenClaw Gateway (VPS 76.13.176.142)        │
│ (Prisma) │ https://operator.gangniaga.my               │
│ 8 Models │ ├─ MCP Proxy → /health, /tools, /execute    │
│          │ ├─ A2A Pipeline → Chained Agent Calls        │
│          │ │   ├─ niagaresearch (Kaji Pasaran)          │
│          │ │   ├─ niagamarketing (Ayat Pemasaran)       │
│          │ │   └─ niagacomputer (Format JSON)           │
│          │ └─ AI SDK (z-ai-web-dev-sdk)                 │
├──────────┴──────────────────────────────────────────────┤
│                 Real-time Layer                         │
│  Socket.IO (Port 3004) | WebSocket Notifications       │
└─────────────────────────────────────────────────────────┘
```

#### Architecture Migration (v5.0 → v6.0)

| Component | v5.0 (Local) | v6.0 (VPS) |
|-----------|-------------|------------|
| Database | SQLite (`file:./db/custom.db`) | PostgreSQL (`76.13.176.142:5432/theviralfinds`) |
| MCP Server | `localhost:3005` (mock capabilities) | OpenClaw Gateway (`operator.gangniaga.my/health`) |
| A2A Network | `localhost:3006` (sleep timer dummy) | OpenClaw Chained Pipeline (niagaresearch → niagamarketing → niagacomputer) |
| AI Processing | z-ai-web-dev-sdk + local mock | z-ai-web-dev-sdk + OpenClaw real agents |
| Notification Service | `localhost:3004` | `localhost:3004` (unchanged) |

### 3.2 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 16 (App Router) | Server components, streaming, edge runtime |
| UI | shadcn/ui + Tailwind CSS 4 | Consistent design system, dark mode, accessibility |
| State | Zustand + TanStack Query | Lightweight client state + powerful server state caching |
| Database | PostgreSQL + Prisma ORM | Production-grade, concurrent connections, 100K+ records, VPS-hosted |
| Charts | Recharts | Composable, responsive chart components |
| Animations | Framer Motion | Declarative animations, layout transitions |
| Real-time | Socket.IO | WebSocket with fallback, auto-reconnect |
| AI | z-ai-web-dev-sdk | Web search, LLM chat, web reader, image generation |
| AI Gateway | OpenClaw (operator.gangniaga.my) | MCP tool execution, A2A agent pipeline, real AI capabilities |
| AI Agents | OpenClaw Agent System | niagaresearch, niagamarketing, niagacomputer, niagaaggregator, niagareporter |
| Forms | React Hook Form + Zod | Performant forms with type-safe validation |
| Auth | NextAuth.js v4 | Credentials provider, JWT sessions, middleware |
| Game Engine | Phaser 3 | 2D game rendering, physics, sprite management |

---

## 4. Feature Requirements

### 4.1 Core Features (Must-Have)

#### FR-01: Dashboard
**Priority:** P0 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-01.1 | Overview Stats | Total earnings, clicks, conversions, active links with animated count-up |
| FR-01.2 | Earnings Chart | Area chart showing monthly/weekly earnings with gradient fill |
| FR-01.3 | Clicks Chart | Bar chart with gradient fill showing daily click volume |
| FR-01.4 | Top Links Table | Top 5 performing links with product info, clicks, earnings |
| FR-01.5 | Recent Conversions | Latest 5 conversions with order details and commission |
| FR-01.6 | Performance Score | Circular progress ring (0-100) with grade (A-F) and breakdown |
| FR-01.7 | Earnings Goals Widget | Active goals with animated progress bars and days remaining |
| FR-01.8 | Top Products Widget | Top 5 products by earnings with category badges |
| FR-01.9 | Quick Actions | Create Link, View Campaigns, Generate Report, Request Payout |
| FR-01.10 | Date Range Selector | 7d, 30d, 90d, month, all-time period filters |
| FR-01.11 | CSV/PDF Export | Download dashboard data as CSV or print-optimized PDF |
| FR-01.12 | Sparkline Trends | Inline sparkline charts in stat cards showing 4-period trends |
| FR-01.13 | Welcome Banner | Personalized greeting with date, monthly earnings, and Today's Goal mini-progress |
| FR-01.14 | Activity Feed | Collapsible timeline with colored borders and real-time updates |

#### FR-02: Affiliate Link Management
**Priority:** P0 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-02.1 | Create Link | Generate affiliate link from product URL with name, category, campaign |
| FR-02.2 | Edit Link | Update link details, status, campaign assignment |
| FR-02.3 | Delete Link | Remove link with confirmation dialog |
| FR-02.4 | List Links | Paginated table with search, category filter, status filter |
| FR-02.5 | Link Detail Modal | Full link info with stats grid, sparkline chart, quick actions |
| FR-02.6 | QR Code Generation | Generate QR code as SVG for any link |
| FR-02.7 | Bulk Actions | Select multiple links → activate, pause, or delete |
| FR-02.8 | Social Sharing | Share via WhatsApp, Telegram, Facebook with pre-formatted message |
| FR-02.9 | Trend Sparklines | 7-day click trend per link row (green/red/orange color coding) |
| FR-02.10 | Status Badges | Visual status indicators: active (green), paused (yellow), expired (red) |
| FR-02.11 | Click Tracking | Redirect route that logs clicks before forwarding |
| FR-02.12 | Link Comparison | Side-by-side performance comparison of any two links |
| FR-02.13 | Link Expiry System | Auto-expire links after configurable time periods with visual indicators |
| FR-02.14 | Secure Redirect | URL whitelist (6 Shopee domains), status/expiry checks before redirect |

#### FR-03: Product Search & Import
**Priority:** P0 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-03.1 | Product Search | Search Shopee products with keyword and category filters |
| FR-03.2 | Product Cards | Display with image, name, price, rating, discount percentage |
| FR-03.3 | Generate Affiliate Link | One-click affiliate link creation from product card |
| FR-03.4 | Shopee Integration | Dedicated page for API connection status and product import |

#### FR-04: Analytics
**Priority:** P0 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-04.1 | Performance Overview | Clicks, conversions, revenue charts over time |
| FR-04.2 | Top Products | Revenue-ranked product performance table |
| FR-04.3 | Conversion Funnel | Click → View → Add to Cart → Purchase visualization |
| FR-04.4 | Device Breakdown | Desktop, mobile, tablet distribution chart |
| FR-04.5 | Source Breakdown | Referer source analysis (social, direct, search, etc.) |
| FR-04.6 | Category Breakdown | Earnings by product category |
| FR-04.7 | Click Heatmap | 7×24 grid (day × hour) showing click intensity |
| FR-04.8 | Link Comparison | Compare two links side-by-side with ratio analysis |

#### FR-05: Campaign Management
**Priority:** P1 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-05.1 | Create Campaign | Name, description, budget, date range |
| FR-05.2 | Campaign Cards | Visual cards with status, budget progress, ROI |
| FR-05.3 | Status Tabs | All, Active, Paused, Completed filters |
| FR-05.4 | Edit/Delete | Update campaign details or remove |
| FR-05.5 | Budget Tracking | Visual progress bar showing spent vs budget |
| FR-05.6 | ROI Display | Calculated return on investment per campaign |

#### FR-06: Commission Calculator
**Priority:** P1 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-06.1 | Basic Calculator | Input: price, commission rate, clicks, conversion rate → output: earnings |
| FR-06.2 | Tiered Breakdown | Earnings at 500, 1K, 2.5K, 5K, 10K click volumes |
| FR-06.3 | Scenario Comparison | Two configurable scenarios side-by-side |
| FR-06.4 | Motivational Messages | Context-aware messages based on earnings level |

#### FR-07: Earnings & Payouts
**Priority:** P0 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-07.1 | Earnings Summary | Total earned, pending, withdrawn, available balance |
| FR-07.2 | Monthly Chart | Area chart showing monthly earnings trend |
| FR-07.3 | Earnings Breakdown | By category, by source, by status |
| FR-07.4 | Payout History | Table with method, amount, status, dates |
| FR-07.5 | Request Payout | Dialog with method selection (bank transfer, e-wallet) |
| FR-07.6 | Earning Goals | CRUD goal management with progress rings |

#### FR-08: Settings
**Priority:** P1 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-08.1 | API Configuration | Shopee API key input with encrypted storage |
| FR-08.2 | Profile Settings | Display name, email, username |
| FR-08.3 | Commission Settings | Default rate, minimum payout threshold |
| FR-08.4 | Notification Settings | Email toggle, webhook URL configuration |
| FR-08.5 | Theme Toggle | Light/dark mode switch |
| FR-08.6 | API Verification | Visual verified badge when API key is valid |

### 4.2 Advanced Features

#### FR-09: Leaderboard
**Priority:** P2 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-09.1 | Top 3 Podium | Special cards with gold/silver/bronze for top 3 |
| FR-09.2 | Full Rankings Table | 15 affiliates with earnings, clicks, conversions, rate |
| FR-09.3 | Period Filter | This Week, This Month, All Time |
| FR-09.4 | Tier System | Diamond, Platinum, Gold, Silver, Bronze tiers |
| FR-09.5 | Your Rank Card | Highlighted card showing current user's rank and tier progress |

#### FR-10: Achievements
**Priority:** P2 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-10.1 | Achievement Grid | 12 badges in responsive grid |
| FR-10.2 | Progress Ring | Circular ring showing total completion (X/12) |
| FR-10.3 | Category Filter | All, Clicks, Earnings, Links, Social, Streak |
| FR-10.4 | Unlocked State | Full color, glow effect, unlock date |
| FR-10.5 | Locked State | Grayscale, dimmed, progress bar, completion % |
| FR-10.6 | Summary Stats | Total earned, clicks, links created, current streak |

#### FR-11: Notifications
**Priority:** P1 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-11.1 | Real-time Push | WebSocket notifications (conversion, click, payout, milestone) |
| FR-11.2 | Toast Alerts | Sonner toast notifications on each event |
| FR-11.3 | Notification Feed | Full page with colored type borders, filter tabs |
| FR-11.4 | Mark All Read | One-click mark all as read |
| FR-11.5 | Unread Badge | Badge count on sidebar notification icon |
| FR-11.6 | Database Persistence | Notifications stored in Prisma (Notification model) |

#### FR-12: Command Palette
**Priority:** P2 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-12.1 | Global Trigger | `Cmd+K` / `Ctrl+K` from any page |
| FR-12.2 | Page Navigation | Fuzzy search across all 16 pages |
| FR-12.3 | Link Search | Debounced API search for affiliate links |
| FR-12.4 | Quick Actions | Create Link, View Earnings, Open Analytics, Search Products, Export |
| FR-12.5 | Recent Pages | Auto-tracked last 5 visited pages |
| FR-12.6 | Keyboard Navigation | Arrow keys + Enter + Escape |

### 4.3 AI Features (OpenClaw)

#### FR-13: AI-Powered Intelligence
**Priority:** P1 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-13.1 | Trending Scanner | Real-time trending product discovery via Web Search + LLM |
| FR-13.2 | Keyword Research | AI-generated keyword suggestions for affiliate content |
| FR-13.3 | Competitor Analysis | Deep competitor strategy analysis via AI |
| FR-13.4 | Price Tracker | Product price monitoring with AI-powered insights |
| FR-13.5 | Smart Scheduler | Optimal social media posting schedule recommendations |
| FR-13.6 | Web Reader | Extract and analyze content from any URL |
| FR-13.7 | AI Insights | Data-driven analytics insights via LLM |
| FR-13.8 | AI Content | Generate affiliate marketing content |

#### FR-14: MCP Server (Model Context Protocol)
**Priority:** P1 | **Status:** 🔄 Overhauling (localhost → OpenClaw Gateway)

| ID | Requirement | Details |
|----|-------------|---------|
| FR-14.1 | Tool Registry | Real tool capabilities from OpenClaw Gateway (replaces mock 12-tool registry) |
| FR-14.2 | Health Check | GET /status → `https://operator.gangniaga.my/health` for real server health |
| FR-14.3 | Tool Discovery | GET /tools → OpenClaw Gateway internal context for real NiagaBot capabilities |
| FR-14.4 | Tool Execution | POST /execute → Bridge MCP commands to OpenClaw AI engine via `/lib/openclaw.ts` |
| FR-14.5 | Translation Bridge | MCP commands (e.g., "Kaji URL INI") wrapped as OpenClaw-specific payload |
| FR-14.6 | Status Monitoring | Real-time health from VPS; uptime, memory, tool execution tracking |

#### FR-15: A2A Agent Network
**Priority:** P1 | **Status:** 🔄 Overhauling (localhost → OpenClaw Chained Pipeline)

| ID | Requirement | Details |
|----|-------------|---------|
| FR-15.1 | Agent Registry | Real OpenClaw agents: niagaresearch, niagamarketing, niagacomputer, niagaaggregator, niagareporter |
| FR-15.2 | Chained Pipeline | Sequential: niagaresearch → niagamarketing → niagacomputer (output injected as next input) |
| FR-15.3 | Pipeline Execution | All chained calls via `https://operator.gangniaga.my/v1/chat/completions` |
| FR-15.4 | Real-time Logging | Live agent conversation visible in UI (replaces sleep timer dummy) |
| FR-15.5 | Context Injection | Previous agent output injected as message context for next agent |
| FR-15.6 | Agent Format | `openclaw/<agentId>` model structure for all VPS agents |
| FR-15.7 | Error Recovery | Graceful fallback if any agent in chain fails; partial result display |

### 4.4 UX Features

#### FR-16: Design & Accessibility
**Priority:** P1 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-16.1 | Dark Mode | Full dark theme with `next-themes` (class strategy) |
| FR-16.2 | Responsive Design | Mobile-first with breakpoints at sm/md/lg/xl |
| FR-16.3 | Glassmorphism UI | Frosted glass effects with backdrop blur |
| FR-16.4 | Animations | Framer Motion page transitions, count-up, staggered entries |
| FR-16.5 | Accessibility | `prefers-reduced-motion`, ARIA labels, keyboard navigation, sr-only text |
| FR-16.6 | Mobile Bottom Nav | 5-tab bottom navigation bar on mobile |
| FR-16.7 | iOS Safe Area | `safe-area-inset` padding for notch devices |
| FR-16.8 | Collapsible Sidebar | Desktop sidebar with collapse toggle |
| FR-16.9 | Onboarding Tour | 4-step guided tour for new users |
| FR-16.10 | Command Palette | Global `Cmd+K` search with cmdk |
| FR-16.11 | Error Boundaries | React ErrorBoundary wrapping all page components |

#### FR-17: Authentication & Security
**Priority:** P0 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-17.1 | Login Page | Shopee-branded centered login page with email/password |
| FR-17.2 | NextAuth.js | Credentials provider with JWT session strategy |
| FR-17.3 | Auth Middleware | Protected API routes (16 route groups) |
| FR-17.4 | Zod Validation | 13 schemas covering all POST/PUT endpoints |
| FR-17.5 | Open Redirect Protection | URL whitelist for redirect endpoint (6 Shopee domains) |
| FR-17.6 | Demo Mode Flag | `isDemoMode` for conditional mock/real data switching |

### 4.5 Agent Office (Phaser 3 Game)

#### FR-18: Interactive Agent Office
**Priority:** P2 | **Status:** ✅ Implemented

| ID | Requirement | Details |
|----|-------------|---------|
| FR-18.1 | Phaser 3 Scene | 2D game scene with office background, collision system |
| FR-18.2 | Playable Boss | WASD/Arrow key movement with pixel character |
| FR-18.3 | AI Agent Workers | 8 agents with unique colors, statuses, and activities |
| FR-18.4 | Worker AI | Idle wandering, POI navigation, seat activities, emotes |
| FR-18.5 | Proximity Interaction | Press E to interact with nearby workers |
| FR-18.6 | RPG Menu | Contextual interaction menu with keyboard navigation |
| FR-18.7 | Camera Controller | Smooth follow + mouse wheel zoom (0.6x-2x) |
| FR-18.8 | Agent Grid View | Pixel-art 3x3 agent selection grid |
| FR-18.9 | Agent Profile View | Dark futuristic character profile panel |
| FR-18.10 | Productivity Stats | Real-time metrics bar with 6 indicators |
| FR-18.11 | Speech Bubbles | Animated slide-in/out bubbles with Shopee brand accent |
| FR-18.12 | Chat Bubbles | Text-based bubbles above workers |
| FR-18.13 | Shopee Office API | Join, status, memo, agents, guest agents endpoints |

---

## 5. Non-Functional Requirements

### 5.1 Performance
| ID | Requirement | Target | Current |
|----|-------------|--------|---------|
| NFR-01 | First Contentful Paint (FCP) | < 1.5s | ~1.2s |
| NFR-02 | Time to Interactive (TTI) | < 3s | ~2.5s |
| NFR-03 | API Response Time | < 200ms for database queries | ✅ Met |
| NFR-04 | Bundle Size | < 500KB initial JS (gzipped) | ~450KB |
| NFR-05 | Lighthouse Score | > 90 Performance | 85-90 |

### 5.2 Reliability
| ID | Requirement | Target | Current |
|----|-------------|--------|---------|
| NFR-06 | Uptime | 99.9% | ✅ Stable |
| NFR-07 | Error Recovery | Graceful fallback for all API failures | ✅ Error boundaries |
| NFR-08 | Data Persistence | SQLite with automatic Prisma client refresh | ✅ Singleton pattern |

### 5.3 Security
| ID | Requirement | Target | Current |
|----|-------------|--------|---------|
| NFR-09 | API Key Storage | Encrypted, server-side only | ✅ .env |
| NFR-10 | Environment Variables | All secrets in `.env`, never committed | ✅ |
| NFR-11 | Input Sanitization | Zod validation on all API inputs | ✅ 13 schemas |
| NFR-12 | XSS Prevention | React's built-in escaping + CSP headers | ✅ |
| NFR-13 | Open Redirect Prevention | URL whitelist on redirect endpoint | ✅ 6 Shopee domains |
| NFR-14 | Auth Middleware | Protected API routes | ✅ NextAuth middleware |
| NFR-15 | TypeScript Strict Mode | Strict type checking | ⚠️ DEFERRED (50+ errors) |

### 5.4 Scalability
| ID | Requirement | Target | Current |
|----|-------------|--------|---------|
| NFR-16 | Concurrent Users | Support 1,000+ concurrent users | ✅ PostgreSQL migration (v6.0) |
| NFR-17 | Data Volume | Handle 100K+ link records | ✅ PostgreSQL migration (v6.0) |
| NFR-18 | Mini Services | Each service independently scalable | ✅ 3 services (MCP & A2A → VPS OpenClaw) |

### 5.5 Compatibility
| ID | Requirement | Target | Current |
|----|-------------|--------|---------|
| NFR-19 | Browsers | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ | ✅ |
| NFR-20 | Devices | Desktop, tablet, mobile | ✅ |
| NFR-21 | Screen Sizes | 320px to 2560px | ✅ |

### 5.6 Code Quality
| ID | Requirement | Target | Current |
|----|-------------|--------|---------|
| NFR-22 | ESLint Errors | 0 | ✅ 0 errors |
| NFR-23 | ESLint Warnings | < 20 | ⚠️ ~83 warnings |
| NFR-24 | TypeScript Errors | 0 | ⚠️ ~50+ (strict mode deferred) |
| NFR-25 | Console Errors | 0 | ✅ |
| NFR-26 | Test Coverage | > 80% | ❌ No tests |

---

## 6. Database Schema

### Database Provider Migration (v6.0)
| Property | v5.0 (SQLite) | v6.0 (PostgreSQL) |
|----------|--------------|-------------------|
| Provider | `sqlite` | `postgresql` |
| Connection | `file:./db/custom.db` | `postgresql://admin_tvf:<password>@76.13.176.142:5432/theviralfinds` |
| Concurrent Writes | Single writer | Multi-writer with row locking |
| Max Record Volume | ~10K practical limit | 100K+ with indexing |
| Connection Pooling | N/A | Prisma connection pool (default 5) |
| Data Migration | N/A | ⚠️ **Full reset** — all test data will be lost; fresh seed required |

### Entity Relationship Diagram

```
Campaign (1) ──────< (N) AffiliateLink (1) ──────< (N) ClickRecord
                                │
                                ├──< (N) Conversion
                                │
Campaign (1) ──────< (N) AffiliateLink

EarningGoal (standalone)
Payout (standalone)
AppSetting (standalone)
Notification (standalone)
```

### Models

| Model | Primary Key | Key Fields | Relationships |
|-------|-----------|------------|---------------|
| AffiliateLink | `id` (cuid) | name, productUrl, affiliateUrl, shortCode, clicks, conversions, earnings, status, expiresAt | belongsTo Campaign, hasMany ClickRecord, hasMany Conversion |
| Campaign | `id` (cuid) | name, description, status, budget, spent, startDate, endDate | hasMany AffiliateLink |
| ClickRecord | `id` (cuid) | linkId, ip, country, referer, device, converted | belongsTo AffiliateLink |
| Conversion | `id` (cuid) | linkId, orderId, amount, commission, status | belongsTo AffiliateLink |
| Payout | `id` (cuid) | method, amount, status, bankName, accountNo, requestedAt | standalone |
| AppSetting | `id` (cuid) | key (unique), value | standalone |
| EarningGoal | `id` (cuid) | name, targetAmount, currentAmount, period, status | standalone |
| Notification | `id` (cuid) | type, title, description, read, createdAt | standalone |

---

## 7. API Design

### Design Principles
- **RESTful** — Standard HTTP methods (GET, POST, PUT, DELETE)
- **JSON** — All request/response bodies in JSON
- **Pagination** — `?page=1&limit=20` pattern for list endpoints
- **Filtering** — Query parameters for search, category, status
- **Error Handling** — Consistent `{ error: string, details?: any }` format
- **Validation** — Zod schemas on all POST/PUT endpoints (13 schemas)
- **Server-side** — All API routes in `src/app/api/` using Next.js Route Handlers
- **Authentication** — NextAuth middleware protecting 16 route groups

### API Route Summary (40+ Routes)

| Category | Routes | Key Endpoints |
|----------|--------|--------------|
| Dashboard | 1 | GET /api/dashboard (with period filter) |
| Links | 6 | CRUD + bulk, QR code, share, stats per link |
| Products | 1 | GET /api/products/search |
| Analytics | 1 | GET /api/analytics (heatmap, funnel, comparison) |
| Campaigns | 2 | CRUD with budget tracking |
| Calculator | 1 | POST /api/calculator/estimate |
| Payouts | 1 | GET/POST with monthly summary |
| Goals | 3 | CRUD + progress update |
| Settings | 1 | GET/PUT |
| Notifications | 1 | GET/PUT (mark read) |
| Conversions | 1 | GET with filter/pagination |
| Leaderboard | 1 | GET with period filter |
| Achievements | 1 | GET |
| Auth | 1 | NextAuth [...nextauth] |
| Redirect | 1 | GET /api/redirect/[shortCode] (secure) |
| Click Stats | 1 | GET /api/click-stats |
| Activity | 1 | GET /api/activity |
| Referral | 1 | GET /api/referral |
| Agents | 2 | CRUD + activity |
| OpenClaw AI | 8 | trending, keywords, competitor, price-track, scheduler, web-reader, ai-insights, ai-content |
| OpenClaw MCP/A2A | 2 | mcp-proxy (→ OpenClaw Gateway), a2a-proxy (→ Chained Pipeline) |
| Shopee Integration | 2 | search, import |
| Shopee Office | 5 | join, status, memo, agents, guest-agents |

### Authentication
- **Provider**: NextAuth.js v4 with CredentialsProvider
- **Default Credentials**: admin@theviralfinds.my / admin123 (change in production)
- **Session Strategy**: JWT
- **Middleware**: Token-based authorization on 16 API route groups
- **Login Page**: /login with Shopee-branded UI

---

## 8. User Flows

### 8.1 Creating an Affiliate Link
```
Dashboard → Products → Search Product → Click "Generate Link"
  → Fill Dialog (Name, Category, Campaign) → Submit
  → Links Page → View New Link → Copy/Share/QR Code
```

### 8.2 Tracking Performance
```
Dashboard → View Stat Cards → Click "Analytics"
  → Performance Charts → Heatmap → Link Comparison
  → Export CSV/PDF
```

### 8.3 Using AI Tools
```
Sidebar → OpenClaw AI → Select Tool (e.g., Trending Scanner)
  → Enter Query → AI Processes (Web Search + LLM)
  → View Results → Apply Insights
```

### 8.4 Managing Campaigns
```
Campaigns → "New Campaign" → Fill Details → Submit
  → Assign Links → Track Budget & ROI
  → Pause/Complete Campaign
```

### 8.5 Requesting Payout
```
Earnings → View Balance → "Request Payout"
  → Select Method (Bank/E-Wallet) → Enter Details
  → Confirm → Track in Payout History
```

### 8.6 Interacting with Agent Office
```
Agent Office → View 3D Office with AI Workers
  → Walk around with WASD → Approach Agent → Press E
  → RPG Menu → Assign Task → Watch Agent Work
  → Switch to Grid View → Select Agent → View Profile
```

---

## 9. Design System

### Color System (OKLCH)
| Token | Light | Dark |
|-------|-------|------|
| `--background` | `#FFFFFF` | `#09090B` |
| `--foreground` | `#09090B` | `#FAFAFA` |
| `--shopee` | `#EE4D2D` | `#FF6742` |
| `--shopee-dark` | `#D73211` | `#EE4D2D` |
| `--success` | `#22C55E` | `#4ADE80` |
| `--warning` | `#F59E0B` | `#FBBF24` |

### Typography
- **Font Family**: Geist Sans / Geist Mono (system fonts)
- **Scale**: text-xs (12px) → text-2xl (24px) for content
- **Weights**: normal (400), medium (500), semibold (600), bold (700)

### Spacing System
- Based on Tailwind's 4px grid: `p-1` (4px) → `p-12` (48px)
- Component padding: `p-4` (16px) or `p-6` (24px)
- Card gaps: `gap-4` or `gap-6`

### Component Library
- **44+ shadcn/ui components** (New York variant)
- Custom extensions: Shopee-themed buttons, badges, cards
- Dark mode variants for all components

### CSS Utility Library (2,000+ lines)
- **Glassmorphism System**: `.glass-card`, `.glass-sidebar`, `.glass-header`, `.glass-badge`
- **Card Styles**: `.card-elevated`, `.card-glass`, `.card-accent`, `.card-spotlight`, `.card-tilt`
- **Button Styles**: `.btn-shopee`, `.btn-shopee-outline`, `.btn-glass`, `.btn-shine`
- **Badge Styles**: `.badge-glow`, `.badge-gradient`, `.badge-dot` (+ 4 variants)
- **Animation Utilities**: `.float-animation`, `.shimmer`, `.gradient-border`, `.ring-pulse`
- **Text Gradients**: `.text-gradient-shopee`, `.text-gradient-success`, `.text-gradient-gold`, `.text-gradient-purple`
- **Loading States**: `.skeleton-card`, `.skeleton-text`, `.skeleton-circle`, `.loading-dots`
- **Timeline Styles**: `.timeline-container`, `.timeline-dot`, `.timeline-card`
- **Dark Mode**: Full dark mode support with `next-themes`

### Animation Guidelines
- **Duration**: 150ms (micro) → 500ms (page transitions)
- **Easing**: `ease-in-out` for most, `spring` for interactive
- **Respect**: `prefers-reduced-motion: reduce` disables all animations

---

## 10. Deployment Architecture

### Current Setup (v6.0 — VPS Migration)
```
User → Caddy Gateway → Next.js (port 3000)
                    → Notification Service (port 3004)
                    → PostgreSQL (VPS 76.13.176.142:5432)
                    → OpenClaw Gateway (https://operator.gangniaga.my)
                        ├─ MCP Proxy → /health, /tools, /execute
                        └─ A2A Pipeline → niagaresearch → niagamarketing → niagacomputer
```

### Pre-Migration Setup (v5.0 — Archived)
```
User → Caddy Gateway → Next.js (port 3000)
                    → Notification Service (port 3004)
                    → MCP Server (port 3005) [MOCK — removed in v6.0]
                    → A2A Agent (port 3006) [DUMMY — removed in v6.0]
                    → SQLite (local file) [REPLACED in v6.0]
```

### Production (Vercel + VPS)
```
User → Vercel CDN → Next.js Serverless Functions
                  → Vercel Edge Network (static assets)
                  → VPS 76.13.176.142 (PostgreSQL + OpenClaw Gateway)
Mini Services → Notification Service (separate host)
             → OpenClaw Gateway (VPS-hosted, replaces MCP & A2A mini-services)
```

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | SQLite/PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | — | Secret for JWT signing |
| `NEXTAUTH_URL` | Yes | — | Base URL for auth callbacks |
| `ADMIN_PASSWORD` | Yes | — | Admin account password |
| `DEMO_MODE` | No | `true` | Enable/disable demo mock data |
| `NEXT_PUBLIC_APP_URL` | No | — | Public app URL for OAuth |
| `SHOPEE_API_KEY` | No | — | Shopee affiliate API key |
| `NOTIFICATION_SERVICE_URL` | No | `http://127.0.0.1:3004` | Notification WebSocket service |
| `MCP_SERVER_URL` | No | `http://127.0.0.1:3005` | MCP server URL |
| `A2A_SERVER_URL` | No | `http://127.0.0.1:3006` | A2A agent server URL |

---

## 11. Testing Strategy

### Unit Testing
- [ ] Component rendering tests (React Testing Library)
- [ ] Utility function tests (formatRM, calculateExpiry, isDemoMode)
- [ ] Zod schema validation tests
- [ ] API route handler tests
- [ ] Phaser game entity tests

### Integration Testing
- [ ] Database operation tests (Prisma)
- [ ] API endpoint tests (full request/response cycle)
- [ ] Authentication flow tests
- [ ] WebSocket notification tests
- [ ] Open redirect prevention tests

### E2E Testing
- [ ] Critical user flows (Playwright/Cypress)
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

### QA Automation
- agent-browser automated screenshots and VLM scoring
- Per-phase QA with 10-point scoring system
- Regression testing on each phase completion

---

## 12. Release History

| Phase | Description | Features Added |
|-------|-------------|----------------|
| 1 | Initial Build | 8 pages, 12 API routes, Prisma schema, seed data |
| 2 | QA & Enhancement | Social sharing, link comparison, onboarding tour, notifications page |
| 3 | Polish & Features | Date range selector, CSV/PDF export, welcome banner, quick actions |
| 4 | Styling Overhaul | Glassmorphism, calculator page, bulk actions, QR codes, heatmap, performance score |
| 5 | Page Polish | Earning goals, sparklines, rich footer, top products widget |
| 6 | Advanced Features | Leaderboard, achievements, real-time WebSocket notifications |
| 7 | Productivity | Command palette, CSS utility system, activity stream |
| 8 | AI Integration | OpenClaw AI suite, MCP Server, A2A Agent Network, referral system |
| 9 | Agent Office | Phaser 3 game, agent characters, productivity stats, agent grid/profile |
| 10 | Production Hardening | NextAuth, Zod validation, secure redirect, error boundaries, demo mode, utility extraction, ESLint fixes, component splitting |

---

## 13. Comprehensive Improvement Roadmap

This section consolidates ALL improvement suggestions from code review, agent-town analysis, phase retrospectives, and production readiness assessment into a single prioritized roadmap.

### 13.1 Improvement Priority Matrix

#### 🔴 Tier 1: Critical (Security & Reliability)

| ID | Improvement | Description | Impact | Effort |
|----|-------------|-------------|--------|--------|
| IMP-01 | **Real Shopee API Integration** | Replace mock product data with actual Shopee Product Search API; implement real affiliate link generation, order tracking, and commission sync | HIGH | HIGH (8-16h) |
| IMP-02 | **PostgreSQL Migration** | Migrate from SQLite to PostgreSQL for production scalability; supports concurrent users, 100K+ records, connection pooling | HIGH | MEDIUM (4-8h) |
| IMP-03 | **Rate Limiting** | Add API rate limiting to prevent abuse; per-IP and per-user limits; 429 responses with retry-after headers | HIGH | LOW (2-3h) |
| IMP-04 | **TypeScript Strict Mode** | Enable `strict: true` in tsconfig.json; fix all resulting type errors (~50+); ensures type safety | MEDIUM | HIGH (8-16h) |
| IMP-05 | **OAuth Providers** | Add Google and Facebook OAuth via NextAuth; reduce friction for Malaysian users | MEDIUM | MEDIUM (4-8h) |
| IMP-06 | **Environment Variable Validation** | Validate all required env vars on startup; fail fast with descriptive error messages | MEDIUM | LOW (1-2h) |

#### 🟠 Tier 2: Architecture & Code Quality

| ID | Improvement | Description | Impact | Effort |
|----|-------------|-------------|--------|--------|
| IMP-07 | **Split Worker.ts into Sub-Modules** | Refactor 550-line monolithic Worker.ts into 4 files: types.ts, movement.ts, idle.ts, task.ts following agent-town pattern | MEDIUM | MEDIUM (2-3h) |
| IMP-08 | **Build SceneEventBridge** | Create typed event bridge connecting React UI ↔ Phaser game; enables HUD to trigger game events and game to notify React | HIGH | MEDIUM (2-3h) |
| IMP-09 | **Task Queue System for Workers** | When task assigned to busy worker, queue it instead of discarding; auto-process queue on task completion | HIGH | MEDIUM (1-2h) |
| IMP-10 | **Stuck Detection for Workers** | Track lastX/lastY per frame, count consecutive stuck frames; skip waypoint or go home after threshold (120 frames) | HIGH | LOW (30min) |
| IMP-11 | **Input Focus Guard** | Prevent player movement when text input/textarea is focused; critical when chat panel or terminal is open | HIGH | LOW (15min) |
| IMP-12 | **Path Simplification** | Remove collinear waypoints from A* results for smoother, more natural NPC movement | MEDIUM | LOW (30min) |
| IMP-13 | **MinHeap for A* Pathfinding** | Replace sorted array with MinHeap for O(log n) extraction; significant performance gain on large maps | MEDIUM | MEDIUM (1-2h) |
| IMP-14 | **Unit Test Suite** | Set up Vitest + React Testing Library; test utilities, Zod schemas, API handlers; target 80% coverage | HIGH | HIGH (16-24h) |
| IMP-15 | **ESLint Warning Cleanup** | Reduce 83 warnings to <20; fix unused vars, prefer-const, react-hooks/exhaustive-deps | LOW | MEDIUM (4-6h) |
| IMP-16 | **API Response Caching** | Add in-memory caching for frequently accessed data (dashboard stats, leaderboard, achievements); configurable TTL | MEDIUM | MEDIUM (4-6h) |
| IMP-17 | **Service Health Monitoring** | Add health check endpoints for all mini-services; auto-restart on failure; dashboard widget showing service status | MEDIUM | MEDIUM (4-6h) |

#### 🟡 Tier 3: UX & Visual Improvements

| ID | Improvement | Description | Impact | Effort |
|----|-------------|-------------|--------|--------|
| IMP-18 | **DOM Overlay Chat Bubbles** | Replace Phaser Graphics bubbles with HTML DOM elements; enables CSS transitions, better text wrapping, pixel-font styling | MEDIUM | MEDIUM (1-2h) |
| IMP-19 | **Camera Drag-to-Pan + Zoom-to-Cursor** | Port agent-town camera improvements; zoom preserves world point under cursor; drag-to-pan with threshold detection | HIGH | MEDIUM (1-2h) |
| IMP-20 | **Emote Spritesheet System** | Replace text-only emoji emotes with animated spritesheet-based emotes; 12 emote types with 2-frame animations | MEDIUM | MEDIUM (2-3h) |
| IMP-21 | **Animated Environment Objects** | Add animated props (doors, coffee machine, server blink, plant sway); makes the scene feel alive | MEDIUM | LOW (1-2h) |
| IMP-22 | **Real Product Images** | Use Image Generation skill to create realistic product thumbnails; replace placeholder colored blocks | HIGH | MEDIUM (4-6h) |
| IMP-23 | **Dashboard Widget Customization** | Drag-and-drop dashboard layout with persistence; users choose which widgets to show | MEDIUM | HIGH (8-16h) |
| IMP-24 | **PWA Support** | Service worker, offline mode, push notifications, install prompt; native app-like experience | HIGH | HIGH (16-24h) |
| IMP-25 | **Keyboard Shortcuts Panel** | Visual keyboard shortcuts reference; accessible via `?` key; context-aware shortcuts per page | LOW | LOW (2-3h) |
| IMP-26 | **Page Transition Animations** | Smooth animated transitions between pages using Framer Motion AnimatePresence | MEDIUM | MEDIUM (4-6h) |

#### 🟢 Tier 4: Advanced Features & Expansion

| ID | Improvement | Description | Impact | Effort |
|----|-------------|-------------|--------|--------|
| IMP-27 | **Multi-Merchant Support** | Add Lazada, TikTok Shop, Amazon affiliate integration; unified dashboard across platforms | HIGH | HIGH (24-40h) |
| IMP-28 | **Team Management** | Multi-user support with roles (admin/manager/viewer); shared campaigns; team analytics | HIGH | HIGH (16-24h) |
| IMP-29 | **Advanced Analytics** | Cohort analysis, attribution modeling (first-touch, last-touch, multi-touch), A/B testing for links | HIGH | HIGH (16-24h) |
| IMP-30 | **Predictive Earnings** | ML-based earnings forecasting; trend prediction; optimal commission rate suggestions | MEDIUM | HIGH (16-24h) |
| IMP-31 | **Chrome Extension** | Quick link creation from any webpage; auto-detect Shopee products; one-click affiliate link generation | HIGH | HIGH (24-40h) |
| IMP-32 | **Automated Scheduled Reports** | Cron-based PDF/CSV report generation with email delivery; weekly/monthly/digest options | MEDIUM | MEDIUM (8-16h) |
| IMP-33 | **Affiliate Profile System** | Public profile page with shareable affiliate link, performance summary, social proof | MEDIUM | MEDIUM (4-8h) |
| IMP-34 | **Voice-Powered Product Search** | ASR + LLM for voice-based product search; hands-free affiliate management | MEDIUM | MEDIUM (8-16h) |
| IMP-35 | **Image-Based Product Matching** | VLM for image-based product discovery; upload photo → find similar Shopee products | MEDIUM | MEDIUM (8-16h) |
| IMP-36 | **Custom AI Fine-tuning** | Fine-tune AI models on affiliate-specific data; better recommendations and content generation | MEDIUM | HIGH (24-40h) |
| IMP-37 | **Automated Social Media Scheduling** | AI-generated content + automated posting to TikTok, Instagram, Facebook | MEDIUM | HIGH (16-24h) |

#### 🔵 Tier 5: Monetization & Business

| ID | Improvement | Description | Impact | Effort |
|----|-------------|-------------|--------|--------|
| IMP-38 | **Subscription Tiers** | Free (5 links, basic analytics), Pro (unlimited links, AI tools, advanced analytics), Enterprise (team management, API access) | HIGH | HIGH (24-40h) |
| IMP-39 | **Usage-Based Billing** | Track API calls, AI tool usage, link creation; Stripe integration for billing | MEDIUM | HIGH (16-24h) |
| IMP-40 | **White-Label Dashboard** | Customizable branding for agencies; logo, colors, domain; reseller capabilities | MEDIUM | HIGH (24-40h) |
| IMP-41 | **API Marketplace** | Third-party integration marketplace; public API with documentation; developer portal | MEDIUM | HIGH (40-60h) |

### 13.2 Quick Wins (Low Effort, High Impact)

These improvements can be implemented in under 1 hour each and provide immediate value:

| # | Improvement | Effort | Impact | File(s) |
|---|-------------|--------|--------|---------|
| 1 | **Input Focus Guard** | 15min | Prevents phantom movement when typing | Scene update loop |
| 2 | **Path Simplification** | 30min | Smoother NPC movement | `utils/Pathfinder.ts` |
| 3 | **Diagonal Speed Normalization** | 5min | Prevents ~41% faster diagonal movement | `entities/Player.ts` |
| 4 | **Stuck Detection** | 30min | Prevents workers getting permanently stuck | `entities/Worker.ts` |
| 5 | **Environment Variable Validation** | 1h | Fail-fast on missing config | `src/lib/config.ts` (new) |
| 6 | **API Health Check Endpoint** | 30min | Service monitoring support | `src/app/api/health/route.ts` (new) |

### 13.3 Agent Office Specific Improvements (from Agent-Town Analysis)

Based on comprehensive analysis of the agent-town reference project, these improvements target the Phaser 3 game engine:

| Priority | Improvement | Current State | Target State | Effort |
|----------|-------------|---------------|-------------|--------|
| 🔴 HIGH | **SceneEventBridge** | Events not wired between React and Phaser | Typed event bus connecting React UI ↔ Phaser game | 2-3h |
| 🔴 HIGH | **Task Queue System** | Tasks discarded when worker is busy | Workers queue tasks; auto-process on completion | 1-2h |
| 🔴 HIGH | **Stuck Detection** | Workers can get permanently stuck | Auto-recovery after 2 seconds of no movement | 30min |
| 🔴 HIGH | **Input Focus Guard** | Game movement while typing in inputs | No game movement when inputs focused | 15min |
| 🟠 MEDIUM | **Worker Sub-Modules** | 550-line monolithic Worker.ts | 4 focused files: types, movement, idle, task | 2-3h |
| 🟠 MEDIUM | **Camera Drag-to-Pan** | Only follow mode, no free camera | Drag-to-pan + zoom-to-cursor + dynamic bounds | 1-2h |
| 🟠 MEDIUM | **DOM Overlay Bubbles** | Phaser Graphics containers | HTML DOM elements with CSS transitions | 1-2h |
| 🟠 MEDIUM | **Emote Spritesheets** | Text-only emoji emotes | Animated spritesheet emotes (12 types) | 2-3h |
| 🟡 LOW | **Path Simplification** | Unnecessary waypoints in A* results | Smooth paths with only direction changes | 30min |
| 🟡 LOW | **Animated Environment** | Static office background | Doors, coffee machine, server blink animations | 1-2h |
| 🟡 LOW | **Dynamic Camera Bounds** | Fixed bounds | Auto-center on large viewports | LOW |

#### Advanced Agent Office Features (Transformative)

| Feature | Description | Effort |
|---------|-------------|--------|
| **Tiled Map Integration** | Replace static background with proper Tiled tilemap; multiple collision layers; spawn points in editor; animated props; overhead depth sorting | 8-16h |
| **Real Sprite Sheet Characters** | Replace emoji-in-circle agents with actual sprite sheets; 4-direction walk/idle (6 frames each); per-agent customization | 4-8h |
| **Full HUD Overlay System** | In-game pixel HUD; floating agent pills; virtualized chat panel; context meter; tool flyout panels | 8-16h |
| **State Persistence** | localStorage for sessions, seats, chat; auto-save/restore game state | 2-4h |
| **Onboarding Overlay** | First-time tutorial for game controls and agent interaction | 2-3h |

### 13.4 Backend API Improvements (Already Completed)

These improvements have been implemented in Phase 10:

| ID | Improvement | Status |
|----|-------------|--------|
| T1.1 | NextAuth.js authentication | ✅ Done |
| T1.2 | Secure redirect handler (URL whitelist) | ✅ Done |
| T1.3 | TypeScript strict mode | ⏳ Deferred |
| T1.4 | ESLint rule tightening | ✅ Done |
| T2.1 | Zod validation on all endpoints | ✅ Done (13 schemas) |
| T2.2 | Demo mode flag | ✅ Done |
| T2.3 | Prisma singleton + reduced logging | ✅ Done |
| T2.4 | Bulk operations in $transaction() | ✅ Done |
| T2.5 | Notification Prisma model | ✅ Done |
| T2.6 | Service URLs configuration | ✅ Done |
| T3.4 | Error boundaries | ✅ Done |
| T3.5 | Default page → Dashboard | ✅ Done |
| T4.1 | Header search fix | ✅ Done |
| T4.2 | Dev deps in devDependencies | ✅ Done |
| T4.3 | Shared utility extraction | ✅ Done |

### 13.5 Frontend Improvements (Already Completed)

| ID | Improvement | Status |
|----|-------------|--------|
| F-01 | Component splitting (dashboard, analytics, links) | ✅ Done (22 sub-components) |
| F-02 | Error boundaries wrapping pages | ✅ Done |
| F-03 | Session provider + auth guard | ✅ Done |
| F-04 | Login page with Shopee branding | ✅ Done |
| F-05 | Global search query (header → links) | ✅ Done |
| F-06 | ESLint fixes (0 errors, 83 warnings) | ✅ Done |

---

## 14. Implementation Roadmap Timeline

### Phase 11 — Quick Wins & Critical Fixes (1-2 weeks)
**Goal**: Address all quick wins and critical security/reliability items

- [ ] IMP-11: Input Focus Guard (15min)
- [ ] IMP-12: Path Simplification (30min)
- [ ] IMP-10: Stuck Detection (30min)
- [ ] IMP-06: Environment Variable Validation (1-2h)
- [ ] IMP-03: Rate Limiting (2-3h)
- [ ] IMP-07: Split Worker.ts into Sub-Modules (2-3h)
- [ ] IMP-08: Build SceneEventBridge (2-3h)
- [ ] IMP-09: Task Queue System (1-2h)
- [ ] IMP-15: ESLint Warning Cleanup (4-6h)

### Phase 12 — Architecture & UX (2-3 weeks)
**Goal**: Improve architecture, visual quality, and user experience

- [ ] IMP-19: Camera Drag-to-Pan + Zoom-to-Cursor (1-2h)
- [ ] IMP-18: DOM Overlay Chat Bubbles (1-2h)
- [ ] IMP-13: MinHeap for A* Pathfinding (1-2h)
- [ ] IMP-21: Animated Environment Objects (1-2h)
- [ ] IMP-20: Emote Spritesheet System (2-3h)
- [ ] IMP-22: Real Product Images (4-6h)
- [ ] IMP-16: API Response Caching (4-6h)
- [ ] IMP-17: Service Health Monitoring (4-6h)
- [ ] IMP-25: Keyboard Shortcuts Panel (2-3h)
- [ ] IMP-26: Page Transition Animations (4-6h)

### Phase 13 — Production Hardening (2-3 weeks)
**Goal**: Production readiness with real integrations

- [ ] IMP-01: Real Shopee API Integration (8-16h)
- [ ] IMP-02: PostgreSQL Migration (4-8h)
- [ ] IMP-04: TypeScript Strict Mode (8-16h)
- [ ] IMP-05: OAuth Providers (4-8h)
- [ ] IMP-14: Unit Test Suite (16-24h)
- [ ] IMP-23: Dashboard Widget Customization (8-16h)
- [ ] IMP-32: Automated Scheduled Reports (8-16h)
- [ ] IMP-33: Affiliate Profile System (4-8h)

### Phase 14 — Platform Expansion (3-4 weeks)
**Goal**: Multi-platform and team features

- [ ] IMP-27: Multi-Merchant Support (Lazada, TikTok Shop, Amazon) (24-40h)
- [ ] IMP-28: Team Management with Roles (16-24h)
- [ ] IMP-29: Advanced Analytics (Cohort, Attribution, A/B) (16-24h)
- [ ] IMP-24: PWA Support (16-24h)
- [ ] IMP-31: Chrome Extension (24-40h)

### Phase 15 — AI Enhancement (3-4 weeks)
**Goal**: AI-powered competitive advantages

- [ ] IMP-30: Predictive Earnings Forecasting (16-24h)
- [ ] IMP-34: Voice-Powered Product Search (8-16h)
- [ ] IMP-35: Image-Based Product Matching (8-16h)
- [ ] IMP-36: Custom AI Fine-tuning (24-40h)
- [ ] IMP-37: Automated Social Media Scheduling (16-24h)

### Phase 16 — Monetization (2-3 weeks)
**Goal**: Revenue generation features

- [ ] IMP-38: Subscription Tiers (Free/Pro/Enterprise) (24-40h)
- [ ] IMP-39: Usage-Based Billing with Stripe (16-24h)
- [ ] IMP-40: White-Label Dashboard (24-40h)
- [ ] IMP-41: API Marketplace (40-60h)

### Advanced Agent Office (Parallel Track)
These can be worked on in parallel with the main roadmap:

- [ ] Tiled Map Integration (8-16h)
- [ ] Real Sprite Sheet Characters (4-8h)
- [ ] Full HUD Overlay System (8-16h)
- [ ] State Persistence (2-4h)
- [ ] Onboarding Overlay (2-3h)

---

## 15. Success Metrics

### Key Performance Indicators (KPIs)

| Metric | Current | Target (3 months) | Target (6 months) |
|--------|---------|-------------------|-------------------|
| Active Users | — | 500+ | 1,000+ |
| Links Created | — | 25,000+ | 50,000+ |
| Conversions Tracked | — | 50,000+ | 100,000+ |
| API Requests/day | — | 250,000+ | 500,000+ |
| Average Session Duration | — | 6+ minutes | 8+ minutes |
| User Retention (30-day) | — | 50%+ | 60%+ |
| NPS Score | — | 40+ | 50+ |

### Quality Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lighthouse Performance | 85-90 | > 90 |
| Lighthouse Accessibility | 85 | > 95 |
| Lighthouse SEO | 80 | > 90 |
| ESLint Errors | 0 | 0 |
| ESLint Warnings | 83 | < 20 |
| Console Errors | 0 | 0 |
| TypeScript Errors | ~50 (strict) | 0 |
| Test Coverage | 0% | > 80% |

---

## 16. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Shopee API changes | Medium | High | Abstraction layer, mock fallback, version pinning |
| Database scalability (SQLite) | High | High | PostgreSQL migration path (Phase 13), connection pooling |
| AI SDK rate limits | Medium | Low | Caching (IMP-16), fallback responses, queue system |
| Mobile performance | Low | Medium | Code splitting, lazy loading, image optimization |
| Browser compatibility | Low | Low | Tailwind's built-in vendor prefixing, target modern browsers |
| TypeScript strict mode migration | Medium | Medium | Incremental migration, phase-by-phase error resolution |
| Worker stuck bugs | High | Medium | Stuck detection (IMP-10), path simplification (IMP-12) |
| WebSocket reliability | Low | Medium | Auto-reconnect with exponential backoff, graceful fallback |
| Production deployment complexity | Medium | Medium | Mini-services on separate hosts; health monitoring (IMP-17) |

---

## 17. Code Patterns & Architecture Guidelines

### Pattern 1: Modular Worker Sub-System Architecture (from Agent-Town)
```typescript
// worker/types.ts — Shared context interface
export interface WorkerCtx {
  readonly scene: Phaser.Scene;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  facing: Direction;
  moveTarget: { x: number; y: number } | null;
  stuckFrames: number;
  taskQueue: TaskQueueItem[];
  // ... all mutable state
}

// Worker class implements WorkerCtx and delegates to sub-modules:
export class Worker implements WorkerCtx {
  navigateTo(x: number, y: number, facePoi?: { x: number; y: number }) {
    movNavigateTo(this, x, y, facePoi); // Delegate to movement module
  }
  assignTask(runId: string, taskMessage: string, onReady?: () => void) {
    taskAssignTask(this, runId, taskMessage, onReady); // Delegate to task module
  }
}
```

### Pattern 2: Typed Event Bus Bridge (from Agent-Town)
```typescript
// events.ts
export interface GameEventMap {
  'task-assigned': [taskId: string, message: string, seatId?: string, sessionKey?: string];
  'task-completed': [runId: string];
  'worker-selected': [workerId: string];
  // ... all events with exact types
}

// SceneEventBridge.ts — Single function wires everything with cleanup
export function initSceneEventBridge(...): () => void {
  const unsubs: Array<() => void> = [];
  unsubs.push(gameEvents.on("task-assigned", (taskId, message, seatId) => { ... }));
  return () => { for (const unsub of unsubs) unsub(); };
}
```

### Pattern 3: DOM Overlay Bubble with Camera Sync
```typescript
class ChatBubble {
  private syncPosition() {
    const cam = this.scene.cameras.main;
    const sx = (this.worldX - cam.worldView.x) * cam.zoom + cam.x;
    const sy = (this.worldY - cam.worldView.y) * cam.zoom + cam.y;
    this.el.style.left = `${sx}px`;
    this.el.style.top = `${sy}px`;
  }
}
```

### Pattern 4: API Validation with Zod
```typescript
// All POST/PUT endpoints follow this pattern:
const body = requestSchema.parse(await req.json());
// or with safeParse for better error messages:
const result = requestSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 });
}
```

### Pattern 5: Prisma Singleton
```typescript
// src/lib/db.ts — Prevents connection pool exhaustion
const globalForDb = globalThis as unknown as { db: PrismaClient };
export const db = globalForDb.db ?? new PrismaClient({ log: ['warn', 'error'] });
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
```

---

## 18. Appendix

### A. Glossary

| Term | Definition |
|------|-----------|
| **Affiliate Link** | A tracked URL that earns commission when a purchase is made |
| **Short Code** | Unique identifier for an affiliate link (e.g., `ABC123`) |
| **Conversion** | A completed purchase through an affiliate link |
| **Commission** | Earnings from a conversion (percentage of sale amount) |
| **Campaign** | A marketing initiative grouping multiple affiliate links |
| **MCP** | Model Context Protocol — Anthropic's AI tool connectivity standard |
| **A2A** | Agent-to-Agent — Inter-agent communication protocol |
| **OpenClaw** | AI intelligence suite within the platform |
| **SceneEventBridge** | Typed event bus connecting React UI ↔ Phaser game |
| **WorkerCtx** | Shared mutable state interface for worker sub-modules |
| **MinHeap** | Priority queue data structure for efficient A* pathfinding |

### B. Third-Party Services

| Service | Purpose | Integration Status |
|---------|---------|-------------------|
| Shopee Affiliate API | Product search, order tracking | Mock data (Phase 13 planned) |
| z-ai-web-dev-sdk | AI capabilities (search, LLM, web reader) | ✅ Integrated |
| Socket.IO | Real-time notifications | ✅ Integrated (port 3004) |
| NextAuth.js | Authentication | ✅ Integrated (credentials) |
| Vercel | Hosting and deployment | Configured |
| Prisma ORM | Database management | ✅ Integrated (SQLite → PostgreSQL planned) |

### C. Project Statistics

| Metric | Value |
|--------|-------|
| Total Pages | 16 |
| Total API Routes | 40+ |
| CSS Lines | 2,000+ |
| UI Components (shadcn) | 44+ |
| Database Models | 8 |
| Seed Records | 73+ |
| Zod Validation Schemas | 13 |
| Mini Services | 3 |
| ESLint Errors | 0 |
| Phases Completed | 10 |
| Improvement Items | 41 |

### D. References

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Prisma ORM](https://www.prisma.io/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)
- [Phaser 3](https://phaser.io/)
- [z-ai-web-dev-sdk](https://z.ai)
- [NextAuth.js v4](https://next-auth.js.org/)
- [Zod Validation](https://zod.dev/)
- [Agent Town Reference](https://github.com/geezerrrr/agent-town)

### E. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2025 | Initial PRD — 8 pages, 12 API routes |
| 2.0 | April 2025 | Added Phase 2-4 features (social sharing, calculator, bulk actions, QR codes, heatmap) |
| 3.0 | May 2025 | Added Phase 5-7 features (goals, sparklines, leaderboard, achievements, command palette) |
| 4.0 | June 2025 | Added Phase 8-9 features (AI suite, MCP, A2A, Agent Office, Phaser game) |
| 5.0 | July 2025 | **Comprehensive improvement roadmap** — 41 improvement items across 5 tiers; agent-town analysis; production hardening (Phase 10); updated database schema, API design, security requirements; implementation timeline |
