# Archive — historical / pre-migration-tracking files

These files predate the tracked `supabase/migrations/` workflow (adopted 2026-07-17) and used to
sit loose at the repo root. They are kept here, unmodified, as historical record — none of them
were deleted because they either document already-applied schema changes or were referenced by
`final_audit/` as sources reviewed during past audits.

- `AUDIT_CANDIDATES.md`, `AUDIT_REPORT.md`, `PROJECT_AUDIT.md` — earlier (2026-07-01) read-only
  architecture audits, superseded by `final_audit/` but kept for their point-in-time findings.
- `apply_migrations_phase1.sql`, `apply_migrations_phase1_safe.sql`, `apply_migrations_phase2.sql`,
  `apply_migrations_phase3.sql`, `find_constraint.sql` — ad-hoc SQL run directly against production
  before migration files were tracked. Content matches the live schema; **do not re-run**.
- `bullenhaus_full_migration.txt` — a full from-scratch schema bootstrap script for provisioning a
  new Supabase project. Kept as a disaster-recovery / re-provisioning reference.
- `03_seed_crm_workers.txt`, `confirm_all_users.txt` — one-off seed/utility scripts.
- **`fix_tickets_policies.sql` — DO NOT RUN.** This is the OLD, pre-fix `ticket_comments` RLS
  policy (it allows any `client`-role user to read every ticket's comments, not just their own).
  It was superseded by the IDOR fix applied 2026-07-17 (see `final_audit/04_findings_register.md`,
  finding AUDIT-003). It is kept only as evidence of the vulnerable "before" state. Re-running it
  would reintroduce that vulnerability.
