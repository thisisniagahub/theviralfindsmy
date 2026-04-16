# Runbook

> Operational procedures, troubleshooting guides, and maintenance schedules for TheViralFinds.

> Reality check (15 April 2026):
> Use this runbook together with `ROADMAP.md` and the current code. Some older assumptions about SDK fallback and Redis rollout have already drifted.

---

## Service Overview

| Service | Port | Process | Health Check | Restart Command |
|---------|------|---------|--------------|-----------------|
| Next.js App | 3000 | Vercel / `bun run dev` | `GET /api/health` | `bun run dev` |
| DB Service | 3005 | Bun.serve() | `GET http://127.0.0.1:3005/health` | `pm2 restart db-service` |
| Notification Service | 3004 | Bun.serve() + Socket.IO | WebSocket ping | `pm2 restart notification-service` |
| OpenClaw Gateway | 18789 | OpenClaw CLI | `GET /health` | `openclaw gateway restart` |
| PostgreSQL | 5432 | PostgreSQL server | `psql -c "SELECT 1"` | `systemctl restart postgresql` |

---

## Operational Scenarios

### 1. DB Service Down

**Symptoms**:

- API routes return 500 errors
- Dashboard shows no data
- Links cannot be created/updated

**Diagnosis**:

```bash
# Check if process is running
pm2 list | grep db-service

# Check logs
pm2 logs db-service --lines 100

# Test health endpoint
curl http://127.0.0.1:3005/health
```

**Resolution**:

```bash
# Restart service
pm2 restart db-service

# If still failing:
cd mini-services/db-service
bun run index.ts

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Regenerate Prisma Client if needed
bun run db:generate
```

**Prevention**:

- Monitor PM2 process status
- Set up alerts on health check failures
- Ensure `DB_SERVICE_SECRET` is configured

---

### 2. OpenClaw Gateway Down

**Symptoms**:

- AI features stop working
- `/api/openclaw/*` routes timeout or return errors
- Agent responses unavailable

**Diagnosis**:

```bash
# Check gateway status
openclaw gateway status

# Test gateway connectivity
curl https://operator.gangniaga.my/health

# Check gateway logs
openclaw logs
```

**Resolution**:

```bash
# Restart gateway
openclaw gateway restart

# If using PM2:
pm2 restart openclaw-gateway

# Verify agents are registered
curl https://operator.gangniaga.my/v1/models \
  -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN"
```

**Fallback**:

- SDK fallback exists, but its current import/export contract still needs verification before you rely on it during incidents
- AI features gracefully degrade with error messages to user

---

### 3. WebSocket Disconnected

**Symptoms**:

- Real-time notifications stop
- Agent Office shows agents as offline
- No live updates

**Diagnosis**:

```bash
# Check Notification Service
pm2 logs notification-service --lines 50

# Test WebSocket connection
wscat -c ws://127.0.0.1:3004

# Check OpenClaw WebSocket
openclaw gateway status
```

**Resolution**:

```bash
# Restart Notification Service
pm2 restart notification-service

# Reconnect WebSocket in browser
# (Page refresh usually triggers reconnection)

# If OpenClaw WS is down:
openclaw gateway restart
```

**Prevention**:

- Lazy initialization via `getWsClient()` prevents eager connection failures
- Auto-reconnect logic implemented in ws-client.ts

---

### 4. High Memory Usage

**Symptoms**:

- Services slow or unresponsive
- OOM killer terminates processes
- PM2 shows high memory

**Diagnosis**:

```bash
# View memory usage
pm2 monit

# Check system memory
free -h

# Find memory-hungry processes
ps aux --sort=-%mem | head -10
```

**Resolution**:

```bash
# Restart all services
pm2 restart all

# If DB Service is the culprit:
pm2 restart db-service

# Clear PM2 logs (can consume disk space)
pm2 flush

# Clear in-memory cache (temporary fix)
# (Cache is in-memory, restart clears it)
```

**Prevention**:

- Redis-backed helpers already exist, but live rollout is still mixed across routes and services
- Set memory limits in PM2:

  ```bash
  pm2 start db-service --max-memory-restart 500M
  ```

---

### 5. Prisma Client Error

**Symptoms**:

- DB Service crashes on startup
- "Prisma Client not generated" error
- Schema mismatch errors

**Diagnosis**:

```bash
# Check if Prisma Client exists
ls node_modules/.prisma/client

# Try generating
bun run db:generate

# Check schema for errors
bunx prisma validate
```

**Resolution**:

```bash
# Regenerate Prisma Client
bun run db:generate

# If schema changed, push to database
bun run db:push

# If migration needed
bun run db:migrate -- --name fix-schema
```

---

### 6. Next.js Compilation Hang

**Symptoms**:

- `bun run dev` hangs on "Compiling..."
- Turbopack stuck indefinitely
- Build timeout

**Cause**:

- Prisma Client imported in Next.js code
- Turbopack cannot compile Prisma

**Resolution**:

```bash
# Find Prisma imports in src/
grep -r "from '@prisma/client'" src/

# Remove all Prisma imports from src/
# (DB operations should go through DB Service HTTP calls)

# Restart dev server
bun run dev
```

**Prevention**:

- Never import Prisma in Next.js routes
- Use DB Service HTTP API instead
- Architectural invariant #1 (see docs/ARCHITECTURE.md)

---

## Scheduled Maintenance

| Task | Frequency | Command | Responsible |
|------|-----------|---------|-------------|
| Database backup | Daily | `pg_dump theviralfinds > backup.sql` | VPS cron |
| Log rotation | Weekly | `pm2 flush` | System |
| SSL certificate renewal | Every 90 days | `certbot renew` | Let's Encrypt |
| Dependency updates | Monthly | `bun update` | Developer |
| Prisma schema review | Per release | `bunx prisma validate` | Developer |
| OpenClaw agent review | Monthly | `openclaw agents list` | Developer |
| Security audit | Quarterly | `bun audit` | Developer |
| Performance review | Monthly | Check Vercel analytics | Developer |

---

## Log Locations

| Service | Log Location | Command |
|---------|-------------|---------|
| Next.js | Console / Vercel dashboard | `bun run dev` |
| DB Service | PM2 logs | `pm2 logs db-service` |
| Notification Service | PM2 logs | `pm2 logs notification-service` |
| OpenClaw Gateway | OpenClaw logs | `openclaw logs` |
| PostgreSQL | `/var/log/postgresql/` | `journalctl -u postgresql` |
| Nginx | `/var/log/nginx/` | `tail -f /var/log/nginx/error.log` |

---

## Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| Developer | @megat | Immediate |
| DevOps | (TBD) | 1 hour |
| Database Admin | (TBD) | 2 hours |

---

## Disaster Recovery

### Complete System Restore

1. **Restore Code**:

   ```bash
   git checkout main
   git pull origin main
   bun install
   bun run build
   ```

2. **Restore Database**:

   ```bash
   pg_restore -d theviralfinds latest-backup.dump
   ```

3. **Restart Services**:

   ```bash
   pm2 restart all
   pm2 save
   ```

4. **Verify Health**:

   ```bash
   curl http://localhost:3000/api/health
   curl http://127.0.0.1:3005/health
   openclaw gateway status
   ```

---

*Last updated: 15 April 2026*
