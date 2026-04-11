# PRD — Product Requirements Document

## TheViralFinds: Shopee Affiliate Management System

**Version:** 8.0
**Last Updated:** April 2026
**Status:** Production Hardening + NiagaBot Full Integration Phase
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
- **🟢 PIXEL-AGENTS ENHANCEMENT**: Isometric Office View, Enhanced Agent States, Real-time Activity Monitor, Agent Conversation Panel, Minimap, Themes, Performance Dashboard

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
│  Phaser 3 Game Engine | Isometric CSS View | Agent Grid | Agent Profile  │
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

### 4.6 Pixel-Agents Inspired Office Enhancement

> **Inspired by:** [pixel-agents](https://github.com/pablodelucca/pixel-agents.git) — VS Code extension that visualizes AI agents as pixel-art characters in an isometric office. Key patterns adapted: isometric rendering, dual detection strategy, agent state machine, transcript parsing, sprite pipeline, game-react bridge.

#### FR-19: Isometric Office View
**Priority:** P1 | **Status:** 🆕 New (Inspired by pixel-agents isometric rendering)

| ID | Requirement | Details |
|----|-------------|---------|
| FR-19.1 | CSS Isometric Floor | Transform-based isometric grid rendering with 30° rotation, no Canvas/Phaser needed |
| FR-19.2 | Isometric Agent Avatars | Agent characters rendered as isometric sprites with directional facing (up/down/left/right) |
| FR-19.3 | Isometric Furniture | Office furniture (desks, chairs, plants, server racks) rendered in isometric perspective |
| FR-19.4 | Isometric Zones | Color-coded floor zones for each agent team (Research, Create, Optimize, Execute) |
| FR-19.5 | Camera Pan & Zoom | Click-drag to pan, mouse wheel to zoom the isometric view |
| FR-19.6 | Agent Walking Animation | CSS step animation for agents moving between desks and POIs |
| FR-19.7 | View Toggle | Switch between Phaser Game View and Isometric CSS View via tab bar |
| FR-19.8 | Responsive Isometric | Auto-scale isometric view for mobile screens with touch pan/zoom |

#### FR-20: Enhanced Agent State Machine
**Priority:** P1 | **Status:** 🆕 New (Inspired by pixel-agents agent state management)

| ID | Requirement | Details |
|----|-------------|---------|
| FR-20.1 | Expanded Agent States | Add new states: 'thinking', 'collaborating', 'reporting', 'break' alongside existing idle/writing/researching/executing/syncing/error |
| FR-20.2 | State Transition Rules | Define valid state transitions (e.g., idle→thinking→researching→writing→syncing→idle) |
| FR-20.3 | Visual State Indicators | Each state has unique animation: thinking=pulsing brain, collaborating=two-agent link, reporting=document wave |
| FR-20.4 | State Duration Tracking | Track how long each agent stays in each state for performance metrics |
| FR-20.5 | State History Log | Rolling 24-hour state history per agent with timeline visualization |
| FR-20.6 | Anomalous State Detection | Alert when agent stuck in same state >10 minutes or enters unexpected state sequence |
| FR-20.7 | OpenClaw State Mapping | Map OpenClaw agent activities to office agent states (niagaresearch→researching, niagamarketing→writing, etc.) |

#### FR-21: Real-time Activity Monitor
**Priority:** P0 | **Status:** 🆕 New (Inspired by pixel-agents dual detection strategy)

| ID | Requirement | Details |
|----|-------------|---------|
| FR-21.1 | WebSocket Push Events | Socket.IO push for instant agent state changes (replaces 3s polling) |
| FR-21.2 | Polling Fallback | HTTP polling at 5s interval as fallback when WebSocket disconnects |
| FR-21.3 | Activity Event Stream | Real-time scrolling log of all agent activities with timestamp and type |
| FR-21.4 | Event Type Classification | Categorize events: status_change, task_start, task_complete, commission_earned, error, collaboration |
| FR-21.5 | Activity Filtering | Filter activity stream by agent, event type, time range |
| FR-21.6 | Event Sound Effects | Optional audio cues for key events (task complete, error, commission earned) |
| FR-21.7 | Activity Heatmap | Visual heatmap showing which hours of the day have most agent activity |
| FR-21.8 | OpenClaw Integration | OpenClaw agent responses trigger real state changes in the office (not random simulation) |

#### FR-22: Agent Conversation Panel
**Priority:** P1 | **Status:** 🆕 New (OpenClaw + pixel-agents transcript visualization)

| ID | Requirement | Details |
|----|-------------|---------|
| FR-22.1 | Chat Interface | Chat-style panel for communicating with individual agents |
| FR-22.2 | OpenClaw Chat Bridge | Send messages to OpenClaw agents via /v1/chat/completions with `openclaw/<agentId>` model |
| FR-22.3 | Streaming Responses | Stream agent responses in real-time with typing indicator |
| FR-22.4 | Conversation History | Persist recent conversations per agent (last 50 messages) |
| FR-22.5 | Quick Commands | Pre-built command buttons: "Kaji Pasaran", "Buat Ayat Pemasaran", "Format JSON" |
| FR-22.6 | Pipeline Trigger | Button to trigger full A2A pipeline (niagaresearch→niagamarketing→niagacomputer) from chat |
| FR-22.7 | Multi-Agent Conversation | Start conversation with multiple agents; responses chain automatically |
| FR-22.8 | Context Injection | Previous agent output automatically injected as context for next agent in pipeline |

#### FR-23: Minimap Overlay
**Priority:** P2 | **Status:** 🆕 New (Inspired by game engine minimap patterns)

| ID | Requirement | Details |
|----|-------------|---------|
| FR-23.1 | Minimap Canvas | Small overlay canvas (180×100px) in bottom-right corner of game view |
| FR-23.2 | Agent Dots | Color-coded dots for each agent on minimap with status color |
| FR-23.3 | Player Indicator | Highlighted dot for the boss/player character |
| FR-23.4 | Viewport Rectangle | Rectangle showing current camera viewport on the minimap |
| FR-23.5 | Click Navigation | Click on minimap to move camera to that position |
| FR-23.6 | Zone Labels | Labeled zones on minimap (Research, Create, Optimize, Execute) |
| FR-23.7 | Toggle Visibility | Button or key (M) to show/hide minimap |

#### FR-24: Office Theme System
**Priority:** P2 | **Status:** 🆕 New (Inspired by pixel-agents theme switching)

| ID | Requirement | Details |
|----|-------------|---------|
| FR-24.1 | Day Theme | Bright office with natural lighting, warm colors, daylight sky |
| FR-24.2 | Night Theme | Dark office with monitor glow, blue ambient, city lights through windows |
| FR-24.3 | Neon Theme | Cyberpunk neon-lit office with glowing edges, dark background, neon color accents |
| FR-24.4 | Theme Selector | Dropdown in header bar to switch themes, persisted in localStorage |
| FR-24.5 | CSS Variable System | All theme colors defined as CSS custom properties for instant switching |
| FR-24.6 | Phaser Theme Sync | Phaser game background and sprite tinting synced with selected theme |
| FR-24.7 | Auto Theme | Time-based automatic theme switching (Day 6AM-6PM, Night 6PM-6AM) |

#### FR-25: Agent Performance Dashboard
**Priority:** P1 | **Status:** 🆕 New (Inspired by pixel-agents agent metrics)

| ID | Requirement | Details |
|----|-------------|---------|
| FR-25.1 | Per-Agent Metrics | Individual cards showing: tasks completed, avg response time, uptime % |
| FR-25.2 | Productivity Score | 0-100 score per agent based on task completion rate and response time |
| FR-25.3 | Team Metrics | Aggregate metrics by team (Research, Create, Optimize, Execute) |
| FR-25.4 | Pipeline Throughput | Real-time measure of how many tasks flow through the A2A pipeline per hour |
| FR-25.5 | Bottleneck Detection | Alert when any agent in pipeline takes >2x average time |
| FR-25.6 | Performance Trend | 7-day trend chart per agent showing productivity changes |
| FR-25.7 | Leaderboard | Agent performance ranking with weekly/monthly/all-time views |
| FR-25.8 | Export Report | Download agent performance data as CSV or PDF |

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

### Environment Variables (v6.0 — Updated for VPS)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL: `postgresql://admin_tvf:<pw>@76.13.176.142:5432/theviralfinds` |
| `NEXTAUTH_SECRET` | Yes | — | Secret for JWT signing |
| `NEXTAUTH_URL` | Yes | — | Base URL for auth callbacks |
| `ADMIN_PASSWORD` | Yes | — | Admin account password |
| `DEMO_MODE` | No | `true` | Enable/disable demo mock data |
| `NEXT_PUBLIC_APP_URL` | No | — | Public app URL for OAuth |
| `SHOPEE_API_KEY` | No | — | Shopee affiliate API key |
| `NOTIFICATION_SERVICE_URL` | No | `http://127.0.0.1:3004` | Notification WebSocket service |
| `OPENCLAW_GATEWAY_URL` | Yes | `https://operator.gangniaga.my` | OpenClaw Gateway base URL (replaces MCP & A2A) |
| `OPENCLAW_GATEWAY_TOKEN` | Yes | — | Bearer token for OpenClaw API authentication |
| ~~`MCP_SERVER_URL`~~ | ~~No~~ | ~~`http://127.0.0.1:3005`~~ | ~~REMOVED in v6.0 — replaced by OPENCLAW_GATEWAY_URL~~ |
| ~~`A2A_SERVER_URL`~~ | ~~No~~ | ~~`http://127.0.0.1:3006`~~ | ~~REMOVED in v6.0 — replaced by OPENCLAW_GATEWAY_URL~~ |

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
| 11 | VPS Migration (IN PROGRESS) | PostgreSQL on VPS, MCP proxy → OpenClaw Gateway, A2A → Chained agent pipeline |
| 12 | Pixel-Agents Enhancement | Isometric Office View, Enhanced Agent States, Real-time Activity Monitor, Agent Conversation Panel, Minimap Overlay, Office Themes, Agent Performance Dashboard |

---

## 12.5 Fasa Perlaksanaan: Penyambungan Mutlak ke Pelayan VPS

> **Technical Implementation Plan** — Pemindahan sepenuhnya infrastruktur TheViralFinds ke VPS 76.13.176.142, menamatkan semua sambungan tempatan (localhost) dan mengintegrasikan OpenClaw Gateway.

### 12.5.1 VPS Discovery Report (Live Scan — 10 April 2026)

Port scan dan API probing telah dilakukan terhadap VPS 76.13.176.142:

| Port | Service | Status | Detail |
|------|---------|--------|--------|
| 22 | SSH | ❌ CLOSED/FILTERED | Tidak boleh diakses dari sandbox; perlu akses SSH manual |
| 80 | HTTP | ❌ CLOSED/FILTERED | Tidak aktif |
| 443 | HTTPS | ✅ OPEN | nginx melayan OpenClaw Control SPA |
| 3000 | Next.js | ❌ CLOSED/FILTERED | Tidak diinstall di VPS |
| 3004 | Notification | ❌ CLOSED/FILTERED | Tidak diinstall di VPS |
| 3005 | MCP Server | ❌ CLOSED/FILTERED | **Akan dihapuskan** — diganti OpenClaw Gateway |
| 3006 | A2A Agent | ❌ CLOSED/FILTERED | **Akan dihapuskan** — diganti OpenClaw Pipeline |
| 5432 | PostgreSQL | ❌ CLOSED/FILTERED | **Belum dipasang** — perlu install via SSH |

#### OpenClaw Gateway Discovery

| Endpoint | Status | Response |
|----------|--------|----------|
| `GET /health` | ✅ 200 | `{"ok":true,"status":"live"}` |
| `GET /v1/models` | 🔒 401 | `{"error":{"message":"Unauthorized","type":"unauthorized"}}` |
| `POST /v1/chat/completions` | 🔒 401 (GET: 405) | Requires Bearer token |
| `GET /api/channels` | 🔒 401 | Requires authentication |
| `GET /` | ✅ 200 | OpenClaw Control SPA (2.9KB HTML) |

#### OpenClaw Gateway Architecture (discovered from JS bundle — 651KB)

| Component | Detail |
|-----------|--------|
| **Product** | OpenClaw Control (SPA with themes: claw, knot, dash) |
| **Auth Model** | Gateway Token + Password + Device Identity + Tailscale |
| **API Compatibility** | OpenAI-compatible (`/v1/chat/completions`, `/v1/models`, `/v1/embeddings`) |
| **MCP Support** | Built-in (categories, labels, native names) |
| **Agent System** | Full agent system (skills, files, chat, suggestions, file drafts) |
| **Model System** | Model catalog with overrides, fallbacks, daily usage tracking |
| **Auth Error Codes** | `AUTH_TOKEN_MISSING`, `AUTH_RATE_LIMITED`, `AUTH_SIGNATURE_EXPIRED`, `AUTH_NONCE_REQUIRED`, dll. |
| **Security Headers** | `strict-transport-security`, `x-frame-options: SAMEORIGIN`, `x-content-type-options: nosniff`, `permissions-policy` |
| **Server** | nginx (HTTPS only, TLS cert for `operator.gangniaga.my`) |

### 12.5.2 ⚠️ User Review Required — Keputusan Pangkalan Data

> **CAUTION**: Memindahkan dari SQLite (lokal) ke PostgreSQL (VPS) bermakna **semua data ujian terdahulu** (links, campaigns, dll.) **akan hilang/dikosongkan** kerana kita bermula di atas pangkalan data baharu yang sebenar. Adakah masa ini sesuai untuk kita "reset" pangkalan data?

**Status**: ⏳ Menunggu pengesahan pengguna sebelum melaksanakan Langkah 1.

---

### Langkah 1: Pindah Migrasi Pangkalan Data (SQLite → VPS PostgreSQL)

**Keadaan semasa**: `DATABASE_URL=file:/home/z/my-project/db/custom.db` (SQLite — tidak boleh menampung trafik berat, tersekat di lokal)

#### Tindakan di VPS (via SSH — manual):

```bash
# 1. Semak jika PostgreSQL sudah wujud
systemctl status postgresql

# 2. Jika tiada, pasang PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# 3. Cipta pangkalan data rasmi
sudo -u postgres psql -c "CREATE DATABASE theviralfinds;"

# 4. Cipta pengguna dan berikan hak akses
sudo -u postgres psql -c "CREATE USER admin_tvf WITH PASSWORD '<SECURE_PASSWORD>';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE theviralfinds TO admin_tvf;"

# 5. Konfigurasi akses luar
# Edit /etc/postgresql/*/main/postgresql.conf:
#   listen_addresses = '*'
# Edit /etc/postgresql/*/main/pg_hba.conf:
#   host all all 0.0.0.0/0 md5

# 6. Buka port firewall
sudo ufw allow 5432/tcp

# 7. Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Tindakan di Kod Next.js:

| File | Tindakan | Detail |
|------|----------|--------|
| `prisma/schema.prisma` | **MODIFY** | Tukar `provider = "sqlite"` → `provider = "postgresql"`; buang anotasi tidak serasi dengan Postgres |
| `.env` | **MODIFY** | `DATABASE_URL=postgresql://admin_tvf:<password>@76.13.176.142:5432/theviralfinds` |
| `prisma/seed.ts` | **VERIFY** | Pastikan seed script compatible dengan PostgreSQL (tiada SQLite-specific syntax) |
| `src/lib/db.ts` | **VERIFY** | Prisma singleton sudah support PostgreSQL (no changes needed) |

#### Verification — Check 1 (DB):

```bash
# Dari kod lokal, laksanakan:
npx prisma db push
# Buktikan pembinaan 8 struktur jadual berjaya pada server VPS
npx prisma studio
# Buka Prisma Studio untuk semak jadual secara visual
```

---

### Langkah 2: Rombakan Proxy MCP (Model Context Protocol)

**Keadaan semasa**: Aplikasi sentiasa cuba hubungi `http://127.0.0.1:3005` yang penuh dengan hardcoded mock capabilities seperti `'web_search'` olok-olokan.

#### Tindakan di Kod Next.js:

| File | Tindakan | Detail |
|------|----------|--------|
| `src/app/api/openclaw/mcp-proxy/route.ts` | **ROMBAK** | Padam panggilan ke `fetch(SERVICE_URLS.mcp + path)` |

#### Rombakan Detail:

| Endpoint | Semasa (Mock) | Baharu (OpenClaw Gateway) |
|----------|--------------|---------------------------|
| `GET /status` | `fetch(localhost:3005/status)` → hardcoded response | `fetch(https://operator.gangniaga.my/health)` → `{"ok":true,"status":"live"}` |
| `GET /tools` | `fetch(localhost:3005/tools)` → mock 12 capabilities | Hubungi OpenClaw Gateway internal context → senarai kebolehan sebenar NiagaBot |
| `POST /execute` | `fetch(localhost:3005/execute)` → sleep + mock result | Bina jambatan penterjemah: MCP command → OpenClaw-specific payload → `https://operator.gangniaga.my/v1/chat/completions` |

#### MCP Translation Bridge Pattern:

```typescript
// lib/openclaw.ts — Translation Bridge
export async function executeMCPTool(toolName: string, params: Record<string, unknown>) {
  // Map MCP tool names to OpenClaw agent + prompt
  const toolToAgent: Record<string, { model: string; systemPrompt: string }> = {
    'web_search': {
      model: 'openclaw/niagaresearch',
      systemPrompt: 'Kaji pasaran dan cari maklumat terkini berdasarkan query berikut.'
    },
    'web_reader': {
      model: 'openclaw/niagaresearch',
      systemPrompt: 'Baca dan analisis kandungan dari URL berikut.'
    },
    // ... map semua MCP tools ke OpenClaw agents
  };

  const agent = toolToAgent[toolName];
  if (!agent) throw new Error(`Unknown MCP tool: ${toolName}`);

  // Call OpenClaw Gateway
  return fetch('https://operator.gangniaga.my/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENCLAW_GATEWAY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: agent.model,
      messages: [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: JSON.stringify(params) }
      ],
      stream: false
    })
  });
}
```

#### Verification — Check 2 (MCP):

1. Paksa aplikasi membaca maklumat laman berita yang **real**, terus ke ejen pintar NiagaBot melalui paip baharu
2. `/status` harus return `{"ok":true,"status":"live"}` dari VPS
3. `/tools` harus senaraikan kebolehan sebenar dari OpenClaw (bukan mock)

---

### Langkah 3: Integrasi Pelayan A2A (Ejen-Berhubung-Ejen)

**Keadaan semasa**: Laluan proksi di aplikasi `http://127.0.0.1:3006/api/a2a` tidak menghasilkan kolaborasi ejen sebenar (sekadar melengahkan masa / sleep timer di frontend).

#### Tindakan di Kod Next.js:

| File | Tindakan | Detail |
|------|----------|--------|
| `src/app/api/openclaw/a2a-proxy/route.ts` | **ROMBAK** | Gantikan semua localhost calls dengan OpenClaw chained pipeline |

#### Format Baharu Rangkaian A2A — Chained Sequential Pipeline:

Apabila butang A2A ditekan di UI, proksi tidak akan menghantar kepada localhost. Sebaliknya ia akan:

```
┌─────────────────────────────────────────────────────────┐
│  A2A Chained Pipeline via OpenClaw Gateway              │
│                                                          │
│  Step 1: openclaw/niagaresearch                          │
│    Prompt: "Kaji Pasaran Pesaing"                        │
│    ↓ (output injected as context)                        │
│                                                          │
│  Step 2: openclaw/niagamarketing                         │
│    Prompt: "Berdasarkan kajian di atas, tulis ayat       │
│    pemasaran terbaik untuk produk ini"                   │
│    ↓ (output injected as context)                        │
│                                                          │
│  Step 3: openclaw/niagacomputer                          │
│    Prompt: "Format output sebagai JSON dan pastikan      │
│    kualiti akhir"                                        │
│    ↓                                                     │
│                                                          │
│  Final Output → Return to UI                             │
└─────────────────────────────────────────────────────────┘
```

#### A2A Pipeline Implementation Pattern:

```typescript
// lib/openclaw-a2a.ts — Chained Agent Pipeline
const OPENCLAW_BASE = 'https://operator.gangniaga.my/v1/chat/completions';
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;

interface PipelineStep {
  model: string;        // e.g., 'openclaw/niagaresearch'
  systemPrompt: string;
  userMessage: string;
}

export async function executeA2APipeline(initialQuery: string) {
  const pipeline: PipelineStep[] = [
    {
      model: 'openclaw/niagaresearch',
      systemPrompt: 'Anda adalah ejen penyelidikan pasaran. Kaji dan analisis pesaing.',
      userMessage: initialQuery
    },
    {
      model: 'openclaw/niagamarketing',
      systemPrompt: 'Anda adalah ejen pemasaran. Tulis ayat pemasaran terbaik berdasarkan kajian.',
      userMessage: '' // Akan diisi dengan output step sebelumnya
    },
    {
      model: 'openclaw/niagacomputer',
      systemPrompt: 'Anda adalah ejen format. Bina format JSON dan pastikan kualiti akhir.',
      userMessage: '' // Akan diisi dengan output step sebelumnya
    }
  ];

  let previousOutput = '';
  const results: Array<{ agent: string; output: string }> = [];

  for (const step of pipeline) {
    const messages = [
      { role: 'system', content: step.systemPrompt },
      { role: 'user', content: step.userMessage || previousOutput }
    ];

    const res = await fetch(OPENCLAW_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: step.model, messages, stream: false })
    });

    if (!res.ok) {
      // Error recovery — return partial results
      return { success: false, completedSteps: results, error: `Agent ${step.model} failed: ${res.status}` };
    }

    const data = await res.json();
    const output = data.choices?.[0]?.message?.content || '';
    previousOutput = output;
    results.push({ agent: step.model, output });
  }

  return { success: true, completedSteps: results };
}
```

#### Verification — Check 3 (A2A):

1. Sistem A2A pada front-end **tidak akan keluar teks dummy** lagi
2. Ia akan memproses log `niagaresearch` → `niagamarketing` → `niagacomputer` secara **live nampak di skrin log perbualan**
3. Setiap output ejen kelihatan secara berurutan di UI

---

### 12.5.3 Open Questions / Clarification Required

| # | Soalan | Kepentingan | Keputusan |
|---|--------|------------|-----------|
| 1 | Adakah VPS 76.13.176.142 sudah mempunyai servis PostgreSQL berjalan, atau mahu dipasangkan sepenuhnya menggunakan SSH? | 🔴 CRITICAL | ⏳ Menunggu pengguna |
| 2 | Sekiranya Postgres Port 5432 dibuka ke awam (public network) bagi laluan Next.js, adakah ia melanggar polisi firewall syarikat/projek? (Alternatif: Tailscale private IP) | 🔴 CRITICAL | ⏳ Menunggu pengguna |
| 3 | Apakah **OPENCLAW_GATEWAY_TOKEN** yang sah untuk mengakses API `https://operator.gangniaga.my/v1/*`? (Semua endpoint return 401 tanpa token) | 🔴 BLOCKER | ⏳ Menunggu pengguna |
| 4 | Adakah data ujian terdahulu boleh "reset" sepenuhnya? (Migrasi ke PostgreSQL = pangkalan data baharu kosong) | 🟠 HIGH | ⏳ Menunggu pengguna |

### 12.5.4 Prasyarat Sebelum Pelaksanaan

Sebelum Langkah 1-3 boleh dilaksanakan, perkara berikut **MESTI** diselesaikan:

- [ ] **SSH Access**: Pasang SSH client di sandbox ATAU pengguna laksanakan arahan SSH secara manual
- [ ] **PostgreSQL**: Pasang dan konfigurasi PostgreSQL di VPS (arahan disediakan di Langkah 1)
- [ ] **Port 5432**: Buka port di UFW dan konfigurasi `pg_hba.conf`
- [ ] **OPENCLAW_GATEWAY_TOKEN**: Pengguna mesti sediakan token yang sah dari OpenClaw Control (`operator.gangniaga.my/auth/login`)
- [ ] **Database Reset Confirmation**: Pengguna mesti sahkan bahawa kehilangan data ujian boleh diterima
- [ ] **Firewall Policy Confirmation**: Pengguna mesti sahkan port 5432 boleh dibuka ke awam, ATAU sediakan alternatif (Tailscale)

### 12.5.5 Environment Variables Update (v6.0)

| Variable | v5.0 (Old) | v6.0 (New) | Required |
|----------|-----------|------------|----------|
| `DATABASE_URL` | `file:./db/custom.db` | `postgresql://admin_tvf:<password>@76.13.176.142:5432/theviralfinds` | Yes |
| `OPENCLAW_GATEWAY_URL` | _(tidak wujud)_ | `https://operator.gangniaga.my` | Yes |
| `OPENCLAW_GATEWAY_TOKEN` | _(tidak wujud)_ | _(pengguna mesti sediakan)_ | Yes |
| `MCP_SERVER_URL` | `http://127.0.0.1:3005` | **DIHAPUSKAN** — diganti OPENCLAW_GATEWAY_URL | No |
| `A2A_SERVER_URL` | `http://127.0.0.1:3006` | **DIHAPUSKAN** — diganti OPENCLAW_GATEWAY_URL | No |
| `NOTIFICATION_SERVICE_URL` | `http://127.0.0.1:3004` | `http://127.0.0.1:3004` (tidak berubah) | No |

---

## 13. Comprehensive Improvement Roadmap

This section consolidates ALL improvement suggestions from code review, agent-town analysis, phase retrospectives, and production readiness assessment into a single prioritized roadmap.

### 13.1 Improvement Priority Matrix

#### 🔴 Tier 1: Critical (Security & Reliability)

| ID | Improvement | Description | Impact | Effort |
|----|-------------|-------------|--------|--------|
| IMP-01 | **Real Shopee API Integration** | Replace mock product data with actual Shopee Product Search API; implement real affiliate link generation, order tracking, and commission sync | HIGH | HIGH (8-16h) |
| IMP-02 | **PostgreSQL Migration** | Migrate from SQLite to PostgreSQL for production scalability; supports concurrent users, 100K+ records, connection pooling | HIGH | MEDIUM (4-8h) | **🔄 IN PROGRESS — Phase 11 VPS Migration** |
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
| ~~Database scalability (SQLite)~~ | ~~High~~ | ~~High~~ | ~~PostgreSQL migration path (Phase 13)~~ → ✅ **RESOLVED: v6.0 VPS migration in progress** |
| AI SDK rate limits | Medium | Low | Caching (IMP-16), fallback responses, queue system |
| Mobile performance | Low | Medium | Code splitting, lazy loading, image optimization |
| Browser compatibility | Low | Low | Tailwind's built-in vendor prefixing, target modern browsers |
| TypeScript strict mode migration | Medium | Medium | Incremental migration, phase-by-phase error resolution |
| Worker stuck bugs | High | Medium | Stuck detection (IMP-10), path simplification (IMP-12) |
| WebSocket reliability | Low | Medium | Auto-reconnect with exponential backoff, graceful fallback |
| Production deployment complexity | Medium | Medium | Mini-services on separate hosts; health monitoring (IMP-17) |
| **VPS PostgreSQL port exposure** | **High** | **High** | **Tailscale private IP alternative; SSL connections; IP whitelist in pg_hba.conf** |
| **OpenClaw Gateway token leak** | **Medium** | **High** | **Server-side only env var; never expose to client; rotate on compromise** |
| **OpenClaw Gateway downtime** | **Low** | **High** | **Health check endpoint; fallback to z-ai-web-dev-sdk; cached responses** |
| **A2A pipeline chain failure** | **Medium** | **Medium** | **Error recovery with partial results; skip failed agent; retry logic** |

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

### Pattern 6: OpenClaw Gateway Client (v6.0)
```typescript
// src/lib/openclaw.ts — Unified OpenClaw Gateway client
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'https://operator.gangniaga.my';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;

async function openclawRequest(model: string, messages: Array<{role: string; content: string}>) {
  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, stream: false })
  });
  if (!res.ok) throw new Error(`OpenClaw ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function checkGatewayHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${GATEWAY_URL}/health`);
    const data = await res.json();
    return data.ok === true;
  } catch { return false; }
}
```

### Pattern 7: A2A Chained Pipeline (v6.0)
```typescript
// src/lib/openclaw-a2a.ts — Sequential agent pipeline
export async function executeA2APipeline(query: string) {
  const steps = [
    { model: 'openclaw/niagaresearch', system: 'Ejen penyelidikan pasaran.' },
    { model: 'openclaw/niagamarketing', system: 'Ejen pemasaran.' },
    { model: 'openclaw/niagacomputer', system: 'Ejen format JSON.' },
  ];
  let context = query;
  const results = [];
  for (const step of steps) {
    const data = await openclawRequest(step.model, [
      { role: 'system', content: step.system },
      { role: 'user', content: context }
    ]);
    const output = data.choices?.[0]?.message?.content || '';
    context = output;
    results.push({ agent: step.model, output });
  }
  return results;
}
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
| **OpenClaw Gateway** | **MCP tool execution, A2A agent pipeline, real AI capabilities** | **🔄 Integrating (v6.0 VPS migration)** |
| Socket.IO | Real-time notifications | ✅ Integrated (port 3004) |
| NextAuth.js | Authentication | ✅ Integrated (credentials) |
| Vercel | Hosting and deployment | Configured |
| Prisma ORM | Database management | ✅ Integrated (SQLite → PostgreSQL migration in progress) |
| **PostgreSQL** | **Production database on VPS 76.13.176.142** | **🔄 Installing (v6.0 VPS migration)** |
| **nginx** | **Reverse proxy on VPS** | ✅ Running (HTTPS, port 443) |

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

| 7.0 | July 2025 | **Pixel-Agents Enhancement** — (see Section 12.6) |
| 8.0 | April 2026 | **Production Hardening + NiagaBot Full Integration** — (see Sections 12.7–12.10) |

---


## 12.6 Fasa 12: Pixel-Agents Inspired Enhancement

> **Technical Implementation Plan** — Peningkatan Shopee Office berdasarkan corak dan idea dari repositori pixel-agents (github.com/pablodelucca/pixel-agents). Fokus utama: visualisasi isometric, mesin keadaan agen yang lebih kaya, pemantauan aktiviti masa nyata, dan tema pejabat.

### 12.6.1 Sumber Ilham: Pixel-Agents Review

| Corak Pixel-Agents | Adaptasi TheViralFinds | Kesan |
|---------------------|----------------------|-------|
| Isometric Office Rendering | FR-19: CSS Isometric Office View | 🟢 Tinggi — Visual impact besar |
| Agent State Machine (typing/reading/waiting) | FR-20: Enhanced Agent State Machine | 🟢 Tinggi — Agen lebih hidup |
| Dual Detection (Hook + Fallback) | FR-21: WebSocket + Polling | 🟢 Tinggi — Real-time yang sebenar |
| JSONL Transcript Parsing | FR-22: Agent Conversation Panel | 🟡 Sederhana — Berguna untuk OpenClaw |
| Sprite Asset Pipeline | Enhanced Phaser Sprites | 🟡 Sederhana — Visual upgrade |
| Game Loop → React Bridge | Bidirectional Event Flow | 🟡 Sederhana — Architectural |
| Canvas 2D Renderer + Caching | Phaser Optimization | 🟢 Tinggi — Performance |

### 12.6.2 Pelan Perlaksanaan

#### Langkah 1: Isometric Office View (FR-19)
**Status:** 🆕 Baru | **Priority:** P1

| Komponen | Fail | Detail |
|----------|------|--------|
| IsometricOffice | `shopee-office/isometric-office.tsx` | Full isometric office combining floor, agents, furniture |
| Isometric CSS | `shopee-office/isometric.css` | Isometric-specific styles, transforms, animations |

#### Langkah 2: Enhanced Agent States (FR-20)
**Status:** 🆕 Baru | **Priority:** P1

| Komponen | Fail | Detail |
|----------|------|--------|
| State Machine | `shopee-office/agent-state-machine.ts` | State transition rules, valid transitions, duration tracking |

#### Langkah 3: Real-time Activity Monitor (FR-21)
**Status:** 🆕 Baru | **Priority:** P0

| Komponen | Fail | Detail |
|----------|------|--------|
| Activity Monitor | `shopee-office/activity-monitor.tsx` | Real-time scrolling event log with filtering |

#### Langkah 4: Agent Conversation Panel (FR-22)
**Status:** 🆕 Baru | **Priority:** P1

| Komponen | Fail | Detail |
|----------|------|--------|
| Chat Panel | `shopee-office/agent-chat-panel.tsx` | Full chat interface with OpenClaw bridge |
| Chat API | `api/shopee-office/chat/route.ts` | Server-side OpenClaw chat bridge |

#### Langkah 5: Minimap Overlay (FR-23)
**Status:** 🆕 Baru | **Priority:** P2

| Komponen | Fail | Detail |
|----------|------|--------|
| Minimap | `shopee-office/minimap-overlay.tsx` | Canvas-based minimap with agent dots |

#### Langkah 6: Office Theme System (FR-24)
**Status:** 🆕 Baru | **Priority:** P2

| Komponen | Fail | Detail |
|----------|------|--------|
| Theme Selector | `shopee-office/theme-selector.tsx` | Theme dropdown with Day/Night/Neon/Auto |
| Theme Store | `shopee-office/office-theme.ts` | Zustand store for theme state |

#### Langkah 7: Agent Performance Dashboard (FR-25)
**Status:** 🆕 Baru | **Priority:** P1

| Komponen | Fail | Detail |
|----------|------|--------|
| Performance Dashboard | `shopee-office/agent-performance.tsx` | Per-agent metrics, productivity scores, trends |

### 12.6.3 Keutamaan Perlaksanaan

| Keutamaan | Langkah | Estimasi Masa |
|-----------|---------|---------------|
| 🔴 P0 | Langkah 3: Real-time Activity Monitor | 2 jam |
| 🟠 P1 | Langkah 1: Isometric Office View | 3 jam |
| 🟠 P1 | Langkah 2: Enhanced Agent States | 1.5 jam |
| 🟠 P1 | Langkah 4: Agent Conversation Panel | 2.5 jam |
| 🟠 P1 | Langkah 7: Agent Performance Dashboard | 2 jam |
| 🟡 P2 | Langkah 5: Minimap Overlay | 1 jam |
| 🟡 P2 | Langkah 6: Office Theme System | 1.5 jam |

---

## 12.7 TASK IMPROVEMENT 1: Foundation, Quality & Advanced AI (Sprints 1–5)

> **Source:** `codex-prompts.md` — 18 prompts across 5 sprints covering foundation fixes, code quality, advanced AI, premium features, and CSS optimization.
> 
> **Status: ✅ ALL 18 PROMPTS COMPLETED** (confirmed 11 April 2026)

### Pre-Sprint: Repository & Deployment (10 items) ✅

| # | Task | Detail | Status |
|---|------|--------|--------|
| PS-1 | **Hapus `.env` dari git** | Secrets tak exposed lagi | ✅ Done |
| PS-2 | **Hapus `skills/` dari git** | 620+ files, 126K lines — repo size turun 60% | ✅ Done |
| PS-3 | **Hapus `db/custom.db` dari git** | Binary DB file removed | ✅ Done |
| PS-4 | **Buat `.env.example`** | Template semua env vars untuk Vercel | ✅ Done |
| PS-5 | **Fix `next.config.ts`** | Buang `output: "standalone"`, buang `eslint` key | ✅ Done |
| PS-6 | **Add `postinstall: "prisma generate"`** | Wajib untuk Vercel auto-generate | ✅ Done |
| PS-7 | **Migrate SQLite → PostgreSQL** | Prisma provider ditukar (Neon format) | ✅ Done |
| PS-8 | **Fix 19 API routes localhost fallback** | Null check DB_SERVICE_URL, return 503 | ✅ Done |
| PS-9 | **OFFICE_JOIN_KEY configurable** | Via env var (bukan hardcoded) | ✅ Done |
| PS-10 | **Move `socket.io` ke devDeps** | Tak masuk production bundle | ✅ Done |

### Sprint 1: Foundation Fix (Prompts 1–6) ✅

| # | Task | Description | Status |
|---|------|-------------|--------|
| 1 | **Database Indexes** | `@@index` pada AffiliateLink (4), ClickRecord (3), Conversion (3), Notification (3), Payout (2), EarningGoal (2) | ✅ Done |
| 2 | **Environment Variable Validation** | `src/lib/env.ts` — Zod validate DATABASE_URL, NEXTAUTH_SECRET, NODE_ENV, TELEGRAM_BOT_TOKEN, dll. Dev-mode fallback, production crash kalau missing | ✅ Done |
| 3 | **Remove SKIP_AUTH bypass** | Authentication sentiasa enforce; demo mode handle di login page | ✅ Done |
| 4 | **Health Check Endpoint** | `/api/health` — check DB, OpenClaw, Notification service; return status, version, uptime | ✅ Done |
| 5 | **Migrate to App Router** | `(dashboard)/` route group, 16 page routes, login page, server layout | ✅ Done |
| 6 | **Fix Authentication Flow** | Proper `/login` page, buang auto-signIn, middleware redirect | ✅ Done |

### Sprint 2: Code Quality & DX (Prompts 7–11) ✅

| # | Task | Description | Status |
|---|------|-------------|--------|
| 7 | **TypeScript Strict Mode** | `noImplicitAny: true` dalam tsconfig.json; fix 7 files yang ada implicit any errors | ✅ Done |
| 8 | **ESLint Rules Re-enable** | 5 rules dari "off" → "warn": `no-explicit-any`, `no-unused-vars`, `prefer-const`, `no-console`, `no-debugger` | ✅ Done |
| 9 | **Zod Validation on All API Routes** | 6 mutation routes validated: links, links/bulk, campaigns, payouts, goals, settings | ✅ Done |
| 10 | **API Response Caching** | `src/lib/cache.ts` — MemoryCache with TTL (SHORT 30s, MEDIUM 2m, LONG 5m, DASHBOARD 60s), pattern invalidation, max 100 entries | ✅ Done |
| 11 | **Rate Limiting** | 11 API routes: mutation (30 req/min), read (60 req/min), AI (10 req/min), auth (5 req/5min) | ✅ Done |

### Sprint 3: Advanced AI & Real-time (Prompts 12–14)

| # | Task | Description | Status |
|---|------|-------------|--------|
| 12 | **Streaming AI Responses** | Add `streamOpenClawCompletion()` to `openclaw.ts`; create SSE endpoint `/api/openclaw/stream`; create `useStreamingAI` hook | ✅ Done (on GitHub) |
| 13 | **Parallel A2A Pipeline** | Add `runParallelPipeline()` — fan-out to 3 agents simultaneously, fan-in with aggregator; add `mode` param to A2A proxy | ✅ Done (on GitHub) |
| 14 | **WebSocket Event Bus** | Create `src/lib/event-bus.ts` (typed EventBus class) + `src/hooks/use-event-bus.ts`; integrate with NotificationProvider | ✅ Done (on GitHub) |

### Sprint 4: Premium Features (Prompts 15–17) ✅

| # | Task | Description | Status |
|---|------|-------------|--------|
| 15 | **Agent Memory & Context** | `AgentMemory` Prisma model, `agent-memory.ts` — saveAgentMessage, getConversationContext, clearAgentMemory. `/api/agents/memory` endpoint | ✅ Done |
| 16 | **PWA Support** | `manifest.json`, `sw.js` (cache-first), `sw-provider.tsx`, icon-192.png + icon-512.png (Shopee orange bar chart design) | ✅ Done |
| 17 | **Testing Infrastructure** | Vitest configured, 16 tests passing: cache (5), rate-limit (3), validations (8). Scripts: `test`, `test:watch`, `test:coverage` | ✅ Done |

### Sprint 5: CSS & Performance (Prompt 18) ✅

| # | Task | Description | Status |
|---|------|-------------|--------|
| 18 | **CSS Modularization** | 3352-line `globals.css` → 7 modules: `base.css` (129), `scrollbar.css` (32), `sidebar.css` (26), `animations.css` (979), `components.css` (1654), `charts.css` (82), `utilities.css` (442) | ✅ Done |

---

## 12.8 TASK IMPROVEMENT 2: Shopee Office Hardening (4 Phases)

> **Source:** `implementation_plan_shopee_office.md` — Transforms the monolithic 1,560-line Phaser demo into a modular, integrated, and performant A2A visualization system.

### Phase 1: Core Architecture & State Management ✅

| Task | File | Status |
|------|------|--------|
| Strip `phaser-game.tsx` monolith → use `game/` subsystem | `phaser-game.tsx` | ✅ Done |
| Create `SceneEventBridge.ts` (React ↔ Phaser bridge) | `game/SceneEventBridge.ts` | ✅ Done |
| Connect `agentStateTracker` to `Worker` entities | `game/entities/Worker.ts` | ✅ Done |
| Use `game/config.ts` for all seat positions and zones | `game/config.ts` | ✅ Done |

### Phase 2: Bug Fixes & Interactivity ✅

| Task | File | Status |
|------|------|--------|
| **Input Focus Guard** — stop Boss movement while typing | `game/entities/Player.ts` | ✅ Done |
| **Diagonal Speed Normalization** — ~41% speed fix | `Worker.ts`, `Player.ts` | ✅ Done |
| **Task Queue Consumer** — auto-process queue on task complete | `game/entities/Worker.ts` | ✅ Done |
| Proximity greetings ("Hi Boss!") | `game/entities/Worker.ts` | ✅ Done |
| **ShortcutsOverlay** — press H/? for help HUD | `game/entities/ShortcutsOverlay.ts` | ✅ Done |

### Phase 3: Performance & UX ✅

| Task | File | Status |
|------|------|--------|
| **Deferred Asset Loading** — critical assets first, then spritesheets | `phaser-game.tsx` | ✅ Done |
| **Asset Loading Progress Bar** — visual feedback during load | `phaser-game.tsx` | ✅ Done |
| **Tween Accumulation Fix** — prevent memory leaks from bobble/glow | `game/entities/Worker.ts` | ✅ Done |

### Phase 4: Real Data Integration ✅

| Task | File | Status |
|------|------|--------|
| Remove random event generator → use real `GameEventBus` | `activity-monitor.tsx` | ✅ Done |
| Sync Minimap positions with `game/config.ts` | `minimap-overlay.tsx` | ✅ Done |

### Verification Checklist

- [x] **Boss Test**: Walk to agent, press E → proximity interaction works
- [x] **Typing Test**: Type in Chat Panel → Boss does NOT move
- [x] **Pipeline Test**: Run A2A pipeline → agents show 'executing'/'syncing' states
- [x] **Performance Test**: Network tab → `office_bg` loads first, spritesheets deferred
- [x] **Minimap Test**: Click agent dot → correct agent highlighted

---

## 12.9 TASK IMPROVEMENT 3: VPS & NiagaBot Full Integration (Sprint 0 + Sprint 6)

> **Source:** `codex-prompts-vps-niagabot.md` — 10 prompts ensuring VPS connectivity is bulletproof and NiagaBot handles ALL AI operations.

### Sprint 0: VPS & NiagaBot Integration (Run First!)

| # | Task | Description | Status |
|---|------|-------------|--------|
| 0A | **OpenClaw Gateway Client Hardening** | Add retry logic (3 attempts), circuit breaker (5 failures → 30s cooldown), connection state tracking to `gatewayFetch()` | ⬜ Pending |
| 0B | **VPS Health Dashboard Widget** | Create `vps-health-widget.tsx` — real-time status of OpenClaw, PostgreSQL, Notification, NiagaBot Pipeline; auto-refresh 60s | ✅ Partial (file exists, needs wiring) |
| 0C | **Replace Demo Chat → Real NiagaBot** | Replace `DEMO_RESPONSES` in `agent-chat-panel.tsx` with real `/api/openclaw/a2a-proxy` calls; keep fallback; add Live/Demo badge | ⬜ Pending |
| 0D | **MCP Proxy Real Integration** | Make `GET /status` check real gateway health; `GET /tools` fetch real capabilities; `POST /execute` log source tracking | ⬜ Pending |
| 0E | **A2A Pipeline Full Integration** | Add per-step timeout, parallel mode support, Malay system prompts for agents, enhanced error logging | ⬜ Pending |

### Sprint 6: Advanced NiagaBot Features

| # | Task | Description | Status |
|---|------|-------------|--------|
| 19 | **NiagaBot Auto-Pilot** | Create `niagabot-autopilot.ts` — scheduled tasks (daily trending scan, keyword research, competitor analysis, content suggestions); API + `autopilot-panel.tsx` UI | ⬜ Pending |
| 20 | **NiagaBot Database Bridge** | Create `niagabot-data-bridge.ts` — agents read real affiliate data (top links, conversions, goals) and use as context for responses | ⬜ Pending |
| 21 | **NiagaBot Multi-Modal** | Create `/api/openclaw/analyze-image` — upload product screenshots → NiagaBot vision analysis (product ID, pricing, competition); `image-analyzer.tsx` UI | ⬜ Pending |
| 22 | **NiagaBot Notification Triggers** | Create `niagabot-triggers.ts` — auto-fire NiagaBot analysis on high-value conversions, click spikes, goal achievements, earnings milestones | ⬜ Pending |
| 23 | **NiagaBot Smart Link Generator** | Create `/api/openclaw/smart-links` — NiagaBot suggests best affiliate links based on trending data; "🤖 NiagaBot Suggest" button on Links page | ⬜ Pending |

### NiagaBot Agent System Prompts (Bahasa Melayu)

| Agent | Model | Tugas |
|-------|-------|-------|
| **NiagaResearch** | `niagaresearch` | Analisis pasaran Shopee Malaysia, kenal pasti trend produk, kaji pesaing, berikan data spesifik |
| **NiagaMarketing** | `niagamarketing` | Tulis ayat pemasaran viral, strategi content TikTok/Instagram/Facebook, sasaran audiens Malaysia |
| **NiagaComputer** | `niagacomputer` | Kira ROI, optimumkan bajet, unjuran prestasi, format output JSON |
| **NiagaAggregator** | `niagaaggregator` | Gabungkan output semua ejen, selesaikan konflik, cipta laporan bersepadu |
| **NiagaReporter** | `niagareporter` | Cipta laporan akhir profesional dengan ringkasan eksekutif dan senarai tindakan |

---

## 12.10 Unified Sprint Execution Order

> [!IMPORTANT]
> **This is the master execution plan.** All 3 improvement tasks are consolidated into a single prioritized order. Follow this sequence for implementation.

| Order | Sprint | Tasks | Priority | Est. Time |
|-------|--------|-------|----------|-----------|
| 1 | **Sprint 0** (VPS Hardening) | 0A–0E: Gateway retry/circuit breaker, VPS widget, real NiagaBot chat, MCP/A2A full integration | 🔴 CRITICAL | 12–16h |
| 2 | **Pre-Sprint** (Repo Cleanup) | PS-1–PS-10: Remove secrets, skills, standalone, migrate PostgreSQL, fix 19 API routes | ✅ DONE | — |
| 3 | **Sprint 1** (Foundation) | Prompts 1–6: DB indexes, env validation, middleware, health check, App Router, auth | ✅ DONE | — |
| 4 | **Sprint 2** (Quality) | Prompts 7–11: TypeScript strict, ESLint, Zod validation, caching, rate limiting | ✅ DONE | — |
| 5 | **Shopee Office** (Hardening) | Phases 1–4: Modular refactor, input guard, deferred loading, real data integration | ✅ DONE | — |
| 6 | **Sprint 3** (AI) | Prompts 12–14: Streaming AI, parallel pipeline, event bus | ✅ DONE | — |
| 7 | **Sprint 4** (Premium) | Prompts 15–17: Agent memory, PWA (with icons), 16 tests passing | ✅ DONE | — |
| 8 | **Sprint 5** (CSS) | Prompt 18: 3352-line CSS → 7 modular files | ✅ DONE | — |
| 9 | **Sprint 6** (NiagaBot) | Prompts 19–23: Auto-pilot, DB bridge, multi-modal, triggers, smart links | 🟠 HIGH | 24–32h |

### Current Focus: Sprint 0 (VPS Hardening) → Sprint 6 (NiagaBot Advanced)

---

### E. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2025 | Initial PRD — 8 pages, 12 API routes |
| 2.0 | April 2025 | Added Phase 2-4 features (social sharing, calculator, bulk actions, QR codes, heatmap) |
| 3.0 | May 2025 | Added Phase 5-7 features (goals, sparklines, leaderboard, achievements, command palette) |
| 4.0 | June 2025 | Added Phase 8-9 features (AI suite, MCP, A2A, Agent Office, Phaser game) |
| 5.0 | July 2025 | **Comprehensive improvement roadmap** — 41 improvement items across 5 tiers; agent-town analysis; production hardening (Phase 10); updated database schema, API design, security requirements; implementation timeline |
| 6.0 | April 2026 | **VPS Migration** — Section 12.5 Fasa Perlaksanaan added; SQLite → PostgreSQL migration plan; MCP proxy → OpenClaw Gateway overhaul; A2A → Chained agent pipeline; VPS Discovery Report (live scan 76.13.176.142); Open Questions & Prerequisites; New env vars (OPENCLAW_GATEWAY_URL, OPENCLAW_GATEWAY_TOKEN); IMP-02 status updated to IN PROGRESS; 4 new risks added; 2 new code patterns (Pattern 6, 7); Third-party services updated; Phase 11 added to Release History |
| 7.0 | July 2025 | **Pixel-Agents Enhancement** — Section 12.6 added; FR-19 through FR-25 feature requirements; Isometric Office View (CSS-based); Enhanced Agent State Machine (9 states); Real-time Activity Monitor (dual detection); Agent Conversation Panel (OpenClaw chat bridge); Minimap Overlay; Office Theme System (Day/Night/Neon); Agent Performance Dashboard |
| 8.0 | April 2026 | **Production Hardening + NiagaBot Full Integration** — 3 TASK IMPROVEMENTS consolidated into PRD: (1) Section 12.7: Foundation, Quality & Advanced AI Sprints 1-5 with 18 prompts, (2) Section 12.8: Shopee Office 4-Phase Hardening (modular architecture, deferred loading, real data integration — ALL DONE), (3) Section 12.9: VPS & NiagaBot Full Integration Sprint 0+6 with 10 prompts (gateway hardening, auto-pilot, DB bridge, multi-modal, smart links). Section 12.10: Unified Sprint Execution Order. Sprint 1 & 3 marked DONE. Shopee Office fully hardened. |

