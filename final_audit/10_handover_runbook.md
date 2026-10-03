# 10 — Handover Runbook

## Run locally

```
pnpm install
pnpm --filter @workspace/bullenhaus run dev     # client app, http://localhost:<vite-port>
```

Requires `artifacts/bullenhaus/.env` (see `.env.example` in that directory) with Supabase project
URL + anon key. Do not use the service-role key client-side.

## Typecheck

```
pnpm run typecheck        # whole workspace (libs + artifacts/* + scripts)
cd api && npx tsc --noEmit -p tsconfig.json   # api/ is not covered by the root script
```

## Build

```
pnpm run build             # typecheck + build everything with an --if-present build script
```

Vercel's actual production build only runs `pnpm --filter @workspace/bullenhaus run build`
(per `vercel.json`); `api/**` is compiled/deployed separately by Vercel's own Node function
builder. Always sanity-check `api/` with its own `tsc --noEmit` before assuming a green root
build means `api/` is fine too — this exact gap caused AUDIT-001 this session.

## Database migrations

**There is currently no migration-file workflow in this repo** (AUDIT-009) — the live schema in
Supabase project `sgtmwdlycllbbavrqgzm` is the only source of truth. Recommended going forward:
run schema changes through Supabase MCP's `apply_migration` (as this audit did) or the dashboard,
then immediately run `supabase db diff -f <descriptive_name>` (or equivalent) and commit the
resulting file to `supabase/migrations/` so changes become reviewable and revertible from git.

## Deploy

Automatic: push to any branch → Vercel preview deploy; merge to `main` → Vercel production
deploy. No manual deploy step exists or is needed. Do not deploy from a local machine using the
Vercel CLI unless intentionally bypassing the GitHub integration.

## Rollback

- **Code:** standard `git revert <commit>` + push; Vercel redeploys automatically.
- **Database:** no automated rollback exists (see 09_deployment_readiness.md for the specific
  manual-revert SQL for this session's changes if ever needed). Because there's no branch/staging
  DB, any future schema change should be tested with extreme care — consider standing up a
  Supabase branch (the MCP toolset supports `create_branch`) for anything riskier than an
  additive `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

## Required environment variables (names only — no values shown per this session's confidentiality rule)

- `VITE_SUPABASE_URL` / `SUPABASE_URL`
- Supabase anon/publishable key (client-side, `artifacts/bullenhaus/.env`)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only, used by `api/_lib/supabase.ts`'s
  `getAdminClient()` — must never reach the client bundle; confirmed it does not, since it's only
  referenced from files under `api/`, which is never included in the Vite client build)
- `OPENROUTER_API_KEY` (server-side, `api/kyc/analyze-external.ts`, `api/ai/chat.ts`)
- `AI_PROVIDER`, `AI_OPENROUTER_ALLOW_FALLBACKS`, `AI_OPENROUTER_SORT`,
  `AI_OPENROUTER_DATA_COLLECTION`, `AI_OPENROUTER_ZDR` (optional AI-provider tuning, all read with
  safe defaults if unset)

## Where to look at logs

**NOT_DETERMINED this session** — no observability/logging platform integration was found in the
reviewed code beyond `console.error` calls in the `api/**` serverless functions (visible in
Vercel's own function logs by platform default). If a dedicated logging service (Sentry, Logtail,
etc.) is in use, it wasn't referenced by any file this audit read.

## Known non-blocking limitations (carried into handover)

1. No test suite, no lint config, no CI — see AUDIT-012. Every change in this repo currently
   relies on manual review + `tsc`/`vite build` as the only automated gate.
2. No local migration history — see AUDIT-009.
3. `replit.md`/README are unfilled — see AUDIT-010.
4. Root-level stray audit/SQL files from an earlier pass were left untouched — see AUDIT-011 (owner should decide what to keep/delete).
5. Supabase Auth leaked-password protection is off — see AUDIT-007 (owner must toggle this in the Supabase Auth dashboard; not an API-accessible setting from this session's tools).
6. `artifacts/api-server` and its `lib/*` dependents appear to be dead scaffold, not part of the live product — confirmed by absence of any reference from the client app, but the owner should confirm this before deleting anything, since this audit did not delete it (see 02_project_map.md).

## Point of continuation if a blocker arises

If a future session needs to pick this up: this branch (`claude/kyc-workflow-72v84z`) is at
commit `d85e4c1` as of this audit, PR #26 is open/draft, and every finding in
`final_audit/04_findings_register.md` marked "requiring owner action" is the correct starting
list — nothing else from this audit is left half-done.
