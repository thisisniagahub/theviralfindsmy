# Testing

> Vitest framework configuration, current coverage, and testing strategy for TheViralFinds.

> Reality check (15 April 2026):
> Exact test counts and coverage numbers drift quickly. Use `bun run test`, `bun run test:coverage`, and `rg --files -g "*test.ts" -g "*test.tsx"` to confirm the current suite before making planning decisions.

---

## Overview

- **Framework**: Vitest v4.1.4
- **Test Runner**: `bun run test`
- **Watch Mode**: `bun run test:watch`
- **Coverage**: `bun run test:coverage`
- **Current Reality**: The suite now includes utility tests, gateway-client tests, a DB-service test file, and a broad API smoke test file, but live-mode coverage is still not strong enough.
- **Target Coverage**: First reach meaningful live-mode coverage on auth, DB service, and top routes; then push toward 70%+.

---

## Configuration

Located in `vitest.config.ts` (or `vite.config.ts`):

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
```

---

## Current Test Files (verified 15 April 2026)

| File | Tests | Description |
|------|-------|-------------|
| `mini-services/db-service/index.test.ts` | Varies | DB service contract coverage |
| `src/app/api/api-routes.test.ts` | Varies | Broad API smoke coverage |
| `src/lib/cache.test.ts` | Varies | Cache helper coverage |
| `src/lib/env.test.ts` | Varies | Environment validation coverage |
| `src/lib/get-user-id.test.ts` | Varies | User ID extraction helper coverage |
| `src/lib/openclaw/gateway-client.test.ts` | Varies | Gateway client behavior coverage |
| `src/lib/rate-limit.test.ts` | Varies | Rate limiting helper coverage |
| `src/lib/redis.test.ts` | Varies | Redis helper coverage |
| `src/lib/service-urls.test.ts` | Varies | Service URL helper coverage |
| `src/lib/validations.test.ts` | Varies | Zod validation coverage |

Use the commands above for the exact current count.

---

## Target Coverage Strategy

Short-term goal:

- protect live-mode auth/session behavior
- protect DB-service route contracts
- protect the highest-traffic API routes

Long-term goal:

- move toward 70%+ only after priority live paths are covered well

### Priority Test Areas

#### 1. DB Service Endpoints (Critical)

**File**: `mini-services/db-service/index.test.ts`  
**Current**: 0%  
**Target**: 15+ tests

Test all 17+ DB Service endpoints:

- `GET /health` — Health check
- `GET /dashboard/stats` — Dashboard analytics
- `GET /links` — List links with filters
- `POST /links` — Create link (valid/invalid)
- `PUT /links/[id]` — Update link
- `DELETE /links/[id]` — Delete link
- `GET /campaigns` — List campaigns
- `POST /campaigns` — Create campaign
- `GET /notifications` — List notifications
- `PUT /notifications` — Mark all read
- `GET /payouts` — List payouts
- `POST /payouts` — Create payout
- `GET /goals` — List goals
- `POST /goals` — Create goal
- `GET /settings` — Get settings
- `PUT /settings` — Update settings
- `GET /activity` — Activity feed

#### 2. OpenClaw Gateway Client

**File**: `src/lib/openclaw/gateway-client.test.ts`  
**Current**: 0%  
**Target**: 10+ tests

Test gateway client functionality:

- Circuit breaker trip on 5 failures
- Retry with exponential backoff
- Streaming response handling
- Session key management
- Error handling (timeout, network error)

#### 3. Top 20 API Routes

**Files**: `src/app/api/**/route.test.ts`  
**Current**: 0%  
**Target**: 40+ tests (2 tests per route)

Priority routes:

1. `/api/links` (GET, POST)
2. `/api/links/[id]` (GET, PUT, DELETE)
3. `/api/campaigns` (GET, POST)
4. `/api/dashboard` (GET)
5. `/api/payouts` (GET, POST)
6. `/api/goals` (GET, POST)
7. `/api/settings` (GET, PUT)
8. `/api/notifications` (GET, PUT)
9. `/api/openclaw/ai-content` (POST)
10. `/api/auth/[...nextauth]` (POST — login)

#### 4. Auth Flow

**File**: `src/app/api/auth/[...nextauth]/route.test.ts`  
**Current**: 0%  
**Target**: 5+ tests

Test authentication:

- Valid login returns user
- Invalid login returns null
- OAuth allowlist enforcement
- JWT token includes userId
- Session includes userId

---

## Mock Strategy

### DB Service Mock

```typescript
export function mockDbServiceFetch(url: string, options?: RequestInit) {
  // Return mock responses based on URL pattern
  if (url.includes('/health')) {
    return Response.json({ status: 'healthy', links: 150 })
  }
  if (url.includes('/links')) {
    return Response.json({ links: [], campaigns: [], pagination: { total: 0 } })
  }
  // ... more mocks
}
```

### OpenClaw Gateway Mock

```typescript
export function mockGatewayChatCompletion(messages: any[]) {
  return {
    choices: [{
      message: {
        role: 'assistant',
        content: 'Mock AI response'
      }
    }]
  }
}
```

### NextAuth Session Mock

```typescript
export const mockSession = {
  user: {
    id: 'user-123',
    email: 'admin@theviralfinds.my',
    name: 'Ahmad Ali'
  },
  expires: '2026-12-31T23:59:59.000Z'
}
```

### Test Data Fixtures

```typescript
export const testData = {
  link: {
    id: 'clx123',
    name: 'Gaming Mouse',
    productUrl: 'https://shopee.com.my/product/123',
    affiliateUrl: 'https://shopee.com.my/affiliate/123',
    shortCode: 'link-abc123',
    status: 'active',
    clicks: 150,
    conversions: 5,
    earnings: 25.50
  },
  campaign: {
    id: 'cmp123',
    name: 'Electronics Sale',
    status: 'active',
    budget: 1000
  },
  user: {
    id: 'user-123',
    email: 'admin@theviralfinds.my',
    role: 'ADMIN'
  }
}
```

---

## Running Tests

```bash
# Run all tests
bun run test

