# 06 — Test, Build & Quality-Gate Evidence

Real commands, run in this session, against the actual repository. No results below are invented.

| Command | Reason | Exit Code | Result | Relevant Output | Status |
|---|---|---|---|---|---|
| `pnpm run typecheck` (root — runs `tsc --build` across `lib/*`, then `--filter "./artifacts/**" --filter "./scripts"`) | Phase 1/4 static quality gate | 0 | PASS | `artifacts/bullenhaus typecheck: Done`, `artifacts/api-server typecheck: Done`, `artifacts/mockup-sandbox typecheck: Done`, `scripts typecheck: Done` | PASS (ran twice: pre-fix baseline and post-fix regression, both clean — `api/` is not part of this root script, see next row) |
| `cd api && npx tsc --noEmit -p tsconfig.json` | `api/` is a separate workspace package with its own tsconfig, not covered by the root `typecheck` script; this is the exact command Vercel's remote build effectively re-derives | 0 (after fix; was failing remotely on Vercel before AUDIT-001 fix, though it already passed locally even before — the divergence was environment-specific) | PASS | Silent success (no diagnostics) | PASS |
| `pnpm run build` (root — `typecheck && pnpm -r --if-present run build`) | Phase 1/4 — full production build, the actual gate that matters before merge | 0 | PASS | `artifacts/bullenhaus build: ✓ built in 12.03s`; `artifacts/api-server build: ⚡ Done in 209ms`; largest client chunk `index-u8PdTlfP.js` 418.69 kB gzip 128.15 kB (no bundler warnings/errors) | PASS (ran twice, pre- and post- audit fixes) |
| ESLint / any lint script | Phase 1.10 static quality gate | — | **NOT_AVAILABLE** | No `.eslintrc*`/`eslint.config.*` anywhere in the workspace; no `lint` script in any `package.json` | NOT_AVAILABLE |
| Unit/integration tests | Phase 1.10 regression gate | — | **NOT_AVAILABLE** | `find . -iname "*.test.*" -o -iname "*.spec.*"` (excluding `node_modules`) → 0 results; no `test` script anywhere | NOT_AVAILABLE |
| CI pipeline (GitHub Actions) | Phase 1.12 | — | **NOT_AVAILABLE** | `.github/workflows` does not exist | NOT_AVAILABLE |
| Supabase security advisor | Phase 1.4/1.6 data-integrity/security gate | 0 (tool call succeeded) | **RAN — found 7 ERROR + ~30 WARN findings pre-fix; 0 ERROR + ~29 WARN post-fix** (the 6 closed `function_search_path_mutable` WARNs are no longer present; remaining WARNs are the documented owner-action items, AUDIT-006/007) | See 04_findings_register.md, 08_security_data_integrity.md | RAN, findings triaged and mostly closed |
| Supabase performance advisor | Phase 1.11 | — | Requested but response exceeded the tool's output size limit and was not re-fetched given time/scope constraints after the higher-priority security findings were triaged and fixed | — | **NOT_RUN to completion** — disclosed limitation, not claimed as clean |
| `git status` / `git diff` review before every commit | Operating rule — no unreviewed staged content, no secrets | — | Reviewed before both commits (`d6e940b`, `d85e4c1`) | Only the intended single-purpose file changed in each commit | PASS |
| `curl`/`WebFetch` against live Vercel preview and Supabase REST | Phase 4/5 live smoke test | connection-level failure | **NOT_AVAILABLE** | Sandbox egress proxy returned HTTP 403 for `sgtmwdlycllbbavrqgzm.supabase.co`, the live Vercel preview host, and `example.com` (control) — confirmed via `$HTTPS_PROXY/__agentproxy/status` `recentRelayFailures` log | NOT_AVAILABLE (environment limitation, not a code defect) |
| Browser automation (Playwright, pre-installed Chromium) | Phase 4 Browser Function Matrix | not attempted after network test | **NOT_AVAILABLE** | Same network path as above; a browser session would need the identical blocked egress to reach the deployed app | NOT_AVAILABLE |

## Interpretation

The two gates that actually exist and matter most for shipping this specific change
(typecheck, build) are **PASS, verified twice** (pre-existing baseline + post-fix regression).
The gates that don't exist at all (lint, tests, CI) are a genuine structural gap in this
project, not something this audit could fabricate results for — they are reported as
`NOT_AVAILABLE`, not glossed over as passing.
