# Bullenhaus Audit Candidates

Detailed file-by-file findings from the read-only audit.

---

## Likely Unused Files

| Path | Category | Confidence | Reason | Evidence | Risk if removed | Recommended action |
|------|----------|------------|--------|----------|-----------------|-------------------|
| `artifacts/bullenhaus/src/app/crm/hooks/useAI.ts` | LIKELY_UNUSED | HIGH | Calls non-existent `/api/v1/ai/*` endpoints, ZERO references in pages | `grep -rl "useAI" src/` returns 0 results (excluding the file itself); calls `/api/v1/ai/insights/:id`, `/api/v1/ai/client-summary`, etc. which 404 | LOW | remove_later |
| `artifacts/bullenhaus/src/app/crm/hooks/useCalls.ts` | LIKELY_UNUSED | HIGH | Calls non-existent `/api/v1/calls/*` endpoints, ZERO references | `grep -rl "useCalls" src/` returns 0; calls `/api/v1/calls/live`, `/api/v1/calls/start`, etc. | LOW | remove_later |
| `artifacts/bullenhaus/src/app/crm/hooks/useApprovals.ts` | LIKELY_UNUSED | HIGH | Calls non-existent `/api/v1/approvals/*`, ZERO references | `grep -rl "useApprovals" src/` returns 0; calls `/api/v1/approvals/pending`, `/api/v1/approvals/:id/approve` | LOW | remove_later |
| `artifacts/bullenhaus/src/app/crm/hooks/useReports.ts` | LIKELY_UNUSED | HIGH | Calls non-existent `/api/v1/reports/*`, ZERO references | `grep -rl "useReports" src/` returns 0; calls `/api/v1/reports/revenue`, `/api/v1/reports/acquisition`, etc. | LOW | remove_later |
| `artifacts/bullenhaus/src/app/trading/pages/admin/AdminDashboard.tsx` | LIKELY_UNUSED | HIGH | 13.9KB file, ZERO references; `AdminOverview.tsx` is routed instead | `grep -rn "AdminDashboard" src/` returns 0 (excluding the file itself) | LOW | remove_later |
| `artifacts/bullenhaus/supabase/migrations/_DISABLED_15_trading_positions_orders.sql` | OBSOLETE | HIGH | Disabled duplicate of migration 15 | Filename prefix `_DISABLED_` | LOW | remove_later |
| `scratch/list_tables.ts` | LIKELY_UNUSED | MEDIUM | Throwaway script, not referenced by package.json scripts | In `scratch/` folder (convention for temporary files) | LOW | remove_later |

---

## Duplicate Files

| Path | Duplicates | Confidence | Reason | Evidence |
|------|------------|------------|--------|----------|
| `api/crm/workers/[id].ts` + `api/crm/workers/[id]/reset-password.ts` | DUPLICATE routing | HIGH | Both `[id].ts` AND `[id]/` directory exist — Vercel file-based routing ambiguity | `ls api/crm/workers/` shows both `[id].ts` (file) and `[id]/` (directory with `reset-password.ts`) |
| `api/v1/advertisers/[id].ts` + `api/v1/advertisers/[id]/` | DUPLICATE routing | HIGH | Same pattern — `[id].ts` file + `[id]/` directory with `stats.ts` and `codes/` | `ls api/v1/advertisers/` shows both |
| `artifacts/api-server/src/routes/crm-workers.ts` | Duplicates `api/crm/workers/` + `supabase/functions/crm-workers/` | HIGH | CRM worker CRUD implemented 3 times | All 3 implement create/delete/reset-password for CRM workers |
| `artifacts/api-server/src/routes/advertisers.ts` | Duplicates `api/v1/advertisers/` | HIGH | Advertiser CRUD in both Vercel + Express | Both implement GET/POST/PATCH/DELETE for advertisers |
| `artifacts/api-server/src/routes/ai.ts` | Duplicates `api/ai/{chat,status}.ts` | HIGH | AI proxy in both | Both proxy OpenRouter |
| `lib/api-zod/` + `lib/api-client-react/` + `lib/api-spec/` | GENERATED duplicate | MEDIUM | Orval-generated from OpenAPI, but OpenAPI only defines `/api/healthz` | `lib/api-spec/openapi.yaml` only has healthz; generated code only has HealthCheckResponse |
| `motion` v12 + `framer-motion` v12 | DEPENDENCY duplicate | MEDIUM | `motion` is rebranded `framer-motion` | Both in package.json; source uses `motion/react` |

