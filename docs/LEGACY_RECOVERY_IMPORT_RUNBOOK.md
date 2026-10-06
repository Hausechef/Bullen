# Legacy Recovery import runbook

## State

**BLOCKED — identity mapping required.** The Recovery domain is live in the unified
Supabase project, but legacy user identifiers are CUID strings while the target
foreign keys require existing `public.users.id` UUIDs. Importing cases before
that mapping exists would either violate referential integrity or attach client
data to the wrong account.

This runbook is deliberately dry-run-first. It never imports legacy password
hashes and it never automatically joins people by email.

## Read-only inventory (2026-10-04)

| Entity | Count | Notes |
| --- | ---: | --- |
| Legacy users | 3 | 1 `ADMIN`, 2 `CLIENT` |
| Recovery cases | 1 | `TRIAGE` / `CRYPTO` |
| Evidence records | 1 | `text/plain` |
| Timeline events | 5 | no broken case links |
| Messages | 1 | no broken case links |
| Notifications | 7 | excluded from v1 import |
| Upload objects | 1 | 115 bytes |

The legacy `Case`, `Evidence`, `TimelineEvent`, and `Message` relations have
no orphaned foreign keys. No case text, email, file name, account identifier,
or evidence content was included in the inventory.

## Identity reconciliation result (2026-10-04)

The authorized, read-only comparison of normalized SHA-256 email hashes found
**0 exact matches out of 3 legacy accounts** in the current production
`public.users` set. Therefore no safe automatic mapping exists. The next
identity step is to create or invite the three intended Supabase Auth users,
confirm the resulting `public.users` UUIDs and roles, and then complete the
approved mapping ledger. Account creation, invitations, and password-reset
flows are deliberately outside this runbook's authority.

## Required mapping ledger

An authorized operator must supply and approve one row for each legacy user
whose records will be imported. Store the ledger outside Git and do not paste
passwords, service keys, or other secrets into it.

```csv
legacy_user_id,target_user_uuid,approved_by,approved_at_utc
<legacy-cuid>,<existing-public.users.uuid>,<operator>,<ISO-8601 timestamp>
```

Rules:

1. Every `legacy_user_id` must occur exactly once.
2. Every `target_user_uuid` must already exist in both Supabase Auth and
   `public.users` and have the intended role.
3. Email comparison may help the operator review the ledger, but is not an
   authorization mechanism and is not an automatic matching rule.
4. Legacy password hashes and verification/reset tokens are never imported.
   An account not already represented in Supabase Auth needs a separate,
   user-approved invitation or password-reset process.
5. The legacy admin can be mapped only to a target account whose server-side
   `public.users.role` is an authorized staff role.

## Field mapping

| Legacy table | Unified destination | Rule |
| --- | --- | --- |
| `Case` | `recovery_cases` | Preserve case number, category, status, business fields and timestamps; map `clientId`/`assignedOperatorId` through the approved ledger. |
| `TimelineEvent` | `recovery_case_timeline` | Preserve type, title, body, visibility and timestamp; map an author only when the ledger contains it. |
| `Message` | `recovery_case_messages` | Preserve body, read flags and timestamp; sender must have an approved mapping. |
| `Evidence` | Storage `recovery-evidence` + `recovery_case_evidence` | Upload object first to `<target-client-uuid>/<target-case-uuid>/<generated-name>`, verify SHA-256/size/mime, then create metadata in the same import unit. |
| `Notification` | — | Excluded: legacy notification delivery/read state has no like-for-like domain owner. |
| `User`, `VerificationToken`, `AuditEvent` | — | Excluded from Recovery data import. Auth identities and credentials are not migrated by this job. |

The existing insert trigger would create a new "Case submitted" timeline item.
The import must either insert a clearly labelled migration system event only,
or apply an approved, auditable mechanism that avoids duplicate submission
events. It must not quietly disable RLS or mutate production policies.

## Execution gates

1. Validate the approved mapping ledger: UUID format, uniqueness, target user
   existence, target roles, and coverage of all referenced client/sender/staff
   identifiers.
2. Produce a dry-run report with only counts, legacy ID hashes, target UUIDs,
   proposed case-number collision results, object checksums, and validation
   failures. Do not persist data.
3. Obtain an explicit approval for that exact report and import scope.
4. Run the import using a server-side, short-lived privileged context; never
   expose a service-role credential to the browser or commit it.
5. Reconcile source/target counts, timestamps, case numbers, attachment bytes
   and checksums. Generate signed URLs only for a permitted verification user.
6. Keep the legacy SQLite database and upload directory immutable until the
   reconciliation report is approved.

## Current next action

Create an approved mapping ledger (or identify which legacy accounts should
receive Supabase invitations), then run the local validator from a trusted
machine:

```powershell
& 'C:\path\to\python.exe' .\tools\legacy_recovery_dry_run.py `
  --sqlite 'D:\path\to\legacy\custom.db' `
  --mapping 'D:\secure\recovery-user-mapping.csv' `
  --target-users 'D:\secure\target-users.json' `
  --target-case-numbers 'D:\secure\target-case-numbers.json' `
  --report 'D:\secure\recovery-dry-run-report.json'
```

`target-users.json` is a redacted server-side export in this shape:

```json
[{"id":"target-user-uuid","role":"client"}]
```

`target-case-numbers.json` is a server-side JSON array of existing recovery
case numbers. It lets the validator block a duplicate case-number import.

The validator makes no network connections and cannot write to Supabase or
Storage. A report marked `READY_FOR_APPROVAL` is the required input to the
separate, explicitly approved production-import step.

## E2E test evidence (2026-10-04)

A deliberately mapped test run completed against the deployed Recovery domain:

| Check | Result |
| --- | --- |
| Test identities | 2 `client` identities and 1 server-side `agent` identity |
| Imported domain data | 1 case, 5 timeline events, 1 message |
| Evidence | 1 private 115-byte text object, then 1 metadata row |
| Owner RLS | 4 client-visible events, 1 message, 1 evidence row |
| Other-client RLS | 0 events, 0 messages, 0 evidence rows |
| Staff RLS | 5 events, 1 message, 1 evidence row |
| Database reconciliation | Counts and Storage object each matched exactly; `recovery_cases` RLS enabled |

The test intentionally exercised upload using a normal client session and the
existing bucket policy; no service-role key was introduced. The import SQL is
generated by `tools/generate_legacy_recovery_import.py` in two phases so
evidence metadata cannot precede its Storage object. `tools/verify_recovery_rls.py`
is the repeatable black-box policy check.
