# BullenHaus Phase C1 — Production Env Secrets Cheatsheet

## File locations on VPS (will be created during privileged stage)

- `/etc/bullenhaus/api.env` — root-owned `0600`, loaded by `bullenhaus-api.service`.
- `/etc/bullenhaus/recovery.env` — root-owned `0600`, loaded by `bullenhaus-recovery.service`.
- SPA env variables are **baked at build time**; they do not need server env files.

---

## 1. SPA build-time variables (no secrets)

Set these in your local build environment or CI before running `pnpm --filter @workspace/bullenhaus run build`.

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `VITE_SUPABASE_URL` | yes | `https://qktqfedvfqxhrtjnmzmi.supabase.co` | Same for all apps |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes | `eyJhbGciOiJIUzI1NiIs...` | Browser-safe anon key |
| `VITE_RECOVERY_URL` | yes | `https://recovery.bullenhaus.st/` | Production Recovery origin (used by Recovery unification links) |
| `VITE_TEAMCHAT_ENABLED` | no | `false` | **Must be `false` in production** — backend is NOT_IMPLEMENTED |

These end up in the static bundle; never put service-role keys here.

---

## 2. API server (`/etc/bullenhaus/api.env`)

Loaded by `bullenhaus-api.service` via `EnvironmentFile=-/etc/bullenhaus/api.env`. Server binds `127.0.0.1:3002`.

| Variable | Required | Example / default | Notes |
|----------|----------|-------------------|-------|
| `PORT` | yes | `3002` | api-server fails closed if missing |
| `NODE_ENV` | yes | `production` | Controls logger level |
| `LOG_LEVEL` | no | `info` | `debug` for verbose logs |
| `APP_URL` | yes | `https://app.bullenhaus.com` | Canonical origin for TRAPAY callback URLs and webhook URL. Must be HTTPS in production. |
| `VITE_SUPABASE_URL` or `SUPABASE_URL` | yes | `https://qktqfedvfqxhrtjnmzmi.supabase.co` | Cloud Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | `eyJhbGciOiJIUzI1NiIs...` | **Never expose to browser** |
| `BULLENHAUS_SIP_101_PASSWORD` | yes for agent telephony | stored value from Asterisk PJSIP endpoint 101 | Server-only; `/api/telephony/config` returns it only to an authenticated `agent` and never logs it |
| `BULLENHAUS_SIP_101_USER` | no | `101` | SIP extension used by the agent dialer |
| `BULLENHAUS_PBX_SIP_DOMAIN` | no | `bullenhaus.st` | Public SIP domain |
| `BULLENHAUS_PBX_WSS_URL` | no | `wss://pbx.bullenhaus.st/ws` | Public Asterisk WSS endpoint |
| `TRAPAY_SECRET_ENC_KEY` | yes | `openssl rand -hex 32` | 32-byte hex/base64; used to encrypt TRAPAY API secret at rest |
| `OPENROUTER_API_KEY` | no | `sk-or-...` | Required for AI chat (AI Core) |
| `AI_PROVIDER` | no | `openrouter` | |
| `AI_PRIMARY_MODEL` | no | `deepseek/deepseek-chat-v3.1` | |
| `AI_FALLBACK_MODEL` | no | `openai/gpt-4.1-mini` | |
| `OPENROUTER_BASE_URL` | no | `https://openrouter.ai/api/v1` | |
| `AI_REQUEST_TIMEOUT_MS` | no | `30000` | |
| `AI_OPENROUTER_ENABLED` | no | `true` | |
| `AI_OPENROUTER_ALLOW_FALLBACKS` | no | `true` | |
| `AI_OPENROUTER_SORT` | no | `price` | |
| `AI_OPENROUTER_DATA_COLLECTION` | no | `deny` | |
| `AI_OPENROUTER_ZDR` | no | `false` | Restrict to Zero Data Retention endpoints |
| `CRM_API_URL` | no | `https://crm.bullenhaus.com/...` | Outbound CRM integration endpoint |
| `CRM_API_KEY` | no | `...` | CRM API key |
| `ALLOWED_ORIGIN` | no | `https://app.bullenhaus.com` | Browser CORS lock for Edge function equivalent behavior |

### Notes on body parsing
- Webhooks (`/api/webhooks/trapay`) receive raw bytes.
- All other `/api` routes receive parsed JSON via `express.json()`.

### No local database
No `DATABASE_URL` is required; the API server talks directly to cloud Supabase via service role.

---

## 3. Recovery backend (`/etc/bullenhaus/recovery.env`)

Loaded by `bullenhaus-recovery.service`. Next.js 16 standalone, binds `127.0.0.1:3001`.

| Variable | Required | Example / default | Notes |
|----------|----------|-------------------|-------|
| `PORT` | yes | `3001` | Recovery server port |
| `NODE_ENV` | yes | `production` | |
| `DATABASE_URL` | yes | `postgresql://postgres.qktqfedvfqxhrtjnmzmi:[pwd]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | Prisma-accelerated Supabase connection |
| `DIRECT_URL` | yes | `postgresql://postgres:[pwd]@db.qktqfedvfqxhrtjnmzmi.supabase.co:5432/postgres` | Direct Supabase connection for migrations |
| `NEXTAUTH_SECRET` | yes | `openssl rand -base64 32` | Encryption key for NextAuth sessions |
| `NEXTAUTH_URL` | yes | `https://recovery.bullenhaus.st/` | Must match public origin |
| `GOOGLE_CLIENT_ID` | maybe | `.apps.googleusercontent.com` | If Google OAuth is enabled |
| `GOOGLE_CLIENT_SECRET` | maybe | `...` | |
| `BULLENHAUS_SYNC_SECRET` | yes | `openssl rand -hex 32` | Server-to-server credential shared with main BullenHaus app |
| `RECOVERY_SYNC_SECRET` | maybe | same as BULLENHAUS_SYNC_SECRET | Legacy alias; set one, prefer `BULLENHAUS_SYNC_SECRET` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | maybe | ... | If email sending is required |

### Security
- Rotate `NEXTAUTH_SECRET` and `BULLENHAUS_SYNC_SECRET` after replacing the dev seed credential `operator@bhrecover.dev`.
- Do not commit either env file or any `.env` containing these values.

---

## 4. Verification checklist before privileged deployment

- [ ] `api-server` `typecheck`, `build`, and local start pass.
- [ ] `bullenhaus` SPA `build` passes with `VITE_TEAMCHAT_ENABLED=false` and `VITE_RECOVERY_URL=https://recovery.bullenhaus.st/`.
- [ ] `Recovery` `build` passes and can start standalone.
- [ ] Cloud Supabase service-role key is valid and restricted.
- [ ] `TRAPAY_SECRET_ENC_KEY` generated and stored only on VPS.
- [ ] `APP_URL` is exactly the canonical public origin.
- [ ] Dev seed credential `operator@bhrecover.dev` is disabled/deleted.
- [ ] `.env` files are in `.gitignore` and never staged.