---

## Obsolete Files

| Path | Confidence | Reason | Evidence |
|------|------------|--------|----------|
| `artifacts/api-server/` (entire package) | HIGH | Express backend NOT deployed by Vercel; `vercel.json` only builds `@workspace/bullenhaus` | `vercel.json` build command targets only bullenhaus; api-server has its own `build.mjs` |
| `lib/db/` (entire package) | MEDIUM | Drizzle ORM installed but schema is empty (19 lines, no models); SQL migrations are sole source of truth | `wc -l lib/db/src/schema/index.ts` = 19 lines (just comments/empty) |
| `supabase/` (root) | HIGH | Empty except `.temp/linked-project.json`; actual migrations are in `artifacts/bullenhaus/supabase/` | `ls supabase/` shows only `.temp/` |
| `artifacts/bullenhaus/supabase/config.toml` | HIGH | Contains WRONG project_id `jwdnjrysxrzgtqbvpuxq` (old project); linked-project.json says `sgtmwdlycllbbavrqgzm` | `grep project_id config.toml` vs `linked-project.json` |
| `03_seed_crm_workers.txt` + `bullenhaus_full_migration.txt` + `confirm_all_users.txt` | MEDIUM | .txt files in root, likely notes/dumps | Root-level .txt files, not referenced by any script |

---

## Generated/Cache Artifacts

| Path | Confidence | Reason | Evidence |
|------|------------|--------|----------|
| `lib/api-zod/src/generated/` | HIGH | Orval-generated Zod types | Only defines `HealthCheckResponse` — minimal |
| `lib/api-client-react/src/generated/` | HIGH | Orval-generated React Query hooks | Only has `healthCheck` — minimal |
| `pnpm-lock.yaml` | KEEP | Lockfile — required | Standard |
| `.canvas/assets/` | MANUAL_REVIEW | Replit Canvas assets | Binary PNG files, unclear if needed |
| `.agents/memory/` | MANUAL_REVIEW | Agent memory files | .md + .toml, may be Replit AI assistant state |

---

## Temp/Backup Files

| Path | Confidence | Reason | Evidence |
|------|------------|--------|----------|
| `artifacts/bullenhaus/fix_backslashes.cjs` | MEDIUM | Build hack script | `.cjs` extension, `fix_` prefix |
| `artifacts/bullenhaus/fix_config.cjs` | MEDIUM | Build hack script | Same pattern |
| `artifacts/bullenhaus/fix_config2.cjs` | MEDIUM | Build hack script (v2) | Same pattern |
| `artifacts/bullenhaus/fix_typecheck.cjs` | MEDIUM | Build hack script | Same pattern |
| `artifacts/bullenhaus/inject_admin_market.cjs` | MEDIUM | Build injection script | `inject_` prefix — 16 total scripts |
| `artifacts/bullenhaus/inject_admincrm.cjs` | MEDIUM | Build injection script | Same |
| `artifacts/bullenhaus/inject_adminkyc.cjs` | MEDIUM | Build injection script | Same |
| `artifacts/bullenhaus/inject_adminlayout.cjs` | MEDIUM | Build injection script | Same |
| `artifacts/bullenhaus/inject_adminmarket.cjs` | MEDIUM | Build injection script (duplicate name?) | Same |
| `artifacts/bullenhaus/inject_adminpaymentdetails.cjs` | MEDIUM | Build injection script | Same |
| `artifacts/bullenhaus/inject_adminsettings.cjs` | MEDIUM | Build injection script | Same |
| `artifacts/bullenhaus/inject_admintx.cjs` | MEDIUM | Build injection script | Same |
| `artifacts/bullenhaus/inject_adminusers.cjs` | MEDIUM | Build injection script | Same |
| `artifacts/bullenhaus/inject_auth.cjs` | MEDIUM | Build injection script | Same |
| `artifacts/bullenhaus/inject_legal.cjs` | MEDIUM | Build injection script | Same |
| `artifacts/bullenhaus/inject_premarket_control.cjs` | MEDIUM | Build injection script | Same |