# Watch mode (re-runs on file changes)
bun run test:watch

# Run with coverage
bun run test:coverage

# Run specific test file
bun run test src/lib/validations.test.ts

# Run tests matching pattern
bun run test -t "validation"
```

---

## Test Structure Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createLinkSchema } from './validations'

describe('createLinkSchema', () => {
  it('should validate complete link data', () => {
    const data = {
      name: 'Gaming Mouse',
      productUrl: 'https://shopee.com.my/product/123',
      affiliateUrl: 'https://shopee.com.my/affiliate/123',
      commission: 10,
      status: 'active' as const
    }
    const result = createLinkSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const data = { name: '', productUrl: 'https://example.com' }
    const result = createLinkSchema.safeParse(data)
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toBe('Name is required')
  })

  it('should reject invalid URL', () => {
    const data = { name: 'Test', productUrl: 'not-a-url' }
    const result = createLinkSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})
```

---

## Coverage Goals by Module

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| `src/lib/validations.ts` | 50% | 90% | High |
| `src/lib/rate-limit.ts` | 60% | 90% | High |
| `src/lib/cache.ts` | 80% | 90% | Medium |
| `src/lib/env.ts` | 0% | 80% | High |
| `mini-services/db-service/index.ts` | 0% | 80% | Critical |
| `src/lib/openclaw/gateway-client.ts` | 0% | 80% | High |
| `src/app/api/links/route.ts` | 0% | 70% | High |
| `src/app/api/campaigns/route.ts` | 0% | 70% | Medium |
| `src/app/api/dashboard/route.ts` | 0% | 70% | Medium |
| `src/app/api/openclaw/**` | 0% | 60% | Medium |

---

## Continuous Integration

If `.github/workflows/ci.yml` exists in the repo, tests should run in CI. Verify the actual workflow file rather than assuming the automation is active:

```yaml
# .github/workflows/ci.yml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v1
    - run: bun install
    - run: bun run db:generate
    - run: bun run test
```

---

*Last updated: 15 April 2026*
