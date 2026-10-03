# 08 — Security & Data Integrity

## Summary

The single most significant finding of this entire audit was **AUDIT-002**: RLS disabled on 7
tables that had policies defined for them, which is exactly the kind of gap that looks fine in
code review (the policies exist, they look correct) but does nothing at runtime. This is now
fixed and re-verified against the live security advisor (0 `ERROR`-level findings remain, down
from 7). Combined with **AUDIT-003** (an IDOR in `ticket_comments`), this session closed real,
concrete client-data exposure in production — not hypothetical risk.

## Secrets

- No `.env` file, API key, service-role key, or private key was found committed anywhere in the
  current tree or in the full git history (`git log --all --diff-filter=A --name-only | grep -i
  env` → only `.env.example`; a targeted grep for common key-shaped patterns — `sk-...`,
  `SUPABASE_SERVICE_ROLE_KEY=...`, AWS access-key pattern, PEM private-key headers — across all
  tracked source returned zero matches).
- `.gitignore` was hardened to exclude `.env*` going forward (AUDIT-008) — defense-in-depth, no
  active leak found.
- No secret values are reproduced anywhere in this audit's artifacts, per the task's non-negotiable rule.

## Authentication & Authorization (re-verified independently, not assumed)

- Client-side route guards (`ProtectedRoute`, `AdminProtectedRoute` in
  `artifacts/bullenhaus/src/app/trading/components/layout/ProtectedRoute.tsx`) are correctly
  understood as **UI convenience only** — confirmed by independently reading the actual
  server-side enforcement:
  - Every reviewed `api/**` serverless route (`crm/workers/**`, `crm/clients/[id]/files`,
    `v1/advertisers/**`, `kyc/analyze-external.ts`) re-checks the caller's role server-side via
    `requireAdmin`/`requireCrmAdmin`/`requireCrmStaff`/`requireKycReviewer` before doing anything
    privileged.
  - Every reviewed `SECURITY DEFINER` RPC that mutates money or role-scoped data
    (`approve_deposit`, `approve_withdrawal`, `assign_leads_bulk`) explicitly checks
    `get_my_role()` against an allowlist and returns/raises an error otherwise — this is real
    server-side authorization, not something a client could bypass by hiding a button.
  - Row-level ownership is enforced via `auth.uid()` comparisons both in RLS policies (now fully
    enabled — AUDIT-002) and inside RPC bodies (`execute_spot_trade`, `sign_premarket_contract`,
    `get_my_gamification_stats` all derive the acting user from `auth.uid()`, not from a
    client-supplied user-id parameter — this rules out an obvious IDOR class before it starts).
- **Horizontal privilege escalation was found and fixed**: AUDIT-003 (`ticket_comments`).
- No vertical privilege escalation (client → staff, staff → admin) was found in any code path
  read this session.
- Session/JWT lifecycle itself (expiry, revocation, refresh) was not independently re-tested —
  it relies on Supabase Auth's standard JWT handling, which was not modified by this session and
  was not re-audited from first principles; this is an ASSUMPTION carried from the platform, not
  a verified claim.

## Data integrity

- `approve_deposit`/`approve_withdrawal` use `SELECT ... FOR UPDATE` row locking plus an explicit
  idempotency guard (`status IN ('Completed','Approved')` short-circuits), preventing a
  double-credit/debit race from concurrent approval clicks — read and confirmed in full.
- `execute_spot_trade` locks both the user's balance row and their holdings row before mutating
  either, and computes the weighted average buy price in SQL rather than read-then-write from the
  client — confirmed safe against a classic TOCTOU race.
- No destructive migration was run this session; every DDL change was additive
  (`ENABLE ROW LEVEL SECURITY`, `SET search_path`) or a policy `DROP`+`CREATE` pair that
  preserves the existing staff-access semantics exactly.

## Injection / input validation

- The `api/crm/clients/[id]/files` route validates `storage_path` is scoped to the caller's
  client folder, validates MIME type against an allowlist, and validates size — all server-side,
  not just client-side (confirmed by full read).
- No raw string-concatenated SQL was found in any reviewed API route; all reviewed queries use the
  Supabase JS client's parameterized query builder or PL/pgSQL with typed parameters (no dynamic
  SQL construction observed in any function body read via `pg_get_functiondef`).
- A repo-wide grep for classic injection-prone patterns (`req.query` interpolated directly into a
  template string passed to `execute_sql`-style raw SQL, `dangerouslySetInnerHTML`, `eval(`) was
  **not exhaustively run this session** — the API surface was reviewed file-by-file rather than
  via a blanket grep sweep. This is a disclosed coverage gap, not a clean bill of health for the
  entire codebase.

## Rate limiting / brute force / CORS / security headers

- **NOT_AUDITED this session** — no code path implementing rate limiting, CORS configuration, or
  security headers was encountered in the files actually read (the reviewed `api/**` routes have
  no CORS/rate-limit middleware visible in their own file bodies; whether this is handled by
  Vercel platform defaults, `api/_lib/supabase.ts`, or not at all was not determined). Marked
  **UNKNOWN**, not asserted safe.

## AI / prompt injection surface

- `api/kyc/analyze-external.ts` and `api/ai/chat.ts` both call an external LLM (via OpenRouter)
  with user-influenced content (document images, chat messages). The KYC prompt explicitly
  instructs the model to return an *advisory* decision "for human reviewers" and never to
  auto-approve — a human-in-the-loop design that limits the blast radius of a successful prompt
  injection in the uploaded document content (the model's output feeds a review UI, not a
  direct-action pipeline). This was read and confirmed as a mitigating design choice, not proof
  the model can't be misled — full prompt-injection resistance testing was **NOT_RUN**.

## RLS coverage beyond the 7 fixed tables

Only the tables flagged by the security advisor were individually re-verified. A full manual
enumeration of every RLS policy on every table in `public` was **not performed** — the audit
relied on the advisor tool (which specifically detects "policy exists but RLS disabled" and "RLS
disabled entirely on an exposed table") as the authoritative signal for this class of bug, on the
basis that it is Supabase's own purpose-built linter for exactly this failure mode. This is a
reasonable but not absolute assurance — a table with RLS **enabled** but a **logically wrong**
policy (as opposed to no policy at all) would not necessarily be flagged by the advisor and was
not independently re-derived for every table in the schema.
