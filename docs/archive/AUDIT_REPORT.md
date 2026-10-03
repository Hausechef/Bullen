# Bullenhaus Code Audit Report

**Date:** 2026-07-01
**Auditor:** Principal Code Auditor
**Project:** Bullenhaus Trading Platform + CRM
**Audit Type:** Read-only, no modifications
**Repository:** /home/z/my-project/Bullenhaus/

---

## 1. Project Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | pnpm workspaces (10 packages) |
| **Frontend** | Vite 7 + React 19 + TypeScript 5.9 |
| **Backend #1** | Vercel serverless (`api/`) — file-based routing |
| **Backend #2** | Express (`artifacts/api-server/`) — DUPLICATE, not deployed |
| **Backend #3** | Supabase Edge Functions (Deno) — 5 functions |
| **Database** | Supabase Postgres (project `sgtmwdlycllbbavrqgzm`) |
| **UI Library** | shadcn/ui (53 components) + custom CRM kit (6 components) |
| **Styling** | Tailwind CSS v4 + tw-animate-css |
| **State** | Zustand v4 + TanStack Query v5 |
| **AI** | OpenRouter (DeepSeek primary, GPT-4o-mini fallback) |
| **Auth** | Supabase Auth (email/password, JWT) |
| **Charts** | recharts v3 + lightweight-charts v5 |
| **Realtime** | socket.io-client v4.8 (client-side only) |
| **i18n** | react-i18next (EN/DE) |
| **Forms** | react-hook-form + zod |
| **Deployment** | Vercel (frontend) + Supabase (backend/DB) |
| **Package Manager** | pnpm v11.9 (via corepack) |
| **Node** | v24 |

## 2. Architecture Summary

```
Bullenhaus/
├── api/                          Vercel serverless functions (DEPLOYED)
│   ├── _lib/supabase.ts          ⚠️ Has duplicate exports (bug)
│   ├── ai/{chat,status}.ts       OpenRouter proxy
│   ├── crm/workers/              CRM worker CRUD
│   ├── crm/clients/[id]/files/   Client file upload
│   └── v1/advertisers/           Advertiser CRUD
├── artifacts/
│   ├── bullenhaus/               MAIN FRONTEND (deployed to Vercel)
│   │   ├── src/
│   │   │   ├── app/trading/      Client trading zone
│   │   │   ├── app/crm/          CRM worker zone
│   │   │   ├── app/login/        Auth pages
│   │   │   ├── components/ui/    53 shadcn components
│   │   │   └── lib/              Supabase client, AI, utils
│   │   ├── supabase/
│   │   │   ├── migrations/       30 SQL migrations
│   │   │   ├── functions/        5 Edge Functions (Deno)
│   │   │   └── config.toml       ⚠️ Wrong project_id
│   │   ├── public/               Static assets
│   │   ├── inject_*.cjs (16)     ⚠️ Build hack scripts
│   │   └── fix_*.cjs (4)         ⚠️ Build hack scripts
│   ├── api-server/               Express backend (DUPLICATE, NOT deployed)
│   └── mockup-sandbox/           Dev-only UI preview tool
├── lib/
│   ├── api-zod/                  Orval-generated Zod (only healthz)
│   ├── api-client-react/         Orval-generated React Query (only healthz)
│   ├── api-spec/                 OpenAPI spec (only /api/healthz)
│   └── db/                       Drizzle ORM (EMPTY schema)
├── scripts/                      hello.ts + post-merge.sh
├── scratch/                      list_tables.ts (throwaway)
├── attached_assets/              43 files, 11MB (screenshots, zips, txt)
├── .canvas/                      Canvas assets
├── .agents/                      Agent memory
└── supabase/                     EMPTY (only .temp/linked-project.json)
```

## 3. Entrypoints

**Frontend:**
- `artifacts/bullenhaus/src/main.tsx` → `App.tsx`
- `artifacts/bullenhaus/index.html`

**Backend (Vercel):**
- `api/healthz.ts`, `api/ai/{chat,status}.ts`
- `api/crm/workers/{index,[id],[id]/reset-password}.ts`
- `api/crm/clients/[id]/files/index.ts`
- `api/v1/advertisers/{index,[id],[id]/stats,[id]/codes/{index,[codeId]}}.ts`

**Backend (Express — NOT deployed):**
- `artifacts/api-server/src/index.ts`

**Edge Functions:**
- `supabase/functions/{crm-sync,crm-workers,ai-chat,ai-status,data-export}/index.ts`

## 4. Commands Detected

```json
{
  "dev": "vite --config vite.config.ts --host 0.0.0.0",
  "build": "vite build --config vite.config.ts",
  "serve": "vite preview --config vite.config.ts --host 0.0.0.0",
  "typecheck": "tsc -p tsconfig.json --noEmit"
}
```

Root: `pnpm install`, `pnpm --filter <pkg> <cmd>`

## 5. Validation Results

| Check | Result |
|-------|--------|
| `git status` | ✅ Clean (only modifications from prior work sessions) |
| `git log` | ✅ 5 recent commits visible |
| TypeScript | ⚠️ Not run (would require install + might modify) |
| ESLint | ⚠️ Not run (has autofix potential) |
| Build | ⚠️ Not run (would generate artifacts) |

## 6. High-level Findings

