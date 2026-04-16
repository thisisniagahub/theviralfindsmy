# Agent Town Improvements

> Review Date: 2026-04-16
> Reviewer: Claude Code
> Scope: OpenClaw Gateway Integration & Architecture

---

## 🔴 Critical (P0)

### 1. Token Exposure via NEXT_PUBLIC_
**File:** `lib/hooks/useGateway.ts:18`

**Issue:**
```typescript
const DEFAULT_TOKEN = process.env.NEXT_PUBLIC_GATEWAY_TOKEN ?? ""
```

`NEXT_PUBLIC_` variables are bundled into client-side JavaScript and visible to anyone who inspects the page source.

**Impact:** Gateway token exposed to public, allowing unauthorized access.

**Solution:**
- Option A: Proxy through server-side API route
  ```typescript
  // Create /api/gateway-token route that returns token (with auth check)
  // Client fetches token from this route instead of env var
  ```
- Option B: Use HTTP-only cookie for token storage
- Option C: Remove token requirement for read-only operations

**Estimated Effort:** 2-3 hours

---

### 2. Memory Leak in Bubble Accumulator
**File:** `lib/gateway-handler.ts:356-359`, `lib/gateway-handler.ts:64-68`

**Issue:**
```typescript
// bubbleAccum stores accumulated text per runId
refs.bubbleAccum.set(runId, accum)

// Only cleaned up on lifecycle end/error, but:
// 1. No cleanup if runId never receives lifecycle end
// 2. No size limit on Map
```

**Impact:** Long-running sessions accumulate orphaned entries in `bubbleAccum` and `runActors` Maps.

**Solution:**
```typescript
// Add periodic cleanup + size limit
const MAX_ACCUM_ENTRIES = 100
function cleanupRun(refs: HandlerRefs, runId: string) {
  refs.seenStarts.delete(runId)
  refs.bubbleAccum.delete(runId)  // Already exists
  refs.stoppedRunIds.delete(runId)
  clearBubbleTimer(refs, runId)
  refs.runActors.delete(runId)  // ADD THIS
}

// Add periodic cleanup for stale entries
setInterval(() => {
  if (refs.bubbleAccum.size > MAX_ACCUM_ENTRIES) {
    // Remove oldest entries
  }
}, 60000)
```

**Estimated Effort:** 1 hour

---

## 🟡 High Priority (P1)

### 3. Missing Heartbeat/Ping Mechanism
**File:** `lib/gateway.ts`

**Issue:** No explicit heartbeat to detect half-open connections. Relies solely on TCP keepalive which may not detect dropped connections promptly.

**Impact:** "Zombie" connections where client thinks it's connected but gateway has closed the socket.

**Solution:**
```typescript
// In GatewayClient class
private heartbeatTimer: ReturnType<typeof setInterval> | null = null
private lastPongTime = 0

private startHeartbeat() {
  this.heartbeatTimer = setInterval(() => {
    if (this.ws?.readyState === WebSocket.OPEN) {
      // Send ping frame or custom ping message
      this.ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }))
      
      // Check for timeout
      if (Date.now() - this.lastPongTime > 60000) {
        this.ws.close()
        this.setStatus("error")
      }
    }
  }, 30000)
}
```

**Estimated Effort:** 2 hours

---

### 4. Reconnection Race Condition
**File:** `lib/gateway.ts:172-199`

**Issue:** Multiple overlapping reconnection attempts possible if `connectOnce()` fails fast and triggers `onclose` before timer guard checks.

**Current:**
```typescript
scheduleReconnect(wasConnected: boolean) {
  if (this.reconnectTimer) return  // Not enough guard
  // ... can still have race condition
}
```

**Solution:**
```typescript
private reconnecting = false

private scheduleReconnect(wasConnected: boolean) {
  if (this.reconnectTimer || this.reconnecting) return
  
  this.reconnecting = true  // ADD THIS FLAG
  
  this.reconnectTimer = setTimeout(() => {
    this.reconnectTimer = null
    if (!this.autoReconnect || this.intentionalClose) {
      this.reconnecting = false
      return
    }
    this.connectOnce()
      .catch(() => {})
      .finally(() => {
        this.reconnecting = false  // Reset flag
      })
  }, delay)
}
```

**Estimated Effort:** 30 minutes

---

### 5. Silent JSON Parse Errors
**File:** `lib/gateway.ts:124-128`

**Issue:**
```typescript
try {
  frame = JSON.parse(typeof ev.data === "string" ? ev.data : "{}")
} catch {
  return  // Silent drop
}
```

**Impact:** Invalid messages are silently dropped without logging, making debugging difficult.

**Solution:**
```typescript
try {
  frame = JSON.parse(typeof ev.data === "string" ? ev.data : "{}")
} catch (err) {
  log.error("Failed to parse gateway message:", ev.data, err)
  return
}
```

**Estimated Effort:** 15 minutes

---

