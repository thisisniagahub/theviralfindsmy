# Complete Data Flow

> End-to-end data flow map for TheViralFinds.
>
> Last verified against code on 15 April 2026.

---

## What this file answers

This file shows:

- where data starts
- which layer processes it
- whether it goes to DB service, OpenClaw, Shopee, or in-memory logic
- what comes back to the browser

Use this when you want the full flow, not just folder structure.

---

## Big-picture flow

```text
User / Browser
  ->
Next.js App (:3000)
  ->
  - Pages
  - Components
  - Hooks
  - API Routes
  - Auth / Middleware

Next.js API Routes
  -> DB Service (:3005) -> PostgreSQL
  -> OpenClaw Gateway
  -> Shopee APIs
  -> Notification Service (:3004) [browser realtime path]
  -> Local in-memory or special-case logic for a few routes

Response
  ->
Next.js JSON / redirect / SSE stream
  ->
Browser UI updates
```

---

## Data flow mindmap

```mermaid
mindmap
  root((TheViralFinds Data Flow))
    Browser
      Dashboard pages
      Forms and actions
      EventSource SSE
      Socket.IO notifications
    Next.js App :3000
      App Router pages
      API routes
      Middleware
      NextAuth session
      Components hooks store
    Protected live data
      requireAuth
      authenticatedDbFetch
      DB Service :3005
      PostgreSQL
    AI data
      OpenClaw routes
      src/lib/openclaw
      OpenClaw Gateway
    External commerce data
      Shopee routes
      src/lib/shopee
      Shopee APIs
    Realtime
      Notification Service :3004
      Shopee Office SSE
    Special-case routes
      redirect shortCode
      profile mock or in-memory
      health
```

---

## 1. Standard protected DB flow

This is the main live flow for dashboard, links, campaigns, payouts, goals, notifications, settings, and similar resources.

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant N as Next.js API route
    participant A as requireAuth / session
    participant H as authenticatedDbFetch
    participant D as DB Service
    participant P as PostgreSQL

    U->>B: Open page or trigger action
    B->>N: Request /api/dashboard or /api/links
    N->>A: Read NextAuth session
    A-->>N: user.id, email, role
    N->>H: Build DB request with Bearer + x-user-id
    H->>D: HTTP request to :3005
    D->>P: Prisma query
    P-->>D: rows / aggregates
    D-->>N: JSON response
    N-->>B: shaped JSON
    B-->>U: UI updates
```

### Actual code path

```text
Browser
  -> src/app/(dashboard)/*
  -> client fetch to /api/*
  -> src/app/api/*/route.ts
  -> src/lib/api-auth.ts
  -> mini-services/db-service/index.ts
  -> prisma/schema.prisma backed tables in PostgreSQL
```

### Main route families that follow this pattern

- `/api/dashboard`
- `/api/links`
- `/api/campaigns`
- `/api/payouts`
- `/api/goals`
- `/api/notifications`
- `/api/settings`
- `/api/referral`

### Important note

This is the intended safe live path.
Some routes still drift from it and are tracked in `ROADMAP.md`, especially around auth/session shaping and missing DB endpoints.

---

## 2. AI and OpenClaw flow

This is the path for AI content generation, insights, analysis, tool use, and agent features.

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant N as Next.js OpenClaw route
    participant A as requireAuth
    participant O as src/lib/openclaw/*
    participant G as OpenClaw Gateway

    U->>B: Submit AI request
    B->>N: POST /api/openclaw/* or AI route
    N->>A: Validate session
    A-->>N: user identity
    N->>O: gateway-client / tools / agents helper
    O->>G: REST or streaming request
    G-->>O: AI result / tool result / agent response
    O-->>N: normalized data
    N-->>B: JSON or stream
    B-->>U: AI output
```

### Actual code path

```text
Browser
  -> /api/openclaw/* or AI routes like /api/openclaw/ai-content
  -> src/lib/api-auth.ts
  -> src/lib/openclaw/gateway-client.ts
  -> src/lib/openclaw/tools.ts
  -> src/lib/openclaw/agents.ts
  -> OpenClaw Gateway
```

### Example

`/api/openclaw/ai-content`:

- checks `requireAuth()`
- rate-limits the request
- tries MCP tool execution first
- falls back to `openClawCompletion()`
- returns generated content to the browser

---

## 3. External Shopee API flow

