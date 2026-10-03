# 00 — Audit State & Capability Intake

## Scope statement (read this first)

This audit was run inside a single sandboxed agent session against the live repository and
the live production Supabase project. It is real, evidence-based work — every claim below is
backed by an actual command, query, or file read, not inference. It is **not** an exhaustive
enterprise QA pass: there is no test suite, no CI, and no live browser access in this sandbox
(see Capability Table). Where full coverage wasn't possible, that is stated explicitly rather
than implied.

## Capability Table

| Capability | Status | Tool | Authentication | Limitations | Required For |
|---|---|---|---|---|---|
| Read/edit files | AVAILABLE | Read/Edit/Write/Grep/Glob | n/a | none observed | all phases |
| Shell/terminal | AVAILABLE | Bash | n/a | sandboxed, no arbitrary outbound network | build/typecheck/grep |
| Git | AVAILABLE | Bash | proxy-injected credentials | push goes through local git proxy | changes, history |
| GitHub | AVAILABLE | github MCP tools | app-scoped to this repo | — | PR state, webhook events |
| Database (Supabase) | AVAILABLE | Supabase MCP | project-scoped service creds | `execute_sql`/`apply_migration` operate directly on **production** — no branch/staging DB was used | schema, RLS, advisors, live fixes |
| Outbound HTTPS to arbitrary hosts | **NOT_AVAILABLE** | curl / WebFetch | — | Egress proxy returns 403 for non-allowlisted hosts (confirmed against `supabase.co`, the live Vercel preview URL, and `example.com` as a control) | live smoke test, curl verification |
| Browser automation (Playwright) | **NOT_AVAILABLE (in practice)** | pre-installed Chromium | — | Chromium would need the same blocked network path to reach the deployed app; not attempted after the curl/WebFetch egress test confirmed the block | Browser Function Matrix |
| CI | NOT_AVAILABLE | — | — | No `.github/workflows` exist in this repo | automated regression gate |
| Lint | NOT_AVAILABLE | — | — | No ESLint config found anywhere in the workspace (`.eslintrc*`/`eslint.config.*` absent); no `lint` script in any `package.json` | static quality gate |
| Unit/integration tests | NOT_AVAILABLE | — | — | No `*.test.*`/`*.spec.*` files anywhere in `artifacts/`, `api/`, or `lib/`; no `test` script | regression safety net |
| Typecheck | AVAILABLE | `pnpm run typecheck` (root) + `npx tsc --noEmit` (api/) | — | none | Phase 1/4 |
| Build | AVAILABLE | `pnpm run build` | — | none | Phase 1/4 |
| Production deployment | NOT_NEEDED (already live) | Vercel (GitHub-integrated) | webhook-observed only | Deploys are triggered by push automatically; verified via Vercel bot PR comments, not console access | Phase 5 |

## PROJECT STATE

- **Project purpose:** Bullenhaus — a trading platform (margin/forex/spot crypto) with a client-facing app and a separate CRM/admin backoffice for staff (agents, managers, KYC reviewers, support).
- **Target users:** Retail trading clients (client role) and internal staff (agent/manager/director/admin/trade_admin/crm_admin roles).
- **Core user outcome:** A client can register, get verified (KYC), deposit, trade (margin + spot), view portfolio/rewards, and get support. Staff can manage clients, approve KYC/deposits/withdrawals, and run CRM workflows (leads, tickets, tasks).
- **Production scope (this audit):** The currently open PR (#26, branch `claude/kyc-workflow-72v84z`) plus the pre-existing `main` state it builds on — i.e., the whole live product, not just the diff. Database checks ran against the actual production Supabase project since there is no separate staging project.
- **Repository root:** `/home/user/Bullenhaus` (GitHub: `eyeofmasona-sudo/Bullenhaus`).
- **Applications/packages (pnpm workspace):** `artifacts/bullenhaus` (client trading app, Vite+React, this is what Vercel builds via `buildCommand`), `artifacts/api-server` (Express+Drizzle backend, built but not confirmed to be the thing Vercel serves — see 02_project_map.md), `artifacts/mockup-sandbox`, `lib/*` (shared db/api-client/zod packages), `scripts`, `api` (Vercel serverless functions, separate deploy path from `vercel.json`'s `buildCommand`).
- **Stack:** React 18 + Vite + TypeScript, Tailwind v4, Zustand, React Router v6, Framer Motion; Supabase (Postgres + RLS + Realtime + Auth) as the actual runtime datastore for the live app.
- **Database:** Supabase Postgres, project `sgtmwdlycllbbavrqgzm`. **No migration files are tracked in the repo** — `supabase/migrations/` is empty; all schema history lives only in the live database (see 04 finding AUDIT-009).
- **Authentication:** Supabase Auth (JWT), role stored in `public.users.role`, checked both client-side (route guards) and server-side (RLS policies + `get_my_role()` in RPCs + `requireAdmin`/`requireCrmAdmin`/`requireCrmStaff`/`requireKycReviewer` in `api/_lib/supabase.ts`).
- **Integrations:** OpenRouter (AI KYC triage bot, AI live chat), Vercel (hosting), GitHub (source + CI-less deploy trigger).
- **Deployment target:** Vercel, auto-deploy per branch/PR (preview) and on `main` (production). `vercel.json` `buildCommand` only builds `artifacts/bullenhaus`; `api/*.ts` are deployed as Vercel serverless functions via Vercel's own zero-config detection.
- **Current branch:** `claude/kyc-workflow-72v84z`, tracking `origin/claude/kyc-workflow-72v84z`, clean working tree at audit start.
- **Current Git state at audit start:** up to date with `origin/claude/kyc-workflow-72v84z` (commit `d6e940b`), no uncommitted changes.
- **Available verification tools:** git, pnpm/tsc/vite build pipeline, Supabase MCP (schema + advisors + live SQL/migration), GitHub MCP (PR/webhook state).
- **Confirmed blockers:** no outbound network to the live app (browser/HTTP audit), no test suite, no lint, no CI, no local migration history.
- **Audit scope:** repo-wide static/config/security audit + live Supabase schema/RLS/advisor audit + targeted source review of auth-sensitive code paths (API routes, RPCs, route guards) + build/typecheck regression.
- **Audit exclusions (explicitly NOT_AVAILABLE, not skipped by choice):** live browser functional testing, live HTTP smoke testing, mobile viewport rendering testing, CI pipeline validation (none exists), automated test execution (none exist), production deployment action (already live; no redeploy needed/performed by this audit — the fixes below were pushed as commits, which triggers Vercel's existing auto-deploy).
