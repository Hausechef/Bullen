# 01 — Source Inventory

## Workspace packages (pnpm-workspace.yaml)

| Package | Path | Role | Built by Vercel `buildCommand`? |
|---|---|---|---|
| `@workspace/bullenhaus` | `artifacts/bullenhaus` | Client trading app (React/Vite SPA) — the deployed frontend | **Yes** — sole target of `vercel.json` `buildCommand` |
| `@workspace/api-server` | `artifacts/api-server` | Express 5 + Drizzle backend (dev-mode API server per `replit.md`) | No — builds and typechecks clean locally, but not wired into `vercel.json`; its role in production is UNKNOWN from static inspection alone (see 02_project_map.md, Risk R-1) |
| `@workspace/api-functions` | `api` | Vercel serverless functions (`/api/**`), deployed by Vercel's zero-config Node builder, independent of `buildCommand` | Deployed separately by Vercel platform convention |
| `mockup-sandbox` | `artifacts/mockup-sandbox` | Design/mockup sandbox app | No |
| `lib/db`, `lib/api-client-react`, `lib/api-spec`, `lib/api-zod` | `lib/*` | Shared Drizzle schema / generated API client / Zod schemas, consumed by `api-server` | Indirectly, if `api-server` is in the live path |
| `scripts` | `scripts` | One-off/maintenance scripts | No |

## Client app route inventory (`artifacts/bullenhaus/src/App.tsx`, 38 page components under `src/app/trading/pages`)

Public: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/legal/{terms,privacy,aml,contact,corporate}`, `/unauthorized`.

Client (behind `ProtectedRoute`, `/trade/*`): `dashboard`, `markets`, `terminal`, `pre-market`, `portfolio`, `transactions`, `gamification`, `referrals`, `notifications`, `kyc`, `settings`, `support`.

Admin/trading-admin (behind `AdminProtectedRoute`, `/admin/*`): dashboard/overview, users, deposits, withdrawals, kyc-review, market-control, pre-market admin, support inbox.

CRM/backoffice (`/crm/*`, separate role set — agent/manager/director/crm_admin): leads/kanban, my-clients, clients, tickets, tasks, messages, sales-scripts, telephony, calls, ai-insights, workflows, vip, crm-sync, workspace, manager dashboard.

## Server-side surface

- `api/kyc/analyze-external.ts` — AI-assisted KYC document triage (fixed this session, see 05_repair_ledger.md AUDIT-001).
- `api/ai/chat.ts` — AI live-chat backend, same `fetchWithTimeout`/`Response` pattern as KYC.
- `api/crm/workers/index.ts`, `api/crm/workers/[id].ts`, `api/crm/workers/[id]/reset-password.ts` — staff account management, gated by `requireAdmin`.
- `api/crm/clients/[id]/files/index.ts` — client file attachments (CRM), gated by `requireCrmStaff`, storage-path-scoped, MIME/size validated.
- `api/v1/advertisers/**` — affiliate/referral-code management, gated by `requireCrmAdmin`.
- `api/_lib/supabase.ts` — shared `getAdminClient()` (service-role client) and `requireAdmin`/`requireCrmAdmin`/`requireCrmStaff`/`requireKycReviewer` auth guards used by every route above.

## Database (live Supabase project `sgtmwdlycllbbavrqgzm`, public schema)

No migration files exist in the repository (`supabase/migrations/` is empty) — schema state was read directly from the live database via `list_tables`/`execute_sql`. Notable tables actually queried in this audit: `users`, `transactions`, `notifications`, `support_tickets`, `ticket_comments`, `tasks`, `messages`, `message_templates`, `sales_scripts`, `lead_stage_history`, `leads`, `lead_assignment_log`, `spot_holdings`, `spot_trades`, `positions`, `orders`, `premarket_assets`, `premarket_contract_signatures`, `advertisers`, `referral_codes`, `client_files`, `ai_settings`. Storage buckets referenced: `premarket_contracts` (public), `client-files`.

## Documentation present

- `replit.md` — unfilled boilerplate template (every section still has its placeholder instruction text; see 03/04 finding AUDIT-010).
- No `README.md` at repo root.
- Root-level stray files from an earlier (pre-this-session) audit/migration pass: `AUDIT_REPORT.md`, `AUDIT_CANDIDATES.md`, `PROJECT_AUDIT.md`, `apply_migrations_phase{1,2,3}*.sql`, `bullenhaus_full_migration.txt`, `git_status*.txt`, `confirm_all_users.txt`, `find_constraint.sql`, `fix_tickets_policies.sql`. These are treated per the task brief as **auxiliary, non-authoritative** inputs only — their content was not used as evidence for any finding below; only live inspection of the actual code/DB was used. Their continued presence at repo root is itself a minor hygiene finding (see 04, AUDIT-011).

## Testing / quality infrastructure present

None: no `*.test.*`/`*.spec.*` files, no ESLint config, no `.github/workflows`. `package.json` scripts are limited to `preinstall`, `build`, `typecheck`, `typecheck:libs` at the root, and `dev`/`build`/`serve`/`typecheck` in `artifacts/bullenhaus`.
