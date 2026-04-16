# Secrets to Rotate

> Generated: 2026-04-14 as part of P0-3 security hardening.
> Use this as an operational checklist, not a guaranteed reflection of every current auth/detail implementation.

## Critical Secrets (Rotate Immediately Before Production)

| Secret | Location | Current Status | Action Required |
|--------|----------|---------------|-----------------|
| `NEXTAUTH_SECRET` | `.env` / Vercel dashboard | Placeholder value (`your-secret-key-here`) | Generate with: `openssl rand -base64 32` |
| `DB_SERVICE_SECRET` | `.env` / Vercel dashboard | Placeholder value (`your-generated-secret-here`) | Generate with: `openssl rand -base64 32` |
| `ADMIN_PASSWORD` | `.env` / Vercel dashboard | Placeholder value (`your-admin-password`) | Set a strong password or bcrypt hash |
| `DATABASE_URL` | `.env` / Vercel dashboard | Localhost placeholder | Replace with production PostgreSQL connection string |

## API Keys (Configure Before Production)

| Secret | Location | Current Status | Action Required |
|--------|----------|---------------|-----------------|
| `OPENCLAW_GATEWAY_TOKEN` | `.env` / Vercel dashboard | Placeholder (`your-gateway-token`) | Set real token from OpenClaw VPS |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | `.env` / Vercel dashboard | Not configured | Create Google OAuth app in Cloud Console |
| `FACEBOOK_CLIENT_ID` + `FACEBOOK_CLIENT_SECRET` | `.env` / Vercel dashboard | Not configured | Create Facebook app in Meta Developers |
| `SHOPEE_PARTNER_ID` + `SHOPEE_PARTNER_KEY` | `.env` / Vercel dashboard | Empty | Register at open.shopee.com |
| `SHOPEE_AFFILIATE_APP_ID` + `SHOPEE_AFFILIATE_SECRET` | `.env` / Vercel dashboard | Empty | Register at affiliate.shopee.com |

## Previously Hardcoded Values (Now Fixed)

| Value | Previous Location | Current Status |
|-------|------------------|----------------|
| Admin email `admin@theviralfinds.my` | Hardcoded in `nextauth/route.ts` and `db-service/index.ts` | Now reads from `ADMIN_EMAIL` env var only |
| Admin name `Ahmad Ali` | Hardcoded in `nextauth/route.ts` authorize callback | Removed - uses generic `Admin User` |
| Fallback user ID `'1'` | Hardcoded in `nextauth/route.ts` | Removed - current flow should fail closed if user upsert fails |

## Environment Configuration Notes

- Verify the current `.env.example` values before copying them into a real environment
- `SKIP_AUTH` must be `false` in production
- `DEMO_MODE` must be `false` in production
- All secrets should be stored in Vercel dashboard environment variables, not in `.env` files
- Use bcrypt hashes for `ADMIN_PASSWORD` in production (generate with: `npx bcrypt-cli your-password`)

## Rotation Checklist

- [ ] Generate new `NEXTAUTH_SECRET`
- [ ] Generate new `DB_SERVICE_SECRET`
- [ ] Set strong `ADMIN_PASSWORD` (preferably bcrypt hash)
- [ ] Replace `DATABASE_URL` with production connection string
- [ ] Set real `OPENCLAW_GATEWAY_TOKEN`
- [ ] Configure OAuth provider credentials
- [ ] Set `SKIP_AUTH=false`
- [ ] Set `DEMO_MODE=false`
- [ ] Verify all secrets are in Vercel dashboard (not just local `.env`)
