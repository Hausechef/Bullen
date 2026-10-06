# BullenHaus Unification Audit

Audit date: 2026-10-04  
Scope: `D:\Новая папка` (BullenHaus Recovery) and `D:\Новая папка\Bullenhaus-clean` (BullenHaus Trade / CRM).  
Rule observed: no application source was changed during this audit.

## Executive decision

The applications must not be mechanically combined. They run on incompatible application runtimes:

- **Recovery** is a Next.js 16 / React 19 application with Prisma over a local SQLite database, custom bcrypt + JOSE sessions, and filesystem evidence storage.

`Bullenhaus-clean` is the correct integration base: it already owns the Cloud Supabase backend, Trade product, staff CRM, deployment configuration and a single browser session. Recovery must be moved feature-by-feature into this application. The legacy Recovery data layer must remain available and read-only until migration acceptance checks pass.

## Inventory

| Feature | Recovery | Trade / CRM | Unified target | Migration action |
| --- | --- | --- | --- | --- |
| Router | Custom hash router | React Router v6 browser router | React Router v6 | MOVE routes to `/recovery/*`, preserve links where feasible |
| Authentication | Custom bcrypt passwords and JOSE httpOnly `bh_session` JWT | Supabase Auth session, refresh, password reset | Supabase Auth only | REPLACE Recovery auth after identity mapping; remove no live legacy auth before cutover verification |
| Authorization | Server route guards for `CLIENT`, `OPERATOR`, `ADMIN` | Browser guards plus Supabase RLS, roles in `public.users` | Database-enforced RBAC/RLS | REFACTOR to canonical roles; eliminate `user_metadata` role fallback for authorization |
| Database | Prisma + SQLite (`User`, `Case`, `Evidence`, timeline, message, notification, audit event, lead) | Cloud Supabase Postgres (`users`, trading, CRM, lead, task, KYC, ticket, file and workflow entities) | One Supabase Postgres source of truth | MERGE identities into profiles/contacts; migrate Recovery cases as relational Recovery domain records |
| CRM person model | Recovery `User` doubles as client identity | `public.users` acts as both account/profile/client in much of current code | `auth.users` + profiles + canonical contacts + leads | REFACTOR; do not create a third client copy |
| Recovery | Public intake, client portal, operator console, case/timeline/messages/evidence flows | Current CRM recovery queue (`recovery_registrations`) only | Full Recovery module tied to CRM contact and Recovery lead/case | MOVE working Recovery UX and adapt data access |
| Trade | None | Trading terminal, portfolio, transactions, KYC, support, admin | Existing Trade module | KEEP, then refactor shared contact and auth access points |
| CRM | Operator case console and contact lead form only | Full staff CRM: dashboard, workspace, leads, kanban, clients, tasks, tickets, calls, KYC, workflows, recovery queue | Shared CRM core | KEEP then REFACTOR around canonical contacts and generic leads |
| Files | Local `uploads/`, protected by Next route handlers | Supabase Storage client files/KYC handling | Private Supabase Storage buckets | MOVE Recovery evidence only after bucket/RLS/signed URL checks |
| Realtime | None | Realtime subscriptions in CRM hooks and AuthContext | Narrow, refetch-backed subscriptions | KEEP and extend to Recovery case/contact/task changes |
| State | React state plus Zustand intake draft in `sessionStorage` | React context, Zustand stores, React Query | Query/cache only as cache | KEEP non-sensitive UI drafts; REMOVE duplicate auth token storage |

## Recovery architecture

Recovery is a user-facing fraud-recovery product with public pages, a multi-step case intake, an authenticated client portal, an internal operator console, evidence upload/download, timelines, messages, notifications, and audit events.

Its source of truth is currently local SQLite via Prisma (`prisma/schema.prisma`). Identity is a local `User` row with a password hash and a signed `bh_session` cookie. Files are stored beneath `uploads/` on the application filesystem. These choices cannot meet the requested one-cloud-Supabase architecture and must be migrated, not synchronised.

Reusable assets to preserve:

- Recovery information architecture, visual brand system, intake UX, portal UX and operator workflows.
- Input validation vocabulary, ownership checks, file limits and audit-event intent.
- Case, timeline, message, evidence and notification domain semantics.

## Trade / CRM architecture


