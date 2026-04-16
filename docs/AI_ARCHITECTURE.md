# AI Architecture

> OpenClaw Gateway integration, 8 AI agents, and intelligent automation for TheViralFinds.

> Reality check (15 April 2026):
> This file is a high-level integration guide. Verify exported helper names and fallback behavior in `src/lib/openclaw/**` before implementing against it, because some docs and code have drifted.

---

## Overview

TheViralFinds integrates with **OpenClaw Gateway** (`operator.gangniaga.my`) to provide AI-powered intelligence across 8 specialized agents. The integration consists of **6 core modules** in `src/lib/openclaw/`.

---

## OpenClaw Gateway

| Property | Value |
|----------|-------|
| **URL** | `https://operator.gangniaga.my` |
| **Protocol** | HTTP REST + WebSocket |
| **Authentication** | Bearer token (`OPENCLAW_GATEWAY_TOKEN`) |
| **Session Management** | `x-openclaw-session-key` header |
| **Local Binding** | `127.0.0.1:18789` (VPS only) |

### Gateway Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/chat/completions` | POST | AI chat completions |
| `/v1/models` | GET | List available models and tools |
| `/tools/invoke` | POST | Execute tool with args |
| `/sessions/spawn` | POST | Create sub-agent session |

**Important**: Model format must be `openclaw/<agentId>` (e.g., `openclaw/niagaresearch`). Never use `niaga-default`.

---

## 6-Module Architecture

```
src/lib/openclaw/
├── gateway-client.ts    # HTTP client with circuit breaker & retry
├── ws-client.ts         # WebSocket real-time client
├── tools.ts             # Tool discovery & invocation (25+ tools)
├── agents.ts            # Agent management & sub-agent orchestration
├── automation.ts        # Cron jobs, hooks, scheduled tasks
└── index.ts             # Barrel export (backward compatibility)
```

### 1. Gateway Client (`gateway-client.ts`)

HTTP client for communicating with OpenClaw Gateway.

**Features**:

- Circuit breaker pattern (fails fast when gateway is down)
- Automatic retry with exponential backoff
- Streaming response support
- Session key management

**Key Functions**:

```typescript
gatewayFetch(...)
checkOpenClawHealth(...)
openClawCompletion(...)
streamOpenClawCompletion(...)
getOpenClawModels(...)
```

### 2. WebSocket Client (`ws-client.ts`)

Real-time WebSocket connection for presence, health events, and agent activity.

**Features**:

- Lazy initialization through a WebSocket helper (verify the exact exported name in code)
- Auto-reconnect on disconnection
- Event listeners for agent activity
- Ping/pong health checks

**Events**:

- `agent:online` — Agent becomes available
- `agent:offline` — Agent disconnects
- `health:check` — Periodic ping
- `message:received` — New agent message

### 3. Tools (`tools.ts`)

Tool discovery and execution for 25+ registered tools.

**Discovery**:

```typescript
const tools = await discoverTools() // GET /v1/models
```

**Invocation**:

```typescript
const result = await invokeTool('calculator', 'estimate', { price: 100, commissionRate: 10 })
```

**Available Tools** (examples):

- `calculator` — Earnings estimation
- `trendAnalyzer` — Product trends
- `webReader` — Web page extraction
- `priceTracker` — Price monitoring
- `competitorAnalyzer` — Competition analysis
- `keywordResearch` — SEO keywords

### 4. Agents (`agents.ts`)

Management of 8 registered AI agents on VPS.

**Agent Registry**:

| Agent ID | Role | Specialization |
|----------|------|----------------|
| `main` (NiagaBot) | Primary orchestrator | Task routing, synthesis |
| `niagamarketing` | Marketing bot | Viral content, copy writing |
| `niagaresearch` | Research bot | Market research, trends |
| `niagaops` | Operations bot | System monitoring, alerts |
| `niagastrategist` | Strategy bot | Business strategy, planning |
| `niagacomputer` | Computation bot | Data analysis, calculations |
| `niagareporter` | Reporter bot | Report generation, summaries |
| `niagaaggregator` | Aggregator bot | Multi-agent synthesis |

