# QWEN.md — TheViralFinds Project Context

## Project Overview

**TheViralFinds** is a comprehensive **Shopee Affiliate Management System** built with Next.js 16, React 19, and TypeScript. It empowers Malaysian content creators, social media influencers, and affiliate marketers with a unified dashboard to manage their entire affiliate business — including real-time analytics, AI-powered intelligence tools, gamification, and seamless link management.

### Key Features
- **16 pages** including Dashboard, Affiliate Links, Analytics, Campaigns, Earnings, Leaderboard, Achievements, Notifications, Settings, and an interactive **Phaser 3 Agent Office**
- **40+ API routes** with Zod validation
- **8 Prisma models** (AffiliateLink, Campaign, ClickRecord, Conversion, Payout, AppSetting, EarningGoal, Notification)
- **AI-powered intelligence** via OpenClaw Gateway (operator.gangniaga.my) — trending product discovery, keyword research, competitor analysis
- **Real-time WebSocket notifications** via Socket.IO (port 3004)
- **Gamification** — Leaderboards, achievements, performance scoring
- **Pixel RPG Office** — Interactive Phaser 3 game scene with AI agents working in a virtual office
- **shadcn/ui** component library with Tailwind CSS v4

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui + Tailwind CSS 4 |
| State | Zustand + TanStack Query |
| Database | PostgreSQL + Prisma ORM |
| Charts | Recharts |
| Animations | Framer Motion |
| Real-time | Socket.IO (port 3004) |
| AI | z-ai-web-dev-sdk + OpenClaw Gateway |
| Game Engine | Phaser 3 |
| Auth | NextAuth.js v4 |
| Forms | React Hook Form + Zod |
| Package Manager | Bun |

## Project Structure

```
PROJECT-6/
├── src/
│   ├── app/                    # Next.js App Router (routes + API)
│   │   ├── api/                # 40+ API route handlers
│   │   ├── login/              # Auth pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles + CSS utilities
│   ├── components/
│   │   ├── layout/             # Layout components (sidebar, nav, etc.)
│   │   ├── pages/              # Page-specific components
│   │   ├── providers/          # Context providers
│   │   ├── shopee-office/      # Phaser 3 game + agent office components
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities, validations, DB, API helpers
│   └── store/                  # Zustand state stores
├── prisma/
│   └── schema.prisma           # Database schema (8 models)
├── mini-services/
│   ├── db-service/             # DB microservice (port 3005)
│   └── notification-service/   # Notification service (port 3004)
├── public/                     # Static assets
├── examples/                   # Reference code (not production)
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── components.json             # shadcn/ui config
├── PRD.md                      # Product Requirements Document (v7.0)
├── worklog.md                  # Development work log
├── Caddyfile                   # Caddy reverse proxy config
└── start-all.sh                # Multi-service startup script
```

## Building and Running

### Prerequisites
- **Bun** (package manager)
- **PostgreSQL** (database)
- **Node.js 18+** (runtime)

### Development

```bash
# Install dependencies (auto-runs prisma generate)
bun install

# Start Next.js dev server (port 3000)
bun run dev

# Start all services (Next.js + DB service + notification service)
bun run dev:all

# Start individual services manually:
bun run dev:db      # DB microservice (port 3005)
bun run dev:notif   # Notification service (port 3004)
```

### Database

```bash
# Generate Prisma client
bun run db:generate

# Push schema changes to database
bun run db:push

# Run migrations
bun run db:migrate

# Reset migrations (development)
bun run db:reset
```

### Production

```bash
# Build
bun run build

# Start production server (port 3000)
bun run start

# Lint
bun run lint
```

## Environment Variables

Key environment variables (copy `.env.example` to `.env`):

```bash
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/theviralfinds

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Auth bypass (development only)
SKIP_AUTH=true
DEMO_MODE=true

# OpenClaw Gateway (AI services)
OPENCLAW_GATEWAY_URL=https://operator.gangniaga.my
OPENCLAW_GATEWAY_TOKEN=your-token

# Mini-services (local dev)
NOTIFICATION_SERVICE_URL=http://127.0.0.1:3004
DB_SERVICE_URL=http://127.0.0.1:3005
```