### Critical Issues
1. **`api/_lib/supabase.ts`** — Duplicate exports (lines 65-134) break TypeScript compilation
2. **`support_tickets` migration** — Previously missing, now created (Phase 1)
3. **4 dead CRM hooks** — `useAI.ts`, `useCalls.ts`, `useApprovals.ts`, `useReports.ts` call non-existent `/api/v1/*` endpoints, ZERO references in pages
4. **Supabase project_id mismatch** — `config.toml` says `jwdnjrysxrzgtqbvpuxq`, linked-project says `sgtmwdlycllbbavrqgzm`

### Architecture Issues
5. **Triple backend duplication** — `api/` (Vercel) + `artifacts/api-server/` (Express) + `supabase/functions/crm-workers/` all implement CRM worker CRUD
6. **Empty Drizzle schema** — `lib/db/src/schema/index.ts` is 19 lines, no models; SQL migrations are sole source of truth
7. **16 inject_*.cjs + 4 fix_*.cjs scripts** — Build hack scripts in bullenhaus root, unclear if still needed

### Code Quality
8. **AdminDashboard.tsx orphan** — 13.9KB file, ZERO references (AdminOverview is routed instead)
9. **`_DISABLED_15_trading_positions_orders.sql`** — Disabled migration duplicate
10. **`scratch/list_tables.ts`** — Throwaway script in repo

## 7. Security Findings (masked)

| Path | Type | Masked Value | Risk | Action |
|------|------|--------------|------|--------|
| `.replit` | Supabase anon key (hardcoded) | `eyJhbGci...****...Tzjo` | LOW (anon key is public by design, RLS protects) | Move to env var if repo is public |
| `api/_lib/supabase.ts` | Service role key reference | `process.env.SUPABASE_SERVICE_ROLE_KEY` | NONE (env var, not hardcoded) | KEEP |
| Edge Functions | Service role key | `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` | NONE (runtime env) | KEEP |
| `attached_assets/*.zip` | Unknown archive content | `simple-cloud-link-main_*.zip` (1.3MB) | MEDIUM (unknown contents) | Manual review |

**No hardcoded secrets found** — all sensitive keys use env vars. Only the anon key in `.replit` is hardcoded (acceptable per Supabase design).

## 8. Dependency Findings

### Possibly Unused (manual verification needed)
| Package | Location | Usage Found | Confidence |
|---------|----------|-------------|------------|
| `wouter` | bullenhaus | NOT found (react-router-dom is used) | HIGH unused |
| `motion` v12 | bullenhaus | Found (motion/react) | KEEP (duplicate of framer-motion?) |
| `framer-motion` v12 | bullenhaus | Found | KEEP |
| `@reactuses/core` | bullenhaus | NOT found in src/ | MEDIUM unused |
| `react-syntax-highlighter` | bullenhaus | NOT found in src/ | MEDIUM unused |
| `@mdxeditor/editor` | bullenhaus | NOT found in src/ | MEDIUM unused |
| `@dnd-kit/*` | bullenhaus | Found (LeadKanban) | KEEP (Phase 1) |

### Notes
- `motion` and `framer-motion` both installed — possible duplicate (motion v12 is the rebranded framer-motion)
- `msw` in onlyBuiltDependencies but no msw setup found

## 9. Build/Test Health

- **No test framework** — zero test files found
- **No CI/CD** — no `.github/workflows/`, no Dockerfile
- **TypeScript strict** — tsconfig has strict mode
- **0 TODO/FIXME/HACK comments** in source (clean)
- **inject_*.cjs scripts** suggest build was patched manually — fragile

## 10. Maintainability Findings

| Issue | Severity | Details |
|-------|----------|---------|
| Triple backend duplication | HIGH | CRM worker CRUD in 3 places |
| 4 dead hooks | MEDIUM | Confuse developers, call 404 endpoints |
| Empty Drizzle schema | MEDIUM | DB schema drift risk |
| 20 inject/fix scripts | LOW | Build hack cleanup needed |
| 43 attached_assets (11MB) | LOW | Should be in .gitignore or external storage |
| No tests | MEDIUM | No regression protection |
| `mockup-sandbox` package | LOW | Dev-only, 2.0.0 version, unclear if used |

## 11. Recommended Cleanup Plan

### Phase A — Safe cleanup (low risk)
1. Delete 4 dead hooks: `useAI.ts`, `useCalls.ts`, `useApprovals.ts`, `useReports.ts`
2. Delete orphan `AdminDashboard.tsx`
3. Delete `_DISABLED_15_trading_positions_orders.sql`
4. Delete `scratch/list_tables.ts`
5. Fix `api/_lib/supabase.ts` duplicate exports

### Phase B — Architecture decision (medium risk)
6. Decide: keep Vercel `api/` OR Express `api-server/` — delete the other
7. Decide: keep `mockup-sandbox` or remove
8. Decide: keep Drizzle `lib/db/` (empty) or remove
9. Fix `config.toml` project_id to `sgtmwdlycllbbavrqgzm`

### Phase C — Asset hygiene (low risk)
10. Move `attached_assets/` to external storage or `.gitignore`
11. Audit 16 `inject_*.cjs` scripts — delete if build no longer needs them
12. Rotate Supabase anon key if repo is public

### Phase D — Dependency cleanup (low risk)
13. Verify `wouter`, `@reactuses/core`, `react-syntax-highlighter`, `@mdxeditor/editor` usage — remove if confirmed unused
14. Consolidate `motion` + `framer-motion` (likely same package)

**DO NOT** delete without manual verification:
- `attached_assets/` (may contain reference images)
- `.canvas/`, `.agents/` (may be Replit-specific)
- Any public asset (referenced dynamically)