**Total: 20 inject/fix scripts** — likely one-time build patches, should be verified if still needed.

---

## Suspicious Assets

| Path | Size | Confidence | Reason | Evidence |
|------|------|------------|--------|----------|
| `attached_assets/` (entire folder) | 11MB / 43 files | MANUAL_REVIEW | Screenshots, zips, txt dumps — not referenced by app code | `grep -r "attached_assets" src/` returns 0; folder is at repo root |
| `attached_assets/simple-cloud-link-main_*.zip` | 1.3MB | MANUAL_REVIEW | Unknown archive contents | `.zip` file, no reference in source |
| `attached_assets/Screenshot_*.jpg` (20 files) | ~8MB total | LIKELY_UNUSED | 20 screenshots from 2026-05-21 to 2026-05-23 | Filenames suggest user-uploaded debug screenshots |
| `attached_assets/{GUID}_*.png` (11 files) | ~3MB | LIKELY_UNUSED | Windows GUID-named screenshots | Pattern `{049E3ED4-...}.png` suggests Windows Snipping Tool |
| `attached_assets/content*_1779*` (5 files) | unknown | MANUAL_REVIEW | No extension, unclear format | `content_1779506090101`, `content-1_1779506010224`, etc. |
| `attached_assets/Pasted-*.txt` (6 files) | unknown | MANUAL_REVIEW | Pasted text dumps from Replit | `Pasted--senior-full-stack-developer-Replit--*.txt` |
| `artifacts/bullenhaus/public/kyc-samples/` (6 PNGs) | ~750KB | KEEP | Sample KYC documents for bot testing | Referenced by AdminKYC.tsx for demo mode |
| `artifacts/bullenhaus/public/neuralink-poster.png` | unknown | MANUAL_REVIEW | Unclear usage | `grep -r "neuralink-poster" src/` needed |

---

## Suspicious Dependencies

| Package | Declared Location | Usage Found | Confidence | Risk | Verification Command |
|---------|-------------------|-------------|------------|------|---------------------|
| `wouter` | bullenhaus devDeps | NOT found | HIGH unused | LOW | `grep -r "wouter" artifacts/bullenhaus/src/` |
| `@reactuses/core` | bullenhaus deps | NOT found | MEDIUM unused | LOW | `grep -r "@reactuses" artifacts/bullenhaus/src/` |
| `react-syntax-highlighter` | bullenhaus deps | NOT found | MEDIUM unused | LOW | `grep -r "react-syntax-highlighter" artifacts/bullenhaus/src/` |
| `@mdxeditor/editor` | bullenhaus deps | NOT found | MEDIUM unused | LOW | `grep -r "@mdxeditor" artifacts/bullenhaus/src/` |
| `motion` + `framer-motion` | bullenhaus deps | Both found | MEDIUM duplicate | LOW | `grep -r "from \"motion/react\"" + "from \"framer-motion"` |
| `msw` | pnpm-workspace onlyBuiltDeps | NOT found | HIGH unused | LOW | `grep -r "msw" --include="*.ts" artifacts/` |
| `stripe-replit-sync` | pnpm-workspace exclude | NOT found | HIGH unused | LOW | `grep -r "stripe-replit-sync"` |

---

## Manual Review Required