## Architecture Notes

### Microservice Pattern
The app uses a **microservice architecture** to work around Prisma + Turbopack compatibility issues:

1. **Next.js App** (port 3000) — Main frontend + API routes
2. **DB Service** (port 3005) — Bun.serve() + Prisma for database operations
3. **Notification Service** (port 3004) — Socket.IO server for real-time notifications

In development, API routes check `DEMO_MODE` to return mock data. In production, they `fetch()` from the DB service.

### Auth
- Uses **NextAuth.js v4** with credentials provider
- JWT session strategy
- Auth middleware via `proxy.ts` (Next.js 16 compatible)
- `SKIP_AUTH=true` bypasses authentication for development

### AI Integration
- **OpenClaw Gateway** at `https://operator.gangniaga.my` serves as the AI backend
- Supports MCP (Model Context Protocol) for tool execution
- A2A (Agent-to-Agent) pipeline: `niagaresearch → niagamarketing → niagacomputer`
- AI features: trending scanner, keyword research, competitor analysis, content generation

### Database Schema
8 Prisma models:
- **AffiliateLink** — Affiliate links with tracking (clicks, conversions, earnings)
- **Campaign** — Marketing campaigns with budget tracking
- **ClickRecord** — Individual click events with device/referer data
- **Conversion** — Conversion records with order details
- **Payout** — Payout requests with bank/e-wallet info
- **AppSetting** — Key-value app settings
- **EarningGoal** — User-defined earning goals
- **Notification** — System notifications

## Coding Conventions

- **TypeScript strict mode** enabled
- **2-space indentation**, single quotes, no semicolons
- **PascalCase** for React components
- **camelCase** for functions, variables, store actions
- **kebab-case** for route segments and file names (e.g., `dashboard-page.tsx`)
- **`@/*` path alias** maps to `./src/*`
- **API handlers** in `src/app/api/**/route.ts`
- **Page components** under `src/components/pages/*`
- Run `bun run lint` before committing

## Important Files

| File | Purpose |
|------|---------|
| `PRD.md` | Comprehensive Product Requirements Document (v7.0, 1700+ lines) |
| `worklog.md` | Development task log with agent activity |
| `prisma/schema.prisma` | Database schema definition |
| `src/lib/validations.ts` | Zod schemas for all API endpoints |
| `src/lib/openclaw.ts` | OpenClaw Gateway integration |
| `src/lib/demo.ts` | Demo/mock data generators |
| `src/store/*` | Zustand state stores |
| `proxy.ts` | NextAuth middleware replacement (Next.js 16) |
| `Caddyfile` | Caddy reverse proxy configuration |

## Known Issues & Limitations

1. **Prisma + Turbopack**: Prisma's native binary engine hangs in Turbopack API routes. Workaround: DB microservice on port 3005 with zero-dependency API routes that `fetch()` to it.
2. **Background processes**: Services die when shell session ends. Use `bun run dev:all` in a single session or use PM2/systemd for production.
3. **Demo mode**: `DEMO_MODE=true` returns mock data. Set to `false` for production with real database.
4. **Auth bypass**: `SKIP_AUTH=true` should only be used in development.

## VPS Deployment

- **VPS IP**: 76.13.176.142
- **OpenClaw Gateway**: https://operator.gangniaga.my
- Migration from SQLite → PostgreSQL is in progress
- MCP Proxy and A2A Agent Network being overhauled to use OpenClaw instead of localhost services

## Useful Resources

- **PRD**: See `PRD.md` for detailed feature requirements (FR-01 through FR-25)
- **Work Log**: See `worklog.md` for development history and completed tasks
- **shadcn/ui**: Components follow "new-york" style with CSS variables
- **Tailwind CSS v4**: Uses `@tailwindcss/postcss` with design tokens
