# 05 — Repair Ledger

Each entry follows the required fix-cycle: re-open → confirm still-actual → minimal diff → fix →
list changed files/objects → local verification → regression check → git diff review → secret
check → micro-audit → status.

## AUDIT-001 — Vercel TS build failure in `api/kyc/analyze-external.ts`

- **Re-confirmed actual:** Yes — user-pasted build log, reproduced the root cause via local `tsc` comparison.
- **Minimal diff:** `api/tsconfig.json`, `"lib": ["es2022"]` → `"lib": ["es2022", "dom"]`. One line.
- **Changed files:** `api/tsconfig.json`.
- **Local verification:** `cd api && npx tsc --noEmit -p tsconfig.json` — exit 0, before and after.
- **Regression check:** Same command also covers `api/ai/chat.ts` (the only other file using `fetch`/`Response` in `api/`) — clean.
- **Git diff reviewed:** Yes, single-line change, no unrelated edits.
- **Secret check:** N/A, no secret-shaped content in this file.
- **Micro-audit:** Confirmed no other `api/*.ts` file relies on `lib: dom` types that could now shadow a Node-specific type in a breaking way (none use `window`/`document`/browser-only globals).
- **Status: ERROR_CLOSED.** Pushed as commit `d6e940b`; Vercel bot PR comment on this commit reports `Ready`.

## AUDIT-002 — RLS disabled on 7 policy-bearing tables (P0)

- **Re-confirmed actual:** Yes — live `get_advisors(type=security)` call, `ERROR` level, cross-checked against `pg_class.relrowsecurity`.
- **Minimal diff:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for `lead_stage_history`, `message_templates`, `messages`, `sales_scripts`, `support_tickets`, `tasks`, `ticket_comments`. No table structure or data changed.
- **Changed objects:** 7 table RLS flags (production Supabase, migration `enable_rls_on_exposed_tables_and_fix_ticket_comments_idor`).
- **Local verification:** Re-queried `pg_class.relrowsecurity` post-fix — `true` for all 7.
- **Regression check:** Read every existing policy on all 7 tables *before* flipping RLS on, to confirm the policies already cover the app's real access patterns (staff roles get broad access via `get_my_role()` checks; clients get row-scoped access via `auth.uid()` matches) — this was done specifically to avoid silently breaking legitimate functionality that RLS-off had been (unintentionally) allowing.
- **Git diff reviewed:** N/A (DB migration, not a file change) — migration SQL itself was written to touch only the 7 named tables.
- **Secret check:** N/A.
- **Micro-audit:** Re-ran `get_advisors(type=security)` after the fix — zero `ERROR`-level findings remain (was 7).
- **Status: ERROR_CLOSED.**

## AUDIT-003 — `ticket_comments` IDOR (P1)

- **Re-confirmed actual:** Yes — read live policy `qual`/`with_check` clauses before the fix, confirmed no ticket-ownership check existed for the `client` role branch.
- **Minimal diff:** Replaced `ticket_comments_read` and `ticket_comments_insert` policies to additionally require `EXISTS (... support_tickets st WHERE st.id = ticket_comments.ticket_id AND st.client_id = auth.uid())` alongside the unchanged staff-role branch.
- **Changed objects:** 2 RLS policies on `public.ticket_comments` (same migration as AUDIT-002).
- **Local verification:** Read back the new policy `qual`/`with_check` via `pg_policies` post-fix.
- **Regression check:** Staff-role branch condition copied verbatim from the original policy (not rewritten), so the admin/agent reply flow this PR's earlier work built is unaffected.
- **Git diff reviewed:** N/A (DB migration).
- **Secret check:** N/A.
- **Micro-audit:** Confirmed `ticket_comments.ticket_id`/`support_tickets.client_id` column types (`uuid`) match for the join, avoiding a silent-no-op policy from a type mismatch.
- **Status: ERROR_CLOSED.**

## AUDIT-004 — Public listing of `premarket_contracts` bucket (P2)

