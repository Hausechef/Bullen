import { getAdminClient } from "../_lib/supabase.js";
import { requireUser } from "../_lib/payment-auth.js";
import { hit } from "../_lib/ratelimit.js";
import { clientIp } from "../_lib/http.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUS_POLL_RATE_LIMIT = 60;
const STATUS_POLL_WINDOW_MS = 60_000;

// Server-side deposit status for the return pages. These pages never credit
// anything — they render the status stored by the create/webhook flow.
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const caller = await requireUser(req, res);
  if (!caller) return;

  if (!hit(`st:${caller.id}:${clientIp(req)}`, STATUS_POLL_RATE_LIMIT, STATUS_POLL_WINDOW_MS).allowed) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  const id = String(req.query?.id ?? "");
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: "Invalid deposit id" });
    return;
  }

  const supabase = getAdminClient();
  const { data: deposit } = await supabase
    .from("deposits")
    .select("id, user_id, order_id, method, amount, currency, status, provider_status, checkout_url, failure_reason, created_at, updated_at, paid_at, failed_at")
    .eq("id", id)
    .maybeSingle();

  // Not found OR not owned by the caller -> identical 404 (no existence leak);
  // staff roles see everything through the admin endpoints instead.
  if (!deposit || deposit.user_id !== caller.id) {
    res.status(404).json({ error: "Deposit not found" });
    return;
  }

  res.json({
    deposit: {
      id: deposit.id,
      orderId: deposit.order_id,
      method: deposit.method,
      amount: Number(deposit.amount),
      currency: deposit.currency,
      status: deposit.status,
      providerStatus: deposit.provider_status,
      failureReason: deposit.failure_reason,
      createdAt: deposit.created_at,
      updatedAt: deposit.updated_at,
      paidAt: deposit.paid_at,
      failedAt: deposit.failed_at,
    },
  });
}