## 🟢 Medium Priority (P2)

### 6. Request Timeout Timer Leak
**File:** `lib/gateway.ts:341-346`

**Issue:** Timer created but only cleared when response arrives. If request hangs indefinitely, timer keeps running.

**Current:**
```typescript
const timer = setTimeout(() => {
  this.pending.delete(id)
  reject(new Error(`Timeout: ${method}`))
}, timeoutMs)

this.pending.set(id, { resolve, reject, timer })
// Timer should be cleared when resolved
```

**Fix in `handleFrame`:**
```typescript
if (frame.type === "res" && frame.id) {
  const pending = this.pending.get(frame.id)
  if (pending) {
    clearTimeout(pending.timer)  // Ensure cleanup
    // ... rest of handler
  }
}
```

**Estimated Effort:** 15 minutes

---

### 7. No Rate Limit Backoff
**File:** `lib/gateway.ts:180-183`

**Issue:** When receiving `rate_limited` error, client marks as terminal state without retry logic.

**Solution:**
```typescript
// Add rate limit specific handling with exponential backoff
if (this._status === "rate_limited") {
  // Implement special retry with backoff
  const rateLimitDelay = this.calculateRateLimitBackoff()
  setTimeout(() => this.scheduleReconnect(true), rateLimitDelay)
}
```

**Estimated Effort:** 1 hour

---

### 8. Session Queue Memory Growth
**File:** `lib/hooks/useTaskRouter.ts:27-30`

**Issue:** `sessionQueueRef` is a Map that grows unbounded if sessions are never drained.

**Solution:** Add cleanup for abandoned sessions:
```typescript
// Cleanup abandoned queues after timeout
setInterval(() => {
  for (const [sessionKey, queue] of sessionQueueRef.current) {
    if (queue.length === 0) {
      sessionQueueRef.current.delete(sessionKey)
    }
  }
}, 300000) // Every 5 minutes
```

**Estimated Effort:** 30 minutes

---

## 🟦 Low Priority (P3)

### 9. Add Connection Metrics
**File:** New feature

**Suggestion:** Track and expose connection health metrics:
- Connection duration
- Reconnection count
- Message latency (ping/pong round-trip)
- Failed request rate

**Use Case:** HUD could show connection quality indicator.

**Estimated Effort:** 3 hours

---

### 10. Implement Request Deduplication
**File:** `lib/hooks/useTaskRouter.ts`

**Suggestion:** Current `idempotencyKey` is sent to gateway but client-side doesn't prevent duplicate submissions during network flapping.

**Solution:**
```typescript
const pendingSubmissions = new Set<string>()

function sendTaskToGateway(taskId: string, ...) {
  if (pendingSubmissions.has(taskId)) return
  pendingSubmissions.add(taskId)
  
  // ... send request
  
  .finally(() => {
    pendingSubmissions.delete(taskId)
  })
}
```

**Estimated Effort:** 1 hour

---

### 11. Better Error Messages for Users
**File:** `lib/gateway-handler.ts`

**Current:**
```typescript
log.error("session metrics refresh failed:", error)
```

**Suggestion:** Surface gateway errors to UI with actionable messages:
- "Gateway unreachable - check your connection"
- "Authentication failed - token may have expired"
- "Rate limited - please wait before sending more tasks"

**Estimated Effort:** 2 hours

---

## 🎯 Architectural Suggestions

### 12. Consider WebSocket Connection Pooling
**Current:** One WebSocket connection per browser tab.

**Suggestion:** If user opens multiple sessions, consider multiplexing over single connection or using connection pooling.

**Use Case:** Reduce gateway connection count per user.

---

### 13. Add Gateway Health Check Endpoint
**File:** `server.ts` or new file

**Suggestion:** Add `/api/health/gateway` that attempts lightweight gateway ping to verify connectivity before client attempts full handshake.

**Estimated Effort:** 1 hour

---

## 📋 Implementation Checklist

- [ ] P0-1: Secure token storage (proxy route or HTTP-only cookie)
- [ ] P0-2: Fix memory leaks in bubbleAccum, runActors
- [ ] P1-3: Add WebSocket heartbeat/ping mechanism
- [ ] P1-4: Fix reconnection race condition
- [ ] P1-5: Log JSON parse errors
- [ ] P2-6: Clear timeout timer on response
- [ ] P2-7: Add rate limit backoff
- [ ] P2-8: Cleanup abandoned session queues
- [ ] P3-9: Add connection metrics
- [ ] P3-10: Implement request deduplication
- [ ] P3-11: Surface errors to UI

---

## 🏆 Quick Wins (Under 30 mins)

1. **P1-5:** Add logging to JSON parse catch block
2. **P2-6:** Clear timeout timer in handleFrame
3. **P0-2:** Add `refs.runActors.delete(runId)` to cleanupRun
4. **P1-4:** Add `reconnecting` flag to prevent races

---

*End of Review*