- **Re-confirmed actual:** Yes — live `get_advisors(type=security)`, `WARN`, `public_bucket_allows_listing`.
- **Minimal diff:** Dropped the `public`-role `SELECT` policy on `storage.objects` for this bucket, replaced with one scoped to `authenticated` + admin/trade_admin/superadmin role check (matching the bucket's existing INSERT/UPDATE/DELETE policies).
- **Changed objects:** 1 RLS policy on `storage.objects` (bucket-scoped).
- **Local verification:** Confirmed bucket `public = true` (object GET bypasses RLS by platform design, independent of this policy) and grepped the client codebase for any `.list()`/enumeration call against this bucket outside the one admin-only health-check.
- **Regression check:** Live HTTP verification of "public URL GET still works, listing is now blocked" was **attempted and NOT_AVAILABLE** — egress proxy in this sandbox returned 403 for both the Supabase host and a neutral control host (`example.com`), so this could not be empirically confirmed from within the session. This is disclosed as a residual verification gap, not claimed as tested.
- **Git diff reviewed:** N/A (DB migration).
- **Secret check:** N/A.
- **Micro-audit:** n/a beyond the above.
- **Status: ERROR_CLOSED, with a disclosed verification gap** (see 11_final_release_report.md Honest Limitations).

## AUDIT-005 — Mutable `search_path` on 6 functions (P3)

- **Minimal diff:** `ALTER FUNCTION ... SET search_path = public` for `set_updated_at`, `set_workflows_updated_at`, `sign_premarket_contract(text,uuid)`, `execute_spot_trade(text,text,numeric,numeric)`, `get_my_gamification_stats()`, `get_gamification_leaderboard(integer)`.
- **Changed objects:** 6 function metadata attributes (no function body touched).
- **Verification:** Re-ran advisor post-fix — 0 `function_search_path_mutable` findings (was 6).
- **Status: ERROR_CLOSED.**

## AUDIT-006 — `SECURITY DEFINER` anon/authenticated executability (P3, investigated)

- **Action:** Read the full body of every flagged function via `pg_get_functiondef`. Determined all 11 flagged functions are safe as-is (internal role checks, `auth.uid()` scoping, intentionally-public read data, or trigger-only functions Postgres won't execute outside trigger context).
- **Status: FALSE_POSITIVE for actual exploitability** — advisory left as owner-visible WARN, not force-closed by revoking grants, since doing so on financial-approval functions without a live regression test is a bigger risk than the WARN itself.

## AUDIT-008 — `.gitignore` missing `.env` (P2)

- **Minimal diff:** Added `.env`, `.env.*`, `!.env.example` to `.gitignore`.
- **Changed files:** `.gitignore`.
- **Verification:** `git status` clean, no unintended files newly ignored (`.env.example` still tracked).
- **Status: ERROR_CLOSED.** Pushed as commit `d85e4c1`; Vercel bot PR comment on this commit reports `Ready`.

## Changed-files ledger (this audit session, cumulative)

| File / Object | Type | Related Finding | Commit |
|---|---|---|---|
| `api/tsconfig.json` | file | AUDIT-001 | `d6e940b` |
| `.gitignore` | file | AUDIT-008 | `d85e4c1` |
| 7x `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` | production DB migration | AUDIT-002 | Supabase migration `enable_rls_on_exposed_tables_and_fix_ticket_comments_idor` |
| `ticket_comments_read`, `ticket_comments_insert` policies | production DB migration | AUDIT-003 | same migration as above |
| 6x `ALTER FUNCTION ... SET search_path` | production DB migration | AUDIT-005 | Supabase migration `pin_search_path_on_definer_and_trigger_functions` |
| `storage.objects` SELECT policy for `premarket_contracts` | production DB migration | AUDIT-004 | Supabase migration `restrict_premarket_contracts_bucket_listing` |
| `final_audit/*.md` | new files | audit deliverable | (this commit, see below) |

No secrets were introduced by any of the above — confirmed by re-reading every diff before commit; the DB migrations contain no credential values (only role-name string literals like `'admin'`).
