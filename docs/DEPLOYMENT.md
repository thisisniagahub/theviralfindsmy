# Deployment

> VPS setup, nginx configuration, PM2 process management, and production deployment for TheViralFinds.

> Reality check (15 April 2026):
> This document describes the intended deployment shape, but production readiness still depends on the route and auth fixes tracked in `ROADMAP.md`. Do not treat this file alone as proof the current app is deployment-safe.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Production Environment              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐     ┌──────────────┐              │
│  │   Vercel     │     │     VPS      │              │
│  │  (Frontend)  │     │  (Backend)   │              │
│  │              │     │              │              │
│  │  Next.js     │◄───►│  OpenClaw    │              │
│  │  React 19    │     │  Gateway     │              │
│  │  API Routes  │     │  (18789)     │              │
│  └──────┬───────┘     └──────┬───────┘              │
│         │                    │                       │
│         ▼                    ▼                       │
│  ┌──────────────┐     ┌──────────────┐              │
│  │   Vercel     │     │  PostgreSQL  │              │
│  │  Postgres    │     │     (5432)   │              │
│  │  (Neon)      │     │              │              │
│  └──────────────┘     └──────────────┘              │
│                                                      │
│  External Services:                                 │
│  - Shopee API (affiliate, products, orders)         │
│  - Upstash Redis (helpers exist in repo; verify live wiring) │
│  - Cloudflare CDN (game assets - optional future optimization) │
└─────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Location | Role |
|-----------|----------|------|
| Next.js App | Vercel | Frontend UI, API routes, SSR |
| DB Service | VPS (localhost:3005) | Prisma database operations |
| Notification Service | VPS (localhost:3004) | Socket.IO real-time events |
| OpenClaw Gateway | VPS (127.0.0.1:18789) | AI agent orchestration |
| PostgreSQL | VPS or Vercel Postgres | Database |
| Nginx | VPS | Reverse proxy, SSL termination |

---

## Prerequisites

- **Node.js**: 18+
- **Bun**: Latest (package manager)
- **PostgreSQL**: 16+
- **PM2**: Process manager (`npm install -g pm2`)
- **Nginx**: Reverse proxy
- **OpenClaw**: Installed and configured on VPS

---

## Environment Variables

### Vercel (Frontend)

```bash
# Database (Vercel Postgres auto-sets this)
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
NEXTAUTH_URL=https://yourdomain.com

# Admin
ADMIN_EMAIL=admin@theviralfinds.my
ADMIN_PASSWORD=<strong-password>

# Demo/Auth
DEMO_MODE=false
SKIP_AUTH=false

# OpenClaw Gateway
OPENCLAW_GATEWAY_URL=https://operator.gangniaga.my
OPENCLAW_GATEWAY_TOKEN=<your-token>
OPENCLAW_WS_ENABLED=true
OPENCLAW_HOOKS_PATH=/hooks

# Shopee (optional)
SHOPEE_PARTNER_ID=
SHOPEE_PARTNER_KEY=
SHOPEE_REGION=MY
SHOPEE_USE_SANDBOX=false

# Services (Vercel doesn't need these — removed)
# NOTIFICATION_SERVICE_URL=http://127.0.0.1:3004
# DB_SERVICE_URL=http://127.0.0.1:3005
```

### VPS (Backend Services)

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/theviralfinds

# DB Service
DB_SERVICE_SECRET=<generate-secret-key>
PORT=3005

# OpenClaw
OPENCLAW_GATEWAY_TOKEN=<your-token>

# Notification Service
PORT=3004
```

---

## Deployment Steps

### 1. Install Dependencies

```bash
bun install
```

### 2. Setup Database

```bash
# Generate Prisma Client
bun run db:generate

# Push schema to database (development only)
bun run db:push

# Or create migration
bun run db:migrate -- --name initial-schema
```

For staging/production, prefer migrations and rollout verification over `db:push`.

### 3. Build Application

```bash
bun run build
```

### 4. Start Services (VPS)

```bash
# DB Service
cd mini-services/db-service
pm2 start "bun run index.ts" --name "db-service" -- --port 3005

# Notification Service
cd mini-services/notification-service
pm2 start "bun run index.ts" --name "notification-service" -- --port 3004

# OpenClaw Gateway (if self-hosted)
openclaw gateway start
pm2 save
pm2 startup
```

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## Nginx Configuration

### Reverse Proxy for VPS Services

```nginx
server {
    listen 443 ssl http2;
    server_name operator.gangniaga.my;

    ssl_certificate /etc/letsencrypt/live/operator.gangniaga.my/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/operator.gangniaga.my/privkey.pem;

    # OpenClaw Gateway
    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Token authentication
        # Add auth_request or basic auth as needed
    }

    # WebSocket support
    location /ws {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## Health Checks

### Endpoint Monitoring

| Service | Health Endpoint | Expected Response |
|---------|----------------|-------------------|
| Next.js | `GET /api/health` | App health payload; version should match `package.json` |
| DB Service | `GET http://127.0.0.1:3005/health` | `{"status":"healthy","links":150}` |
| OpenClaw | `GET https://operator.gangniaga.my/health` | Gateway health status |

### PM2 Monitoring

```bash
# View all processes
pm2 list

# View logs
pm2 logs db-service
pm2 logs notification-service

# Monitor resources
pm2 monit

# Restart service
pm2 restart db-service

# View detailed info
pm2 show db-service
```

### Uptime Monitoring (External)

Recommended tools:

- UptimeRobot (free)
- Pingdom
- Better Stack

---

## Rollback Procedure

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### VPS Rollback

```bash
# Stop services
pm2 stop all

# Checkout previous version
git checkout <previous-commit>

# Rebuild
bun install
bun run build

# Restart services
pm2 restart all
pm2 save
```

### Database Rollback

```bash
# Revert last migration
bunx prisma migrate reset

# Or restore from backup
pg_restore -d theviralfinds backup.dump
```

---

## Production Checklist

- [ ] `DEMO_MODE=false` in production
- [ ] `SKIP_AUTH=false` in production
- [ ] `NEXTAUTH_SECRET` is strong random string
- [ ] `ADMIN_PASSWORD` is changed from default
- [ ] `DB_SERVICE_SECRET` is configured
- [ ] Core route contracts in `ROADMAP.md` are stabilized before production cutover
- [ ] SSL certificates are valid and not expiring
- [ ] Database backups are scheduled
- [ ] PM2 processes auto-start on reboot
- [ ] Nginx rate limiting configured
- [ ] Firewall rules restrict port 3005 to localhost
- [ ] Environment variables are in Vercel dashboard (not `.env`)
- [ ] Error monitoring configured (Sentry, LogRocket)
- [ ] Performance monitoring configured

---

## Troubleshooting

### DB Service Won't Start

```bash
# Check if Prisma Client is generated
bun run db:generate

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Check logs
pm2 logs db-service --lines 100
```

### OpenClaw Gateway Unreachable

```bash
# Check gateway status
openclaw gateway status

# Restart gateway
openclaw gateway restart

# Check logs
openclaw logs
```

### High Memory Usage

```bash
# View memory usage
pm2 monit

# Restart services
pm2 restart all

# Clear PM2 logs
pm2 flush
```

### Prisma Client Errors

```bash
# Regenerate Prisma Client
bun run db:generate

# If schema changed in development only
bun run db:push
```

---

*Last updated: 15 April 2026*
