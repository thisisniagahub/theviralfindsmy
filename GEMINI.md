# TheViralFinds: Shopee Affiliate Management System

## Project Overview
TheViralFinds is a comprehensive Shopee Affiliate Management System designed for content creators and marketers. It provides a unified dashboard for link management, real-time analytics, campaign tracking, and AI-powered intelligence tools.

The application features a unique "Pixel RPG Office" utilizing Phaser 3 for an interactive workspace experience with AI agents. It is currently undergoing a major architecture migration to utilize PostgreSQL and the OpenClaw Gateway for AI capabilities.

## Technology Stack
- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** PostgreSQL (via Prisma ORM)
- **State Management:** Zustand + TanStack Query
- **Authentication:** NextAuth.js v4 (Credentials Provider)
- **Real-time:** Socket.IO
- **Game Engine:** Phaser 3 (for the Agent Office)
- **AI Integration:** z-ai-web-dev-sdk + OpenClaw Gateway

## Architecture
- **Frontend Layer:** Next.js SPA with server components, glassmorphism UI, and Framer Motion animations.
- **API Layer:** 40+ REST API routes protected by NextAuth middleware, utilizing Zod for robust input validation.
- **Database Layer:** Prisma ORM managing 8 core models (AffiliateLink, Campaign, ClickRecord, Conversion, etc.).
- **Real-time Layer:** A dedicated Socket.IO notification service.
- **AI Layer:** OpenClaw Gateway for executing Model Context Protocol (MCP) commands and running Agent-to-Agent (A2A) chained pipelines.

## Building and Running

The project uses `bun` as its primary package manager and runtime.

### Key Scripts
- **Start All Development Services:** `bun run dev:all` (Concurrently runs DB service, notification service, and the Next.js app)
- **Start Next.js Only:** `bun run dev`
- **Build for Production:** `bun run build`
- **Linting:** `bun run lint`

### Database Commands (Prisma)
- **Generate Client:** `bun run db:generate`
- **Push Schema:** `bun run db:push`
- **Migrate Dev:** `bun run db:migrate`
- **Reset DB:** `bun run db:reset`

## Development Conventions
- **Component Design:** Prefer using pre-built `shadcn/ui` components located in `src/components/ui/`.
- **Styling:** Utilize the custom CSS utility library (e.g., `.glass-card`, `.text-gradient-shopee`) and adhere to the established design system.
- **API Validation:** All POST/PUT API endpoints must strictly validate incoming data using Zod schemas.
- **Error Handling:** Use React Error Boundaries for UI failures and return consistent `{ error: string, details?: any }` JSON responses from APIs.
- **State Management:** Use Zustand for lightweight client state and TanStack Query for server state caching.
- **Environment Variables:** Never commit `.env` files. Ensure all secrets (e.g., `DATABASE_URL`, `OPENCLAW_GATEWAY_TOKEN`) are properly configured.
