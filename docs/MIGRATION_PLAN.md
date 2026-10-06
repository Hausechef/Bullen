# BullenHaus Unification Migration Plan

This plan follows the audit in `docs/AUDIT.md`. It is intentionally staged; no legacy database, file store or authentication mechanism may be removed before the documented acceptance gate for that stage passes.

## Target decision


```text
app/
  portal/       # product gateway
  recovery/     # migrated client and staff recovery surfaces
  trading/      # existing Trade module
  crm/          # existing staff CRM module
lib/
  supabase/
  auth/
  crm/
  validation/
```

## Stage 0 — Protect the starting point

1. Record current Git status, remotes, deployment configuration, environment variable names and the active Supabase project reference.
2. Do not overwrite existing uncommitted changes. Review them as an explicit migration input.
3. Run the target lint, root typecheck, API typecheck, tests and build; record failures before making feature edits.
4. Create a source and secret baseline scan. Credentials are never copied into documentation or client code.

Gate: baseline evidence recorded; all unrelated dirty work preserved.

## Stage 1 — Canonical Supabase foundation

1. Verify current Supabase SDK/Auth guidance against official documentation and pin compatible client/server versions.
2. Add migrations for `profiles`, `roles`, `user_roles`, `contacts`, `pipelines`, `pipeline_stages`, `leads`, `activities`, `tasks`, `notes` and append-only `audit_events` only after inspecting live schema to avoid destructive drift.
3. Use `auth.users` only as identity. Application roles are resolved server-side/database-side, never from browser storage or `user_metadata`.
4. Add normalized email/phone fields, constraints, indexes and a duplicate-review workflow; do not automatically merge ambiguous people.
5. Enable RLS and least-privilege grants/policies for every newly exposed table, function, view and storage bucket.

Gate: migration review, foreign keys/indexes/triggers checked, RLS authorization tests deny unauthorized select/insert/update/delete.

## Stage 2 — Unified authentication and gateway

1. Replace the root portal with the BullenHaus gateway at `/`: branded background, `RECOVERY` and `TRADE` actions.
2. Implement `next` return routing for `/recovery` and `/trade` through one Supabase login screen.
3. Remove authority from CRM localStorage token/role stores. Preserve Supabase SDK's managed session persistence only.
4. Add a shared authenticated shell for allowed module navigation, notifications, profile and global sign-out.

Gate: login, refresh, close/open, logout, reset password and cross-module navigation verified without a second login.

## Stage 3 — Move Recovery domain and UX

1. Introduce Recovery case, case participant/assignment, evidence/document, timeline and message records that reference canonical contacts and staff profiles.
2. Recreate Recovery intake, portal and operator flows in the target runtime, retaining the existing Recovery UI/UX and validation behaviour where compatible.
3. Replace filesystem evidence with private Supabase Storage buckets, narrow object paths, signed access and Storage RLS.
4. Map legacy Recovery SQLite users/cases/evidence to Supabase identities, contacts and Recovery records using a reversible mapping ledger.

Gate: row counts and samples match; no unexpected duplicates; a client can submit/view a case and authorized staff can triage, message and access evidence.

## Stage 4 — CRM integration and realtime

1. Connect every Recovery case to the shared contact and Recovery lead; connect Trade leads/accounts to the same contact.
2. Refactor relevant CRM screens to use canonical contacts, leads, tasks, notes and activities.
3. Subscribe only to affected contact/case/task records. Every realtime event must refetch authoritative data.
4. Add cross-module links from contact profile to Recovery and Trade records.

Gate: the specified browser A/B contact-change and task scenarios pass without duplicate contacts.

## Stage 5 — Legacy retirement, documentation and delivery

1. Perform migration acceptance checks: row counts, relationship validity, samples, deduplication decisions, Recovery/Trade/CRM workflow checks.
2. Disable legacy Recovery writes only after all checks pass. Archive rather than delete source data unless separate deletion authority is granted.
3. Remove proven dead mock auth/data, duplicate clients and obsolete code in small reviewed commits.
4. Complete `README.md`, `docs/SUPABASE.md`, `docs/ARCHITECTURE.md`, `docs/TEST_MATRIX.md`, CI and migration runbooks.
5. Run full build/test/security gates, prepare logical commits and inspect Git state before any GitHub action.

Gate: only declare `PRODUCTION READY` if every acceptance category in the master prompt has fresh evidence. Otherwise report `PARTIAL` with the exact blocker.

## Required external decisions before destructive/cutover work

- Confirmation of the authoritative Cloud Supabase project and access sufficient to inspect schema/apply reviewed migrations.
- A safe, approved mapping for Recovery local users to Supabase Auth identities, including collision handling.
- Explicit approval for any data deletion, production migration execution, Git history movement, or GitHub push/deployment.
