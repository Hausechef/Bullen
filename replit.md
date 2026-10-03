# Bullenhaus

A trading platform: a client-facing app (margin / forex / spot-crypto trading, portfolio, KYC,
rewards, support) plus an internal CRM/admin backoffice for staff (agents, managers, KYC
reviewers, deposit/withdrawal approvers, support). Frontend is a React/Vite SPA; the datastore
and authorization layer is Supabase (Postgres + RLS + Auth); privileged operations run as Vercel
serverless functions. Deployed on Vercel.

## Run & Operate

- `pnpm install` — install (pnpm workspace; do not use npm/yarn — a preinstall guard blocks them)
- `pnpm --filter @workspace/bullenhaus run dev` — run the client app (Vite dev server)
- `pnpm run typecheck` — full typecheck across `lib/*`, `artifacts/*`, `scripts`
- `cd api && pnpm exec tsc --noEmit -p tsconfig.json` — typecheck the serverless functions (NOT covered by the root typecheck script — see Gotchas)
- `pnpm run test` — run the test suite (`node:test` via tsx; currently covers `api/` KYC output sanitization)
- `pnpm run build` — typecheck + build every package
- Required client env (`artifacts/bullenhaus/.env`, see `.env.example`): Supabase URL + anon key
- Required server env (Vercel function env): `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, plus the Supabase URL

## Stack

- pnpm workspaces, Node 22+, TypeScript 5.9
- Frontend: React 18, Vite, Tailwind v4, Zustand, React Router v6, Framer Motion, lucide-react
- Backend (privileged): Vercel serverless functions under `api/**` using `@supabase/supabase-js` with the service-role key
- Data + authz: Supabase Postgres — Row Level Security, `SECURITY DEFINER` RPCs, Realtime, Auth (JWT)
- AI: OpenRouter (KYC document triage bot, AI live chat) — human-in-the-loop, advisory only
- Deploy: Vercel (GitHub-integrated; preview per PR, production on `main`)
- CI: GitHub Actions (`.github/workflows/ci.yml`) — typecheck + api typecheck + build + test

## Where things live

- Client app: `artifacts/bullenhaus/src` — pages under `src/app/trading/pages` (client) and `src/app/crm` (backoffice); route table in `src/App.tsx`; Supabase browser client in `src/lib/supabase/`.
- Privileged serverless functions: `api/**` (e.g. `api/kyc/analyze-external.ts`, `api/crm/**`, `api/v1/advertisers/**`); shared auth guards + admin client in `api/_lib/supabase.ts`.
- DB schema source of truth: **the live Supabase project** (`sgtmwdlycllbbavrqgzm`). Migration files: `supabase/migrations/` (only partially backfilled — see that folder's README and Gotchas).
- Route guards: `src/app/trading/components/layout/ProtectedRoute.tsx` (UI-only; real authz is at the DB/RPC layer).
- `artifacts/api-server` + `lib/*`: an Express/Drizzle scaffold that is **not part of the deployed product** — the client talks to Supabase directly. Kept building/typechecking but currently inert.

## Architecture decisions

- The client talks **directly** to Supabase with the anon/authenticated key; correctness therefore depends entirely on RLS being enabled and correct on every table. (An audit on 2026-07-17 found 7 tables with policies but RLS disabled and fixed them — see `final_audit/`.)
- Balance-affecting actions (`approve_deposit`, `approve_withdrawal`, `execute_spot_trade`) live in `SECURITY DEFINER` Postgres functions with explicit internal role/ownership checks and row locking — never trusted to client code.
- Staff-only HTTP actions live in `api/**` and re-check the caller's role server-side (`requireAdmin`/`requireCrmAdmin`/`requireCrmStaff`/`requireKycReviewer`), not via the client route guard.
- `api/tsconfig.json` includes `"dom"` in `lib` so global `fetch`/`Response` typing doesn't depend on `@types/node` resolution differing between local and Vercel builds.
- KYC AI output is sanitized fail-safe (`normalizeResult`): an unrecognized decision becomes `escalate`, never `approve`.

## Product

- Clients: register → KYC verification → deposit → trade (margin, forex, spot) → portfolio, rewards/gamification, referrals, notifications, support tickets, live chat.
- Staff (role-gated): approve/reject KYC, approve deposits/withdrawals, market control, pre-market contract management, support inbox; CRM — leads/kanban, clients, tasks, messages, sales scripts, telephony, workflows, VIP.

## User preferences

- Feature requests typically arrive in Russian; implement, commit, push, open/refresh the PR, and let the owner merge.
- Never print secret values (`.env`, tokens, keys, `DATABASE_URL`, service-role key) in chat or artifacts.

## Gotchas

- **`api/` is a separate workspace package with its own tsconfig and is NOT covered by the root `pnpm run typecheck`.** Always typecheck it separately. A green root build does not mean the serverless functions compile — this exact gap once caused a Vercel build failure.
- **Vercel deploys every `api/**/*.ts` as a serverless function.** Test files (`*.test.ts`) are kept out of the deploy via `.vercelignore` — don't remove that exclusion or test files become bogus endpoints.
- **Enabling RLS on a table with existing-but-inert policies is a real behavior change.** Verify staff and client access still work (role impersonation in SQL, or a browser pass) after any such change.
- **Migration history is only partially in git** (`supabase/migrations/` was backfilled starting 2026-07-17). Older schema exists only as remote Supabase state. Capture every new change as a committed migration file going forward.
- Supabase Auth "leaked password protection" is currently disabled — enable it in the Supabase Auth dashboard settings.

## Pointers

- Full audit, findings, and repair evidence: `final_audit/`
- Migration state and go-forward workflow: `supabase/migrations/README.md`
- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