It already provides Trade routes under `/trade`, internal CRM routes under `/crm`, shared Supabase session restoration, password reset and existing Realtime usage. It contains a partial Recovery queue and a `/recovery -> /crm/recovery` redirect, which is not a replacement for the Recovery client portal and must not be represented as complete unification.

## Security and data findings

1. Recovery uses a separate local identity store, custom JWT session system and local evidence filesystem; retaining it in production would violate the one-auth/one-database requirement.
2. Trade/CRM has role fallbacks from `auth.users.user_metadata` and additional CRM token/role data in `localStorage`. User metadata and client storage must not determine authorization.
3. Current Trade/CRM RLS is present but the data model is centred on `public.users` rather than a canonical `contacts` entity. A contact model, deduplication strategy and role association must precede case migration.
4. The existing `recovery_registrations` migration deliberately states it does not share Trade users, leads, balances or cases. It is therefore an interim queue, not the required shared CRM model.
5. Recovery evidence must be moved to private buckets and served through RLS/signed URL authorization; local disk paths must not become a production dependency.
6. The target contains demo/mock pathways and mock sign-in helpers guarded by `import.meta.env.DEV`; production build and source scans must prove none remain reachable in production.

## Repository and baseline state

- Recovery is a dirty Git worktree with unrelated user-owned modifications and an untracked nested `Bullenhaus-clean` directory. No reset, checkout, deletion, move or overwrite was performed.
- `Bullenhaus-clean` is also dirty. Its uncommitted changes include the partial Recovery redirect/queue work, local-dev removal, deployment configuration edits and a new Recovery migration. Those changes are treated as user-owned pending work until reviewed and explicitly incorporated.
- The Trade / CRM remote is `https://github.com/Hausechef/Bullen.git`; no GitHub mutation has been made.
- Target toolchain observed: Node `v24.18.0`, pnpm `11.19.0`, Bun `1.3.14`.

## Live Supabase snapshot (2026-10-04, read-only)

The authorised CLI is linked to Supabase project `qktqfedvfqxhrtjnmzmi` in
`eu-central-1`. The project is active and healthy. No database mutation was
performed while collecting this snapshot.

- The `public` schema currently contains 33 ordinary tables, including the
  existing Trade, CRM and `recovery_registrations` domains. RLS is enabled on
  every one of those tables.
- `supabase migration list --linked` reports no remote migration history while
  listing eight timestamped local migrations as unapplied. The live schema
  therefore cannot safely be treated as an empty target, and `db push` is
  blocked until the migration baseline is reconciled.
- The live Security Advisor reports mutable `search_path` warnings for
  `set_updated_at`, both premarket-signing functions, `execute_spot_trade`,
  `get_my_gamification_stats`, and `get_gamification_leaderboard`.
- The Advisor also reports that public `SECURITY DEFINER` RPCs are executable
  by `anon`, including balance-affecting `approve_deposit`,
  `approve_withdrawal` and `execute_spot_trade`, alongside lead assignment,
  profile trigger helpers and premarket-signing functions. Whether individual
  functions contain an internal role check does not make public execution a
  safe default; public grants must be reviewed function by function.
- Leaked-password protection is disabled in Supabase Auth.

**Live safety gate:** do not run `supabase db push`, repair migration history,
or revoke function grants in production until a schema snapshot and an
approved function-call inventory identify the intended public RPC surface.

## Classification register

| Area | Classification | Rationale |
| --- | --- | --- |
| Recovery visual identity and screens | KEEP / MOVE | Working differentiated product value; preserve UX while replacing backend bindings |
| Recovery custom auth and Prisma SQLite | REPLACE | Incompatible with the requested Supabase-only identity and source of truth |
| Recovery local uploads | REPLACE | Must become private Supabase Storage with policy enforcement |
| Recovery case/timeline/message semantics | MERGE / REFACTOR | Preserve domain records but connect them to canonical contacts and roles |
| Trade application and trading workflows | KEEP | Already the closest target runtime and Supabase integration |
| Existing CRM screens and hooks | KEEP / REFACTOR | Reuse UI, but move authority from mutable browser state and legacy users table toward RBAC/contact model |
| `recovery_registrations` standalone queue | REFACTOR | Migrate its useful operational data into canonical contact/lead/case relations; do not add a parallel silo |
| Mock auth, mock data and duplicate local auth storage | REMOVE-DEAD-CODE after proof | Keep development-only fixtures only if test-isolated; remove production reachability after replacement is accepted |
