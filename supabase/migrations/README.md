# Supabase migrations

## State (honest)

The remote Supabase project (`sgtmwdlycllbbavrqgzm`) tracks **27** migrations (visible via
`supabase migration list` / the MCP `list_migrations` tool). Historically these were applied via
the dashboard / MCP `apply_migration` **without** committing the SQL to this repo, so most of the
early history (`01`–`14` and the `2026071x` batch through `create_notifications`) exists only as
remote state, not as reviewable files here.

The files **present in this folder** are the ones whose exact SQL is known and authoritative —
the security hardening applied on 2026-07-17. They are committed so those changes are reviewable
and revertible from git:

| File | What it does |
|---|---|
| `20260717184443_enable_rls_on_exposed_tables_and_fix_ticket_comments_idor.sql` | Enables RLS on 7 tables that had policies but RLS disabled (P0), and closes an IDOR in `ticket_comments` (P1) |
| `20260717184539_pin_search_path_on_definer_and_trigger_functions.sql` | Pins `search_path` on 6 functions (hardening) |
| `20260717184621_restrict_premarket_contracts_bucket_listing.sql` | Restricts the `premarket_contracts` storage bucket listing policy to admin roles |
| `20260727171500_enforce_users_role_kyc_privilege_boundary.sql` | BEFORE UPDATE trigger on `public.users` blocking client self-escalation of `role`/`kyc_status` (P0) and rank-bounding staff role changes on the RLS path (F1); leaves client-authoritative balance columns untouched |

## Going forward

Adopt a file-first workflow so no future change is remote-only again:

1. Make the change with `supabase migration new <name>` and write the SQL locally, **or** apply
   it remotely then run `supabase db diff -f <name>` to capture it.
2. Commit the generated file in this folder in the same PR as the code that needs it.
3. To backfill the full historical schema as one baseline file, run (from a machine with network
   + the project's DB password):
   ```
   supabase db dump --linked -f supabase/migrations/00000000000000_baseline.sql
   ```
   and mark the pre-existing remote migrations as already-applied. This was not done in the audit
   session because that environment had no outbound network access to the database host.