This is the path for fetching Shopee products, shop info, affiliate data, AMS data, and related external commerce information.

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant N as Next.js Shopee route
    participant S as src/lib/shopee/*
    participant X as Shopee APIs

    U->>B: Request product or shop data
    B->>N: GET /api/shopee/* or /api/products/search
    N->>S: Call Shopee helper client
    S->>X: External API request
    X-->>S: Partner or affiliate payload
    S-->>N: normalized result
    N-->>B: JSON response
    B-->>U: UI updates
```

### Actual code path

```text
Browser
  -> src/app/api/shopee/* or src/app/api/products/search
  -> src/lib/shopee/index.ts
  -> src/lib/shopee/*.ts clients
  -> Shopee external APIs
```

### Example

`/api/shopee/products`:

- checks whether Shopee config exists
- reads query params like `ids`, `offset`, `pageSize`
- calls product helper functions in `src/lib/shopee`
- returns raw product data plus derived `boostScore`

---

## 4. Notification realtime flow

This is separate from the DB service. It is a realtime transport path used directly by the browser.

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant N as Notification Service

    U->>B: Open app
    B->>N: Socket.IO connect to :3004
    N-->>B: connected event
    N-->>B: notification events
    B-->>U: realtime UI notification
```

### Actual code path

```text
Browser
  <-> mini-services/notification-service/index.ts
```

### Current reality

- service exists and streams events
- current implementation is mock-generated, not a persisted notification bus

---

## 5. Shopee Office SSE flow

This is a different realtime path from Socket.IO.
It uses `EventSource` and server-sent events.

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser hook
    participant S as /api/shopee-office/sse
    participant A as /api/shopee-office/agents

    U->>B: Open Shopee Office
    B->>S: EventSource connect
    S-->>B: initial stream
    S->>A: background fetch every 3s
    A-->>S: latest agent state
    S-->>B: stream updated agents
    B-->>U: office/game UI updates
```

### Actual code path

```text
Browser
  -> src/hooks/use-office-sse.ts
  -> /api/shopee-office/sse
  -> background self-fetch to /api/shopee-office/agents
  -> streamed events back to browser
```

### Current risk

- background sync currently fetches the agents route without forwarding auth
- this is one of the roadmap repair items

---

## 6. Public redirect flow

This is the short-link path used when someone opens an affiliate short code.

```mermaid
sequenceDiagram
    participant U as Visitor
    participant N as /api/redirect/[shortCode]
    participant D as DB Service
    participant X as Shopee affiliate URL

    U->>N: Open short link
    N->>D: Fetch redirect target by shortCode
    D-->>N: redirectUrl or error
    N->>N: Validate allowed Shopee domain
    N-->>U: 307 redirect
    U->>X: Land on affiliate target
```

### Actual code path

```text
/api/redirect/[shortCode]
  -> DB Service /redirect/:shortCode
  -> allowlist validation
  -> HTTP 307 redirect
```

---

## 7. Profile special-case flow

This route does not currently follow the normal live DB-backed model.

```mermaid
sequenceDiagram
    participant U as User
    participant N as /api/profile
    participant M as In-memory Map

    U->>N: GET /api/profile
    N-->>U: mock profile payload

    U->>N: POST /api/profile
    N->>N: requireAuth
    N->>M: save profile by publicSlug
    M-->>N: stored in process memory
    N-->>U: success response
```

### Current reality

- GET returns mock profile data
- POST stores to in-memory `Map`
- data does not survive restart
- middleware currently treats `/api/profile` as public

---

## 8. Where to see the full data picture

If you want the most complete view, open these in order:

1. [MASTER_STRUCTURE.md](./MASTER_STRUCTURE.md)
2. [COMPLETE_DATA_FLOW.md](./COMPLETE_DATA_FLOW.md)
3. [API_REFERENCE.md](./API_REFERENCE.md)
4. [DATABASE.md](./DATABASE.md)
5. [../ROADMAP.md](../ROADMAP.md)
6. [../prisma/schema.prisma](../prisma/schema.prisma)

If you want real database rows:

```bash
bunx prisma studio
```

---

## 9. Fast summary

```text
Most business data:
Browser -> Next.js API -> DB Service -> PostgreSQL -> Next.js -> Browser

AI data:
Browser -> Next.js API -> OpenClaw helpers -> OpenClaw Gateway -> Browser

Shopee data:
Browser -> Next.js API -> src/lib/shopee -> Shopee APIs -> Browser

Realtime notifications:
Browser <-> Notification Service

Realtime office state:
Browser -> SSE route -> self-fetch agents route -> Browser

Special-case route:
/api/profile still uses mock + in-memory behavior
```

---

*Last updated: 15 April 2026*
