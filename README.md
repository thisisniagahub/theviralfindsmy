<div align="center">

# 🛍️ TheViralFinds

### Shopee Affiliate Management System

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)

A comprehensive affiliate link management platform with AI-powered intelligence, real-time analytics, and a Pixel RPG Agent Office.

</div>

---

## ✨ Features

- **Link Management** — Create, track, and optimize Shopee affiliate links with QR codes and sharing
- **Real-time Analytics** — Dashboard with clicks, conversions, earnings, and geographic data
- **Campaign Tracking** — Group links into campaigns with budget management
- **AI Intelligence** — 8 specialized AI agents via OpenClaw Gateway for marketing, research, and ops
- **Agent Office** — Interactive Phaser 3 pixel RPG workspace with NPC agents
- **Payout Management** — Track earnings, set goals, request payouts
- **Multi-Merchant Ready** — Extensible to Lazada, TikTok Shop, Amazon

## 🚀 Quick Start

```bash
# Prerequisites: Bun, Node.js 18+, PostgreSQL 16

# Install
bun install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL, NEXTAUTH_SECRET, etc.

# Database
bun run db:generate
bun run db:push

# Start all services (Next.js + DB Service + Notification Service)
bun run dev:all

# Or start Next.js only
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

3-process architecture (Prisma + Turbopack workaround):

| Process | Port | Role |
|---------|------|------|
| Next.js App | 3000 | Frontend + API routes |
| DB Service | 3005 | Prisma database operations |
| Notification Service | 3004 | Socket.IO real-time events |

→ Start with [docs/MASTER_STRUCTURE.md](docs/MASTER_STRUCTURE.md) for the fastest system map, then open [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for deeper detail.

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router (69+ API routes)
├── components/       # React components (ui/, pages/, shopee-office/)
├── hooks/            # Custom React hooks
├── lib/              # Utilities (openclaw/, validations, rate-limit)
└── store/            # Zustand state management
mini-services/
├── db-service/       # Bun.serve() + Prisma (port 3005)
└── notification-service/  # Bun.serve() + Socket.IO (port 3004)
docs/                 # Detailed documentation
prisma/               # Database schema + migrations
```

## 🤖 AI Integration

8 AI agents via [OpenClaw Gateway](https://operator.gangniaga.my):

| Agent | Role |
|-------|------|
| NiagaBot | Primary orchestrator |
| NiagaMarketingBot | Viral content & copy |
| NiagaResearchBot | Market research & trends |
| NiagaOpsBot | System monitoring |
| NiagaStrategistBot | Business strategy |
| NiagaComputerBot | Computation & data |
| NiagaReporterBot | Report generation |
| NiagaAggregatorBot | Multi-agent synthesis |

→ See [docs/AI_ARCHITECTURE.md](docs/AI_ARCHITECTURE.md) for integration details.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Current Mindmap](docs/CURRENT_MINDMAP.md) | Full current-state visual map of runtime, modules, APIs, data |
| [Master Structure](docs/MASTER_STRUCTURE.md) | Single-entry runtime map: system, modules, flows |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | System design, data flow, invariants |
| [ROADMAP](ROADMAP.md) | Current execution roadmap and next implementation queue |
| [API Reference](docs/API_REFERENCE.md) | 69+ endpoints with schemas |
| [Database](docs/DATABASE.md) | 8 models, ERD, migration history |
| [Security](docs/SECURITY.md) | Auth, headers, known issues |
| [AI Architecture](docs/AI_ARCHITECTURE.md) | OpenClaw integration, 8 agents |
| [Computer Use (Windows POC)](docs/COMPUTER_USE_WINDOWS.md) | Local OpenAI desktop-control prototype architecture |
| [Deployment](docs/DEPLOYMENT.md) | VPS setup, nginx, PM2 |
| [Testing](docs/TESTING.md) | Vitest config, coverage goals |
| [Runbook](docs/RUNBOOK.md) | Operational procedures |
| [Implementation Plan](IMPLEMENTATION_PLAN.md) | P0-P3 roadmap (v11.0) |

## 📋 Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Next.js dev server |
| `bun run dev:all` | Start all 3 services |
| `bun run build` | Production build |
| `bun run lint` | ESLint check |
| `bun run test` | Run Vitest |
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:push` | Push schema to DB |
| `bun run db:migrate` | Create migration |
| `bun run db:reset` | Reset database |

## 🗺 Roadmap

> 5 AI agents reviewed the project on 12 April 2026. Average score: **65/100 (C+)**.

| Phase | Task | Status |
|-------|------|--------|
| P0 | Fix Math.random() in production DB | ⬜ |
| P0 | Security Headers (CSP, HSTS) | ✅ |
| P0 | Admin email env var (no hardcoded) | ✅ |
| P0 | DB Service Auth Hardening | ⬜ |
| P0 | User Model + Multi-Tenancy | ⬜ |
| P1 | Redis for Cache + Rate Limiting | ⬜ |
| P1 | Test Suite (70%+ coverage) | ⬜ |
| P2 | CDN for Game Assets | ⬜ |
| P3 | Multi-Merchant Support | ⬜ |

→ See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for detailed sprint breakdown.

## 📄 License

MIT — see [LICENSE.md](LICENSE.md)
