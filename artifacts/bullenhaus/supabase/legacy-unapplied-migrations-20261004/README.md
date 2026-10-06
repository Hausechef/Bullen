# Historical unapplied migrations

These SQL files were present locally when the Cloud database was audited on
2026-10-04. The authoritative production migration history is intentionally
empty, and the live database already contains its own schema. They are kept
here as historical implementation references only and must not be returned to
`supabase/migrations` or marked as applied without a separately reviewed
baseline-reconciliation plan.

The active migration chain begins with
`20261004101749_harden_public_rpc_grants.sql`.