**Sub-Agent Orchestration**:
Uses native `sessions_spawn` tool instead of manual pipeline loops.

```typescript
const session = await spawnSession('niagaresearch')
const result = await chatCompletion(messages, 'niagaresearch', session.key)
```

### 5. Automation (`automation.ts`)

Cron jobs, hooks, and scheduled task management.

**Features**:

- Cron job registration via OpenClaw
- Webhook execution (`/hooks/wake`, `/hooks/agent`)
- Scheduled report generation
- Periodic health checks

### 6. Index (`index.ts`)

Barrel export maintaining backward compatibility with all existing imports.

---

## SDK Fallback

When OpenClaw Gateway is unavailable, the system attempts to fall back to a local SDK implementation.

Current caution:

- Prompt-role fixes may already exist in parts of the codebase.
- The fallback path still needs verification because `src/lib/openclaw/tools.ts` currently imports `getSDK` from `gateway-client`, and that contract should be treated as unstable until fixed and tested.

---

## WebSocket Protocol

### Connection

```typescript
const ws = new WebSocket('wss://operator.gangniaga.my')
ws.on('open', () => console.log('Connected'))
ws.on('message', (data) => handleEvent(data))
ws.on('close', () => handleReconnect())
```

### Message Format

```json
{
  "type": "agent:message",
  "agentId": "niagaresearch",
  "sessionId": "session-123",
  "content": "Analysis complete...",
  "timestamp": "2026-04-12T10:00:00.000Z"
}
```

---

## API Integration

### OpenClaw Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/openclaw/discover` | GET | List available agents and tools |
| `/api/openclaw/ai-content` | POST | Generate AI content |
| `/api/openclaw/ai-insights` | POST | Get AI insights |
| `/api/openclaw/analyze` | POST | AI analysis |
| `/api/openclaw/stream` | POST | Streaming AI response |
| `/api/openclaw/trending` | POST | Trending products analysis |
| `/api/openclaw/competitor` | POST | Competitor analysis |
| `/api/openclaw/price-track` | POST | Price tracking |
| `/api/openclaw/web-reader` | POST | Web page analysis |
| `/api/openclaw/ai-keywords` | POST | Keyword research |
| `/api/openclaw/smart-scheduler` | POST | AI scheduling |
| `/api/openclaw/hooks` | POST | Execute webhook |
| `/api/openclaw/cron` | GET/POST/DELETE | Cron job management |
| `/api/openclaw/mcp-proxy` | GET/POST | MCP tool access |
| `/api/openclaw/a2a-proxy` | GET/POST | A2A protocol proxy |
| `/api/openclaw/ws-status` | GET | WebSocket connection status |

### Rate Limits

| Tier | Limit | Routes |
|------|-------|--------|
| AI | 10 req/min | All `/api/openclaw/*` routes |

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Gateway timeout | Network issue | Retry with exponential backoff |
| Invalid agent ID | Typo in agent name | Use `discoverAgents()` to list valid IDs |
| Session expired | Session TTL exceeded | Create new session via `spawnSession()` |
| Tool not found | Tool unregistered | Check tool list via `discoverTools()` |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_GATEWAY_URL` | `https://operator.gangniaga.my` | Gateway HTTP endpoint |
| `OPENCLAW_GATEWAY_TOKEN` | *(required)* | Bearer authentication token |
| `OPENCLAW_WS_ENABLED` | `true` | Enable WebSocket connection |
| `OPENCLAW_HOOKS_PATH` | `/hooks` | Webhook execution path |
| `OPENCLAW_GATEWAY_PROXY_URL` | `https://api.gangniaga.my/openclaw` | Proxy endpoint |

---

*Last updated: 15 April 2026*
