import { getAdminClient } from "../../_lib/supabase.js";
import { requirePaymentStaff } from "../../_lib/payment-auth.js";

// Admin: online (TRAPAY) deposits list. Staff view roles only; filtering by
// status/method/currency happens server-side, free-text search runs over the
// returned page (order id, TRAPAY payment id, customer email/name).

const MAX_LIMIT = 200;

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const caller = await requirePaymentStaff(req, res);
  if (!caller) return;

  const q = typeof req.query?.q === "string" ? req.query.q.trim().toLowerCase() : "";
  const status = typeof req.query?.status === "string" ? req.query.status.trim().toUpperCase() : "";
  const method = typeof req.query?.method === "string" ? req.query.method.trim().toUpperCase() : "";
  const currency = typeof req.query?.currency === "string" ? req.query.currency.trim().toUpperCase() : "";
  const limitRaw = Number(req.query?.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), MAX_LIMIT) : 100;

  const supabase = getAdminClient();
  let query = supabase
    .from("deposits")
    .select("id, order_id, provider, provider_payment_id, method, amount, currency, status, checkout_url, provider_status, created_at, updated_at, paid_at, users(email, full_name, display_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (method) query = query.eq("method", method);
  if (currency) query = query.eq("currency", currency);

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: "Failed to load deposits" });
    return;
  }

  let rows = data ?? [];
  if (q) {
    rows = rows.filter((r: any) => {
      const customer = r.users;
      const haystack = [
        r.order_id, r.provider_payment_id,
        customer?.email, customer?.full_name, customer?.display_name,
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }

  res.json({ deposits: rows });
}
