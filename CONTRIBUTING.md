# Contributing to TheViralFinds

`AGENTS.md` and `ROADMAP.md` are the primary contribution context. If this file conflicts with them, follow those files and the current codebase.

## Development Setup

1. Follow the [Quick Start](#-quick-start) in README.md
2. Ensure all 3 services are running: `bun run dev:all`
3. Read `AGENTS.md` and `ROADMAP.md` before large changes

## Branch Strategy

- `main` — Default branch unless the repo workflow says otherwise
- `feature/*` — New features
- `fix/*` — Bug fixes
- `docs/*` — Documentation changes

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user model with multi-tenancy
fix: remove Math.random() from production DB service
docs: update API reference with new endpoints
refactor: migrate rate limiter to Redis
test: add integration tests for link CRUD
chore: update dependencies
```

## Pull Request Process

1. Create feature branch from `develop`
2. Make changes following coding conventions
3. Run checks: `bun run lint && bun run build && bun run test`
4. Update relevant docs in `docs/` if architecture changes
5. Update `ROADMAP.md` and `CHANGELOG.md` when the work changes source-of-truth status
6. Submit PR with description, impacted areas, and screenshots for UI changes

## Coding Conventions

- **TypeScript strict mode** — no `any` unless absolutely necessary
- **2-space indentation**, single quotes, no semicolons
- **PascalCase** for React components
- **camelCase** for functions and store actions
- **kebab-case** for route segments and file names
- **Zod validation** on all POST/PUT API endpoints
- **Never import PrismaClient in Next.js** — use DB service
- **Prefer existing route contracts** — verify `src/app/api/**` and `mini-services/db-service/index.ts` before changing docs or clients

## Code Review Standards

- All PRs require at least 1 review
- Check for security issues (no secrets in code, proper auth)
- Verify Zod schemas match API contract
- Ensure error responses follow `{ error, details }` format
