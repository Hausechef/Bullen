# BullenHaus API Runtime Migration Matrix — Phase C1

## Scope
Migrate active Vercel-style handlers under `Bullenhaus-clean/api` into the existing Express backend at `Bullenhaus-clean/artifacts/api-server`.

## Classification Legend
- **ACTIVE_REQUIRED**: called by current production frontend; must work in VPS deployment.
- **ACTIVE_OPTIONAL**: called by frontend but gracefully degrades or is admin-only.
- **DEAD**: not referenced by current frontend; do not migrate unless proven needed.
- **UNKNOWN**: referenced but backend contract unclear.

## Vercel Handler Inventory

| # | ROUTE | SOURCE FILE | FRONTEND CALLER | METHOD | AUTH | BODY | RESPONSE | SUPABASE ACCESS | SERVICE ROLE | EXTERNAL PROVIDER | WEBHOOK RAW BODY | STATUS |
|---|-------|-------------|-----------------|--------|------|------|----------|-----------------|--------------|-------------------|------------------|--------|
| 1 | `/api/deposits` | `api/deposits/index.ts` | `DepositPage`, `Transactions` | GET, POST | `requireUser` (Bearer + users.role) | JSON | `{ deposits }` / `{ checkoutUrl }` | Cloud Supabase | Yes | TRAPAY | No | ACTIVE_REQUIRED |
| 2 | `/api/deposits/config` | `api/deposits/config.ts` | `DepositPage` | GET | `requireUser` | — | `{ enabled, methods, currencies, limits }` | Cloud Supabase | Yes | — | No | ACTIVE_REQUIRED |
| 3 | `/api/deposits/:id` | `api/deposits/[id].ts` | `DepositResult` | GET | `requireUser` | — | `{ deposit }` | Cloud Supabase | Yes | — | No | ACTIVE_REQUIRED |
| 4 | `/api/admin/deposits` | `api/admin/deposits/index.ts` | `AdminDeposits` | GET | `requirePaymentStaff` | — | `{ deposits }` | Cloud Supabase | Yes | — | No | ACTIVE_REQUIRED |
| 5 | `/api/admin/deposits/:id` | `api/admin/deposits/[id].ts` | `AdminDeposits` | GET, POST | `requirePaymentStaff` / `requirePaymentAdmin` | JSON action | `{ deposit, capabilities }` / ok | Cloud Supabase | Yes | TRAPAY manual credit | No | ACTIVE_REQUIRED |
| 6 | `/api/admin/payments/trapay` | `api/admin/payments/trapay/index.ts` | `AdminPayments` | GET, PATCH | `requirePaymentStaff` / `requirePaymentAdmin` | JSON settings | masked settings | Cloud Supabase | Yes | TRAPAY config | No | ACTIVE_REQUIRED |
| 7 | `/api/admin/payments/trapay/test` | `api/admin/payments/trapay/test.ts` | `AdminPayments` | POST | `requirePaymentAdmin` | `{ method }` | `{ ok, orderId, providerStatus }` | Cloud Supabase | Yes | TRAPAY sandbox | No | ACTIVE_REQUIRED |
| 8 | `/api/webhooks/trapay` | `api/webhooks/trapay.ts` | TRAPAY provider | POST | signature TBD | raw body | `{ received: true }` | Cloud Supabase | Yes | TRAPAY | **Yes** | ACTIVE_REQUIRED (verification BLOCKED_EXTERNAL) |
| 9 | `/api/crm/clients/:id/files` | `api/crm/clients/[id]/files/index.ts` | `useClientFiles` | GET, POST, DELETE | `requireCrmStaff` | JSON metadata / query | `{ files }` / `{ file }` | Cloud Supabase + Storage | Yes | Supabase Storage | No | ACTIVE_REQUIRED |
| 10 | `/api/kyc/analyze-external` | `api/kyc/analyze-external.ts` | `AdminKYC` | POST | `requireKycReviewer` | JSON documents | `{ result }` | Cloud Supabase | Yes | OpenRouter | No | ACTIVE_REQUIRED |
| 11 | `/api/crm/workers` | `api/crm/workers/index.ts` | `AdminPanel` (now uses Supabase directly) | GET, POST | `requireAdmin` | JSON worker | `{ workers }` | Cloud Supabase | Yes | — | No | ACTIVE_OPTIONAL (still called by old path?) |
| 12 | `/api/crm/workers/:id` | `api/crm/workers/[id].ts` | none visible | PATCH, DELETE | `requireAdmin` | JSON role/name | ok | Cloud Supabase | Yes | — | No | ACTIVE_OPTIONAL |
| 13 | `/api/crm/workers/:id/reset-password` | `api/crm/workers/[id]/reset-password.ts` | none visible | POST | `requireAdmin` | JSON password | ok | Cloud Supabase | Yes | — | No | ACTIVE_OPTIONAL |
| 14 | `/api/v1/advertisers` | `api/v1/advertisers/index.ts` | `Advertisers` page | GET, POST | `requireCrmAdmin` | JSON | `{ data }` | Cloud Supabase | Yes | — | No | ACTIVE_OPTIONAL |
| 15 | `/api/v1/advertisers/:id` | `api/v1/advertisers/[id].ts` | `Advertisers` page | PATCH | `requireCrmAdmin` | JSON | `{ data }` | Cloud Supabase | Yes | — | No | ACTIVE_OPTIONAL |
| 16 | `/api/v1/advertisers/:id/codes` | `api/v1/advertisers/[id]/codes/index.ts` | `Advertisers` page | POST | `requireCrmAdmin` | JSON | `{ data }` | Cloud Supabase | Yes | — | No | ACTIVE_OPTIONAL |
| 17 | `/api/v1/advertisers/:id/codes/:codeId` | `api/v1/advertisers/[id]/codes/[codeId].ts` | none visible | DELETE | `requireCrmAdmin` | — | ok | Cloud Supabase | Yes | — | No | ACTIVE_OPTIONAL |
| 18 | `/api/v1/advertisers/:id/stats` | `api/v1/advertisers/[id]/stats.ts` | `Advertisers` page | GET | `requireCrmAdmin` | — | `{ data }` | Cloud Supabase | Yes | — | No | ACTIVE_OPTIONAL |
| 19 | `/api/ai/chat` | `api/ai/chat.ts` | `LiveChat` / AI chat | POST | Bearer user token | JSON messages | `{ reply }` | Cloud Supabase | Yes | OpenRouter | No | ACTIVE_OPTIONAL |
| 20 | `/api/employees/by-email` | none found | `TeamChat` | GET | — | — | `{ employee }` | — | — | No | **DEAD / MISSING** |
| 21 | `/api/employees` | none found | `TeamChat` | GET, POST | — | JSON employee | `{ employee }` / `{ employees }` | — | — | No | **DEAD / MISSING** |
| 22 | `/api/chat/conversations` | none found | `TeamChat` | GET, POST | — | JSON participantIds | `{ conversations }` / `{ conversation }` | — | — | No | **DEAD / MISSING** |
| 23 | `/api/chat/conversations/:id/messages` | none found | `TeamChat` | GET, POST | — | JSON message | `{ messages }` / `{ message }` | — | — | No | **DEAD / MISSING** |
| 24 | `/api/chat/conversations/:id/read` | none found | `TeamChat` | POST | — | — | ok | — | — | No | **DEAD / MISSING** |
| 25 | Socket.IO `:3003` | `Recovery/examples/websocket/server.ts` (demo only) | `TeamChat` | WebSocket | — | realtime events | presence/messages | — | — | No | **NOT_IMPLEMENTED** |

## Vercel-Specific Dependencies Audit
| Dependency | Status |
|------------|--------|
| `@vercel/node` imports | None found in `/api` handlers. |
| `VercelRequest` / `VercelResponse` types | None found. Handlers use `(req: any, res: any)`. |
| `process.env.VERCEL*` usage | `app-url.ts` references `VERCEL_ENV` only as a production-runtime hint; compatible with Node. |
| Serverless filesystem assumptions | None. |
| Vercel cron | None. |
| Edge runtime / streaming | None. Handlers use standard Node `res` object. |

## Adapter Strategy
- Add a Vercel-compatible `handler(req, res)` wrapper in `api-server`.
- Map Express `req.query` / `req.params` / `req.body` to the shape expected by handlers.
- Use `express.raw({ type: '*/*' })` only on the TRAPAY webhook path so signature verification can read raw bytes.
- Mount migrated routes under `/api/*` in `api-server/src/routes/index.ts`.

## TeamChat Decision
- **Backend**: `NOT_IMPLEMENTED` — no compatible implementation found.
- **Production UI**: will be disabled via `VITE_TEAMCHAT_ENABLED=false`.
- **Source**: preserved for a future dedicated phase.
