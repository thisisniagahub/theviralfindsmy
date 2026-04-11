# Repository Guidelines

## Project Structure & Module Organization
This repo is a Next.js 16 + React 19 app using the App Router. Main application code lives in `src/`: routes and API handlers in `src/app`, reusable UI in `src/components`, hooks in `src/hooks`, shared utilities in `src/lib`, and Zustand state in `src/store`. Database schema and seeds live in `prisma/`. Static assets live in `public/`, including product art and `public/shopee-office/` game assets. Local support services live in `mini-services/db-service` and `mini-services/notification-service`. Treat `examples/` as reference code, not production code.

## Build, Test, and Development Commands
Use Bun at the repo root.

- `bun install`: install dependencies and trigger `prisma generate`.
- `bun run dev`: start the Next.js app on `http://localhost:3000`.
- `bun run dev:all`: run the app plus both local mini-services.
- `bun run lint`: run ESLint across the repo.
- `bun run build`: produce a production build.
- `bun run db:push` / `bun run db:migrate`: sync or migrate the PostgreSQL schema.
- `bun run db:reset`: reset local Prisma migrations.

## Coding Style & Naming Conventions
TypeScript is `strict`, with the `@/*` path alias mapped to `src/*`. Follow the existing style: 2-space indentation, single quotes, and no semicolons. Use PascalCase for React components, camelCase for functions and store actions, and kebab-case for route segments and many file names such as `dashboard-page.tsx` or `service-urls.ts`. Keep API handlers in `src/app/api/**/route.ts` and colocate page-specific UI under `src/components/pages/*`. Run `bun run lint` before opening a PR.

## Testing Guidelines
There is no dedicated automated test suite committed yet. For now, the minimum verification bar is `bun run lint`, `bun run build`, and a manual smoke test of the affected flows. If you add tests, prefer colocated `*.test.ts` or `*.spec.tsx` files near the feature and focus on API logic, store behavior, and high-risk UI flows.

## Commit & Pull Request Guidelines
Recent history mostly follows Conventional Commits such as `feat:` and `fix:`; keep using that format and write clear, scoped summaries. Pull requests should include a short description, impacted areas, any env or Prisma schema changes, and manual verification steps. Add screenshots or short recordings for UI changes, especially under `src/components/pages` or `src/components/shopee-office`.

## Security & Configuration Tips
Start from `.env.example` and keep secrets out of Git. `DATABASE_URL`, `NEXTAUTH_SECRET`, and service tokens must stay local or in Vercel env vars. Set `SKIP_AUTH=false` and `DEMO_MODE=false` outside development.
