# BullenHaus Phase C1 — Final Status Report

> Objective: prepare a production-ready VPS runtime migration for the active `/api/*` endpoints without deploying to the VPS yet.

## Summary

- The Bullenhaus SPA is **not purely static** — it calls `/api/deposits`, `/api/admin/deposits`, `/api/admin/payments/trapay`, `/api/crm/clients/:id/files`, `/api/kyc/analyze-external`, and (previously) TeamChat endpoints.
- We extended the existing `artifacts/api-server` Express backend as the canonical Node API runtime. It will bind to `127.0.0.1:3002` on the VPS.
- We migrated the active Vercel-style handlers using a thin adapter layer, fixed the TypeScript `rootDir` issue, configured raw-body parsing for webhooks, and verified local builds and smoke tests.
- TeamChat is disabled in production via `VITE_TEAMCHAT_ENABLED=false`; the backend remains `NOT_IMPLEMENTED`.
- Recovery seed credential was remediated: hardcoded `operator@bhrecover.dev / Recover!2024` removed; seed now generates a random password per run and refuses to run in production.
- No VPS upload or privileged installation has occurred yet.

---

## What was built

### 1. API runtime adapter (`artifacts/api-server`)

New files:
- `src/lib/adapter.ts` — wraps Vercel-style `handler(req, res)` for Express.
- `src/lib/env.ts` — central env helpers (not yet used everywhere; future cleanup).
- `src/routes/deposits.ts` — mounts `/api/deposits`, `/api/deposits/config`, `/api/deposits/:id`, `/api/admin/deposits`, `/api/admin/deposits/:id`, `/api/admin/payments/trapay`, `/api/admin/payments/trapay/test`.
- `src/routes/crm-files.ts` — mounts `/api/crm/clients/:id/files`.
- `src/routes/kyc.ts` — mounts `/api/kyc/analyze-external`.
- `src/routes/webhooks.ts` — mounts `/api/webhooks/trapay` with raw-body preservation.

Modified files:
- `src/app.ts` — raw-body parser only on `/api/webhooks/*`, JSON parser elsewhere, 404 catch-all.
- `src/routes/index.ts` — added new routers.
- `tsconfig.json` — `rootDir` widened so handlers can be imported from `Bullenhaus-clean/api/...`.

### 2. SPA production gating (`artifacts/bullenhaus`)

- Added `src/env.d.ts` with typed `VITE_TEAMCHAT_ENABLED`.
- `tsconfig.json` includes `src/env.d.ts`.
- `.env.example` documents `VITE_TEAMCHAT_ENABLED=false`.
- `src/app/crm/components/Layout.tsx` conditionally renders `<TeamChat />` only when the flag is `"true"`.

### 3. Recovery seed remediation (`D:\Новая папка\Recovery`)

- `prisma/seed.ts` no longer contains a hardcoded password.
- Seed refuses `NODE_ENV=production`.
- `.env.example` updated with `NEXTAUTH_URL`, `DIRECT_URL`, `BULLENHAUS_SYNC_SECRET`, and `RECOVERY_SYNC_SECRET`.
- `package.json` build script fixed (`cp -R` instead of `cp -r`) so the standalone build completes on Windows/BusyBox environments.

### 4. Reference docs

- `API_RUNTIME_MIGRATION_MATRIX.md` — source of truth for `/api` route classification.
- `ENV_SECRETS_CHEATSHEET.md` — production env variable list for `/etc/bullenhaus/api.env` and `/etc/bullenhaus/recovery.env`.
- This file.

---

## Validation results

| Check | Command | Result |
|-------|---------|--------|
| api-server typecheck | `pnpm --filter @workspace/api-server run typecheck` | ✅ pass |
| api-server build | `pnpm --filter @workspace/api-server run build` | ✅ pass |
| api-server start + health | `node dist/index.mjs` + `curl /api/healthz` | ✅ `{"status":"ok"}` |
| Active endpoint smoke | deposits, admin deposits, TRAPAY config/test, webhook | ✅ auth/404 errors as expected for missing token/Supabase; routes reachable |
| SPA typecheck | `pnpm --filter @workspace/bullenhaus run typecheck` | ✅ pass |
| SPA build | `pnpm --filter @workspace/bullenhaus run build` | ✅ pass |
| Recovery build | `bun run build` | ✅ standalone produced |

### Note on full contract testing
- A complete end-to-end test of deposits/TRAPAY/KYC/CRM files requires a real Supabase session token and cloud DB state.
- Local smoke tests confirmed route mounting, body parsing, and auth guards behave correctly.
- Full contract validation should be run after VPS upload with a real browser session.

---

## Architecture for VPS deployment

```
Internet ──► Caddy (443) ──► /          → static SPA files (Bullenhaus)
                              /api/*    → api-server @ 127.0.0.1:3002
                              /recovery → Recovery Next.js @ 127.0.0.1:3001
```

- No Docker, no local PostgreSQL, no Asterisk on the VPS.
- Both backends talk to the same cloud Supabase project (`qktqfedvfqxhrtjnmzmi`).
- api-server uses service-role key only in server runtime.

---

## Remaining work before go-live

The following steps require the **privileged stage** (user-provided `sudo -v` or direct root access on the VPS):

1. **Upload builds**
   - `Bullenhaus-clean/artifacts/bullenhaus/dist/public` → `/var/www/bullenhaus/html`
   - `Bullenhaus-clean/artifacts/api-server/dist` plus runtime files → `/opt/bullenhaus/api`
   - `Recovery/.next/standalone` → `/opt/bullenhaus/recovery`

2. **Create `/etc/bullenhaus/*.env` files** (root-owned `0600`) with real secrets.

3. **Create systemd services**:
   - `bullenhaus-api.service` — `PORT=3002`, env file `/etc/bullenhaus/api.env`, user `bullen`.
   - `bullenhaus-recovery.service` — `PORT=3001`, env file `/etc/bullenhaus/recovery.env`, user `bullen`.

4. **Configure Caddy** reverse proxy for the two backends and the static SPA.

5. **Run production health checks** and a real browser session through all active flows.

6. **Clean cloud DB** of any remaining Phase B test fixtures once real user data is confirmed separate.

7. **Rotate `NEXTAUTH_SECRET` / `BULLENHAUS_SYNC_SECRET`** and verify the old `operator@bhrecover.dev` cloud account is deleted/disabled (manual Supabase step).

---

## Security / compliance notes

- `TRAPAY_SECRET_ENC_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, and `BULLENHAUS_SYNC_SECRET` must never be committed.
- `.env` files are already in `.gitignore` — verify both `Bullenhaus-clean` and `Recovery` repos before any commit.
- The SPA bundle only contains `VITE_*` variables (publishable Supabase key, Recovery URL, TeamChat flag).

---

## Stop / next decision

**Phase C1 implementation is complete on the workstation. Nothing has been uploaded to the VPS yet.**

When you are ready, confirm one of the following next steps:
- `deploy` — proceed to VPS upload and privileged service/Caddy setup.
- `commit-first` — commit the current changes to git before deployment.
- `hold` — stop here and review the docs (`API_RUNTIME_MIGRATION_MATRIX.md`, `ENV_SECRETS_CHEATSHEET.md`, `PHASE_C1_FINAL_STATUS.md`) before deciding.
