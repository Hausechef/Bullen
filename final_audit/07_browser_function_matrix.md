# 07 — Browser Function Matrix

**BROWSER_AUDIT = NOT_AVAILABLE.** This sandbox's outbound network is restricted to an
allowlisted proxy; both `curl` and the `WebFetch` tool returned HTTP 403 against the live Vercel
preview URL and the Supabase host (confirmed against `example.com` as a neutral control, which
also 403'd — this is a blanket egress policy, not something specific to this app). Chromium is
pre-installed in this environment, but a Playwright session would need the same blocked network
path to reach the deployed app, so it was not attempted after the curl/WebFetch test confirmed
the block. No claim below states or implies that any element was clicked, rendered, or observed
in a live browser.

## Is this a release blocker?

**No**, based on the following non-browser evidence, but this is an honest risk call, not a
verified-clean claim:
- The production build succeeds (`vite build`, 06_test_build_evidence.md) — the app is structurally sound enough to compile and bundle.
- Vercel's own build/deploy pipeline (external ground truth, observed via GitHub webhook activity in this PR) reported `Ready` for the commits pushed this session.
- This codebase has an established history of prior PRs (#17–#25) in this same project that were merged and are presumably running in production without reported breakage — this audit did not re-verify those, but their existence is corroborating (not conclusive) evidence the deployment pipeline and general app shell work.
- The two P0/P1 fixes made this session were database-layer (RLS) and build-config (tsconfig) changes — neither alters any client-side rendering logic, route structure, or component tree, so the blast radius for a *new* UI regression from this session's changes specifically is low.

If the project owner wants actual browser verification, it must happen outside this sandbox
(local dev machine, a CI browser runner, or a Claude Code session with unrestricted network).

## Manual test matrix (routes enumerated from `App.tsx`; NOT executed this session — for the owner or a follow-up session with network access)

| Route | Element/Action | Expected | Desktop | Mobile (375/390/768px) | Status |
|---|---|---|---|---|---|
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth forms, submit, validation messages | Successful auth transitions to `/trade/dashboard`; invalid input shows inline errors | NOT_RUN | NOT_RUN | NOT_RUN |
| `/trade/dashboard` | Promo banners, widgets, Live Analysts / Trading Desk widget (redesigned this PR) | Loads without console errors; widget shows live-ish drifting count | NOT_RUN | NOT_RUN | NOT_RUN |
| `/trade/markets`, `/trade/terminal` | Market list, order entry, positions panel | Real-time price updates render; order placement round-trips | NOT_RUN | NOT_RUN | NOT_RUN |
| `/trade/pre-market` | Asset cards, contract modal, sign flow | Contract renders with live price snapshot; signature RPC succeeds | NOT_RUN | NOT_RUN | NOT_RUN |
| `/trade/portfolio` | Spot holdings, buy/sell modal | `execute_spot_trade` RPC succeeds/fails with correct messaging | NOT_RUN | NOT_RUN | NOT_RUN |
| `/trade/kyc` | Document upload, status display | Upload succeeds; staff-side AI triage reachable (server route fixed this session) | NOT_RUN | NOT_RUN | NOT_RUN |
| `/trade/support` | Ticket creation, comment thread | Client can create a ticket and see only their own comments (IDOR fixed this session — this is the highest-value manual re-test target) | NOT_RUN | NOT_RUN | NOT_RUN |
| `/trade/notifications` | Notification bell, realtime toast | Toast fires on new `notifications` row insert | NOT_RUN | NOT_RUN | NOT_RUN |
| Client sidebar (all `/trade/*` items) | New 3D icon set (this PR) | Icons render, no broken image placeholders, hover/active states correct | NOT_RUN | NOT_RUN | NOT_RUN |
| `/admin/*` (dashboard, users, deposits, withdrawals, kyc-review, market-control, support inbox) | Approve/reject actions, badges, realtime counts | `AdminProtectedRoute` blocks non-admin; support-ticket badge/toast fires on new ticket (this PR) | NOT_RUN | NOT_RUN | NOT_RUN |
| `/crm/*` (leads/kanban, tickets, tasks, messages, sales-scripts) | CRUD flows now gated by RLS fixed this session | Staff roles retain access (regression risk from AUDIT-002/003 fix — this is the second highest-value manual re-test target) | NOT_RUN | NOT_RUN | NOT_RUN |
| `/legal/*` | Lazy-loaded legal pages (perf fix, prior round) | Route loads without a blank flash or chunk-load error | NOT_RUN | NOT_RUN | NOT_RUN |
| `/unauthorized` | Redirect target for role mismatch | Shown when a non-admin hits `/admin/*` | NOT_RUN | NOT_RUN | NOT_RUN |

## Priority for a follow-up manual/browser pass

1. **`/trade/support` and `/crm/tickets`** — directly exercises the AUDIT-003 IDOR fix; confirm a client still sees their own ticket thread and a staff member can still reply, since the policy rewrite is the single highest-risk change this session made to a user-facing flow.
2. **`/crm/tasks`, `/crm/messages`, `/crm/leads` (kanban)** — exercises the AUDIT-002 RLS-enable fix; confirm staff roles (agent/manager/director/admin/crm_admin) retain the access they had before, since flipping RLS on is the kind of change that *should* be a no-op for correctly-scoped policies but is exactly the kind of change most likely to reveal a policy gap if one exists.
3. **Client sidebar icon rendering** and **Live Analysts widget** — lowest risk (pure presentational changes from prior rounds in this PR), but easy to verify visually.