| Path | Reason |
|------|--------|
| `attached_assets/` (43 files) | May contain reference images used by Replit Canvas or agent memory; dynamic usage unknown |
| `.canvas/assets/` | Replit Canvas binary assets; usage unknown |
| `.agents/memory/` | Agent memory state; may be needed for Replit AI features |
| `artifacts/bullenhaus/inject_*.cjs` (16 scripts) | May be needed by build process; verify by running `pnpm build` and checking if removal breaks it |
| `artifacts/bullenhaus/fix_*.cjs` (4 scripts) | Same — build hack scripts |
| `lib/db/` | Drizzle ORM package with empty schema — may be intended for future use |
| `artifacts/mockup-sandbox/` | Dev-only UI preview tool — verify if developers use it |
| `artifacts/bullenhaus/public/neuralink-poster.png` | Unclear if referenced dynamically |
| `03_seed_crm_workers.txt`, `bullenhaus_full_migration.txt`, `confirm_all_users.txt` | Root .txt files — may be documentation or SQL dumps |

---

## Security Risks

| Path | Type | Masked Value | Risk | Recommended Action |
|------|------|--------------|------|-------------------|
| `.replit` | Hardcoded Supabase anon key | `eyJhbGci...****...Tzjo` | LOW (anon key is public by design; RLS protects data) | Move to env var; rotate if repo becomes public |
| `attached_assets/simple-cloud-link-main_*.zip` | Unknown archive | N/A | MEDIUM (contents unknown) | Inspect contents; remove if not needed |
| `api/_lib/supabase.ts` | Service role key reference | `process.env.SUPABASE_SERVICE_ROLE_KEY` | NONE (env var, not hardcoded) | KEEP |
| Edge Functions | Service role key | `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` | NONE (runtime env) | KEEP |

**No hardcoded secrets found.** All sensitive keys use environment variables. The only hardcoded credential is the Supabase anon key in `.replit`, which is acceptable per Supabase's security model (anon keys are public; Row Level Security protects data).

---

## Large Files (>100KB)

| Path | Size | Type | Usage Evidence | Risk |
|------|------|------|----------------|------|
| `attached_assets/simple-cloud-link-main_*.zip` | 1.3MB | ZIP archive | None found | MEDIUM (unknown contents) |
| `artifacts/bullenhaus/public/logo.png` | ~200KB | PNG | Referenced in Sidebar, AuthShell, AdminLayout | KEEP |
| `artifacts/bullenhaus/public/images/golden_bull_bg.png` | ~200KB | PNG | Referenced in AuthShell background | KEEP |
| `artifacts/bullenhaus/public/premarket_contract_v1.pdf` | ~200KB | PDF | Referenced in premarket contract flow | KEEP |
| `artifacts/bullenhaus/public/neuralink-poster.png` | ~200KB | PNG | MANUAL_REVIEW | LOW |
| `artifacts/bullenhaus/public/kyc-samples/*.png` (6 files) | ~750KB | PNG | Referenced in AdminKYC demo mode | KEEP |
| `artifacts/bullenhaus/supabase/migrations/19_seed_leads_gger3k.sql` | ~150KB | SQL | Seed data migration | KEEP |
| `attached_assets/Screenshot_*.jpg` (20 files) | ~8MB | JPG | None found | LIKELY_UNUSED |
| `pnpm-lock.yaml` | 252KB | YAML | Lockfile | KEEP |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Likely Unused Files | 7 |
| Duplicate Files/Routes | 7 |
| Obsolete Files/Packages | 5 |
| Generated/Cache Artifacts | 6 |
| Temp/Backup Scripts | 20 |
| Suspicious Assets | 8 |
| Suspicious Dependencies | 7 |
| Manual Review Required | 9 |
| Security Risks | 4 (1 LOW, 1 MEDIUM, 2 NONE) |
| Large Files | 10 |

**Total cleanup candidates:** 83 items (20 are inject/fix scripts that need build verification)
