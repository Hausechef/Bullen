# 09 — Deployment Readiness

## Current state

- **Branch:** `claude/kyc-workflow-72v84z`, tracking `origin/claude/kyc-workflow-72v84z`.
- **PR:** #26 (draft), open against `main`, on `eyeofmasona-sudo/Bullenhaus`.
- **Vercel:** GitHub-integrated, auto-deploys a preview per push to this branch and would deploy
  to production on merge to `main`. `buildCommand` is `pnpm --filter @workspace/bullenhaus run
  build`; `outputDirectory` is `artifacts/bullenhaus/dist/public`; `api/**` deploys as Vercel
  serverless functions via platform convention, separate from `buildCommand`.
- **Build evidence (external, not self-reported):** the Vercel GitHub-bot PR comment reported
  `Ready` for both commits pushed this session (`d6e940b` — the `api/tsconfig.json` fix,
  `d85e4c1` — the `.gitignore` fix). This is third-party confirmation from the actual deployment
  platform, not a claim this session invented.
- **Database:** all fixes (AUDIT-002 through AUDIT-005) were applied directly to the
  **production** Supabase project (`sgtmwdlycllbbavrqgzm`) via `apply_migration` — there is no
  separate staging/branch database in this project's setup, so "preview" and "production" share
  one live database. This was disclosed to the user's operating context by necessity (see Honest
  Limitations in 11) — it is standard for how this project has been run all session, not a new
  risk introduced by this audit, but worth naming explicitly for a closure report.

## Migrations and rollback

- No local migration file history exists (AUDIT-009) — rollback of this session's DB changes
  would have to be done by hand:
  - `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` for the 7 tables (AUDIT-002) — **not
    recommended**, this re-opens the exposure that was just fixed; only do this if the RLS
    enable itself is confirmed to have broken a legitimate flow, and then only as a temporary
    step while fixing the specific policy gap, not as a permanent revert.
  - `DROP POLICY` + recreate the prior (broader) `ticket_comments_read`/`ticket_comments_insert`
    definitions, reproduced verbatim in 05_repair_ledger.md / findings register, if the ownership
    check somehow breaks a legitimate staff/client flow.
  - `ALTER FUNCTION ... RESET search_path` for the 6 functions in AUDIT-005 (low risk, unlikely
    to need reverting).
  - Re-add the old `"Public read access for premarket contracts"` policy (definition captured
    verbatim in this audit's tool output/conversation, not reproduced here since it's a
    superseded/insecure state) if the admin-only bucket policy is found to break a legitimate
    public download flow.
- **Recommendation for the owner going forward**: adopt a tracked migration-file workflow (e.g.
  `supabase db diff -f <name>` after using the dashboard/MCP, committed alongside the code change
  that needs it) so future changes are reviewable and revertible from git, not just from Supabase
  dashboard history.

## Preview vs. production

- Preview deployment for this PR is live and reported `Ready` per Vercel's own webhook comments.
- **Preview smoke test could not be performed** from this sandbox (network egress blocked — see
  06/07). This is the main open item before a confident merge: someone with real network access
  (the project owner, or a follow-up session without this sandbox's restrictions) should load the
  preview URL and click through at minimum the two priority flows named in
  07_browser_function_matrix.md (support tickets, CRM staff access) before merging, since those
  are the flows whose underlying authorization this session changed.
- **Production deployment action itself was NOT performed by this audit** — no merge was done,
  no `main`-branch deploy was triggered; the audit only pushed to the existing feature branch,
  consistent with the existing workflow where the user merges PRs themselves.

## Rollback readiness for the code changes (as opposed to DB changes above)

- `api/tsconfig.json` and `.gitignore` changes are both trivially revertible via `git revert` —
  no data or schema implications either way.

## Health checks / observability

- **NOT_AUDITED** — no dedicated health-check endpoint or observability/logging platform
  configuration was found or reviewed in this session's file reads. `api/kyc/analyze-external.ts`
  and `api/ai/chat.ts` both `console.error` on failure with a redacted error `name` (not the full
  error object) — a reasonable minimal practice, confirmed by reading the code, but this is not
  the same as confirming a full logging/alerting pipeline exists.
