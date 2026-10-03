---
name: Bullenhaus CRM setup
description: Supabase project details, account roster, DB tables, and key decisions for the Bullenhaus trading/CRM platform
---

## Supabase project
- Project ref: `sgtmwdlycllbbavrqgzm`
- CLI at `/tmp/supabase` (v2.101.0); `db push --project-ref` is NOT supported — use `db push --linked` or push SQL via Management API: `POST https://api.supabase.com/v1/projects/<ref>/database/query`

## Supabase client in frontend
- The browser Supabase client lives at `src/lib/supabase/browserClient.ts` (exports `supabase` and `getSupabaseBrowserClient`)
- Import as: `import { supabase } from "../../../lib/supabase/browserClient"` (adjust relative depth)
- NOT `client.ts` — that file does not exist

## DB schema
- `public.users`: id, email, full_name, balance, realized_pnl, margin_used, kyc_status, `role` (not `unified_role`), created_at, updated_at
- `public.transactions`: id, user_id, type (DEPOSIT/WITHDRAWAL/TRADE), status (PENDING/COMPLETED/FAILED), amount, instructions, created_at, updated_at
- `public.leads`: id, name, first_name, last_name, email, phone, stage (NEW_INQUIRY/IN_DISCUSSION/PENDING_KYC/FUNDED), capacity, timezone, notes, acquisition_source (jsonb), assigned_agent_id, created_at, updated_at
- `public.clients`: id, full_name, email, phone, country, balance, kyc_status, assigned_agent_id, user_id, notes, created_at, updated_at
- RLS policies for leads/clients use `role` column (not `unified_role`) from `public.users`

**Why:** Migration 01 defined `unified_role` but migration 02 renamed it to `role`. All queries and RLS must use `role`.

## RLS note
- Migrations 02+ use `role` column (migration 01 used `unified_role` — already cleaned up). When writing new policies always use `role`.
- Always use `public.get_my_role()` (security definer) in RLS policies on `users`/`transactions` to avoid infinite recursion.
- CRM workers (agent/manager/director/admin) need two key policies to read client data:
  - `"CRM workers can view client profiles"` on `users` (filters by `role='client'`)
  - `"CRM workers can view all transactions"` on `transactions` (migration 06)

## Account roster shape (no creds — see Supabase dashboard for current values)
- Two superuser-style accounts under `@bullenhaus.io`: one with DB role `admin` (full CRM + Trade Admin), one with `trade_admin` (Trade Admin only, CRM blocked).
- CRM workforce under `@aurelius-desk.crm`: 1 admin + 2 directors + 2 managers + 10 agents.
- A handful of `client` accounts for end-to-end trade flow testing.
- All non-client accounts must have `user_metadata.role` mirrored in `auth.users` for JWT claims to carry the role.

## Role separation: trade_admin vs admin
- `trade_admin` role added to CHECK constraint on `public.users`
- Trading platform (`AuthContext`, `AdminProtectedRoute`, `AdminLayout`, `Sidebar`, `Login`, `AuthLayout`) treats `trade_admin` same as `admin` — full access to `/admin/*`
- CRM `auth.ts` `mapRole()` throws "Нет доступа" for any role not in `['admin','director','manager','agent']` — blocks `trade_admin`

## Role sync
- `user_metadata.role` sync via: `PUT {SUPABASE_URL}/auth/v1/admin/users/{uid}` with `{"user_metadata": {"role": "<role>"}}`
- Run after creating any new CRM worker to ensure role is in JWT claims

## Stub-enabling decisions
- `support_tickets` table: id, user_id, user_email, category, message, status (default 'open'), created_at — RLS: any auth can insert, users can select own, admins all
- `AdminOverview.tsx` (at `/admin/dashboard`) is the real admin landing page; `AdminDashboard.tsx` is an orphaned file not routed anywhere
- Admin notification paths in MainLayout: `/admin/kyc` and `/admin/deposits` (NOT `/trade/admin/*`)
- `Transactions.tsx` now queries Supabase directly (removed legacy `safeLegacyApiFetch`); shows expandable `payment_details` via `PaymentDetailsDisplay`
- `ProfileSettings.tsx` saves to both `supabase.auth.updateUser` AND `public.users` table in a single flow

## CRM pages need LanguageProvider wrapper
- Every CRM page (and the CRM `Layout` itself) calls `useI18n()` from `app/crm/lib/i18n.tsx`, which **throws** when no `LanguageProvider` is mounted.
- The unified `src/App.tsx` is the only entry point now; the old `app/crm/main.tsx` is dead. The CRM wrapper in `App.tsx` MUST wrap its `<Outlet>` in `<LanguageProvider>`, otherwise every `/crm/*` route renders a black screen + React error boundary.
- **Why:** standalone CRM entry used to mount the provider; when migrating to the unified router that wiring was easy to miss. Same pattern applies to any future hooks that throw without their provider — check provider mounting whenever adding a CRM page.

## users table — extended columns (migration 12)
- Added: `first_name text`, `last_name text`, `country text` to `public.users`
- Added: `public.telephony_numbers` table (id, phone_number, label, provider, assigned_agent_id, is_active) with RLS: admin/director full CRUD, agents SELECT own
- `useClients.ts` mapUser prefers explicit `first_name`/`last_name` over splitting `full_name`
- Register.tsx now collects first_name, last_name, country, phone — upserts into users table after signUp

## Telephony role-based access
- `PhoneDialerProvider` requires `role` prop; only renders `<PhoneDialer>` + `openDialer` for role='agent'
- Call buttons in VIPClients and AgentWorkspace are hidden for non-agent roles via `isAgent` prop
- Admin/Director get `/crm/telephony` (TelephonySettings.tsx) — manage numbers, assign to agents
- Agent gets `/crm/my-clients` (AgentClients.tsx) — their assigned clients only, no KYC tab

## useWalletSync — read Supabase directly
- `useWalletSync.ts` must query `supabase.from('users').select('balance, realized_pnl, margin_used')` directly (not via any `profile` variable). An earlier version referenced an undefined `profile` and silently caught the ReferenceError, leaving wallet stuck at 0.
- **Why:** there's no in-scope `profile`/`useProfile` context in trading; the source of truth is the Supabase `users` row keyed by `auth.user.id`.
