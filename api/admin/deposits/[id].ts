import { getAdminClient } from "../../_lib/supabase.js";
import { requirePaymentAdmin, requirePaymentStaff } from "../../_lib/payment-auth.js";
import { clientIp } from "../../_lib/http.js";
import { hit } from "../../_lib/ratelimit.js";
import type { Caller } from "../../_lib/payment-auth.js";

// Admin deposit details + restricted manual actions.
//
// MANUAL SETTLEMENT ("mark_paid") IS DISABLED BY DEFAULT. It is an
// exceptional, audited operational fallback — never the normal way to settle a
// TRAPAY payment. It runs only when ALL of the following hold:
//   * server env TRAPAY_MANUAL_SETTLEMENT_ENABLED === "true" (default false);
//   * caller is the platform 'admin' role (verified against the users table);
//   * body carries a mandatory reason (>= 10 chars);
//   * body carries the TRAPAY payment id the admin verified, and it matches
//     the one stored on the deposit;
//   * body carries the exact confirmation sentence
//     "I verified this payment in the TRAPAY merchant dashboard".
// The credit itself always runs through credit_trapay_deposit() — the same
// atomic, row-locked, exactly-once RPC the (future, verified) webhook path
// uses. The manual path adds no bypass: it cannot double-credit, and every
// attempt (success or refusal) is written to the payment audit log with
// admin id, company id, deposit id, reason and IP metadata.
//
// "cancel" is an administrative, non-financial transition for deposits whose
// provider outcome will never be confirmed (CREATED / PROVIDER_CREATE_PENDING /
// stuck PENDING). It never touches a balance; a later settlement attempt on a
// CANCELLED deposit is refused by the RPC.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REQUIRED_CONFIRMATION = "I verified this payment in the TRAPAY merchant dashboard";
const MANUAL_SETTLEMENT_RATE_LIMIT = 5;
const MANUAL_SETTLEMENT_WINDOW_MS = 10 * 60_000;
const CANCELABLE_STATUSES = ["CREATED", "PROVIDER_CREATE_PENDING", "PENDING"];

function manualSettlementEnabled(): boolean {
  return process.env["TRAPAY_MANUAL_SETTLEMENT_ENABLED"] === "true";
}

function ipMetadata(req: any) {
  return { ip: clientIp(req), userAgent: String(req.headers?.["user-agent"] ?? "").slice(0, 200) };
}

async function loadDeposit(supabase: any, id: string) {
  const { data: deposit } = await supabase
    .from("deposits")
    .select("*, users(email, full_name, display_name)")
    .eq("id", id)
    .maybeSingle();
  return deposit ?? null;
}

export default async function handler(req: any, res: any) {
  const id = String(req.query?.id ?? "");
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: "Invalid deposit id" });
    return;
  }
  const supabase = getAdminClient();

  if (req.method === "GET") {
    const caller = await requirePaymentStaff(req, res);
    if (!caller) return;

    const deposit = await loadDeposit(supabase, id);
    if (!deposit) {
      res.status(404).json({ error: "Deposit not found" });
      return;
    }
    const [{ data: events }, { data: audit }] = await Promise.all([
      supabase.from("trapay_events").select("id, event_type, provider_status, verified, processed, received_at, processed_at, error").eq("deposit_id", id).order("received_at", { ascending: false }),
      supabase.from("company_payment_audit").select("id, action, field_name, details, created_at, admin_id").eq("details->>deposit_id", id).order("created_at", { ascending: false }),
    ]);

    res.json({
      deposit: { ...deposit, amount: Number(deposit.amount) },
      // Server-side capability flags so the UI never guesses permissions.
      capabilities: {
        canMarkPaid: manualSettlementEnabled() && caller.role === "admin" && ["PENDING", "PROCESSING", "PROVIDER_CREATE_PENDING"].includes(deposit.status),
        canCancel: caller.role === "admin" && CANCELABLE_STATUSES.includes(deposit.status),
      },
      events: events ?? [],
      audit: audit ?? [],
    });
    return;
  }

  if (req.method === "POST") {
    const caller = await requirePaymentAdmin(req, res);
    if (!caller) return;
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    const action = String(body.action ?? "");

    if (action === "mark_paid") {
      await handleMarkPaid(req, res, supabase, caller, id, body);
      return;
    }
    if (action === "cancel") {
      await handleCancel(req, res, supabase, caller, id, body);
      return;
    }
    res.status(400).json({ error: "Unsupported action" });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

async function handleMarkPaid(req: any, res: any, supabase: any, caller: Caller, id: string, body: any) {
  // Feature flag — default OFF. Read from server env only.
  if (!manualSettlementEnabled()) {
    res.status(403).json({ error: "Manual settlement is disabled for this deployment" });
    return;
  }
  if (!hit(`ms:${caller.id}`, MANUAL_SETTLEMENT_RATE_LIMIT, MANUAL_SETTLEMENT_WINDOW_MS).allowed) {
    res.status(429).json({ error: "Too many manual settlement attempts" });
    return;
  }

  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const providerPaymentId = typeof body.providerPaymentId === "string" ? body.providerPaymentId.trim() : "";
  const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";

  if (reason.length < 10) {
    res.status(400).json({ error: "A reason of at least 10 characters is required" });
    return;
  }
  if (confirmation !== REQUIRED_CONFIRMATION) {
    res.status(400).json({ error: `Confirmation required: "${REQUIRED_CONFIRMATION}"` });
    return;
  }

  const deposit = await loadDeposit(supabase, id);
  if (!deposit) {
    res.status(404).json({ error: "Deposit not found" });
    return;
  }
  if (deposit.status === "PAID") {
    res.status(409).json({ error: "Deposit is already paid" });
    return;
  }
  if (!["PENDING", "PROCESSING", "PROVIDER_CREATE_PENDING"].includes(deposit.status)) {
    res.status(409).json({ error: `Deposit in status ${deposit.status} cannot be marked paid` });
    return;
  }
  // The admin must confirm the exact TRAPAY payment id; it must match what
  // BullenHaus stored. Without a stored id there is nothing to verify against.
  if (!deposit.provider_payment_id) {
    res.status(409).json({ error: "Deposit has no TRAPAY payment id to verify against" });
    return;
  }
  if (providerPaymentId !== deposit.provider_payment_id) {
    res.status(400).json({ error: "TRAPAY payment id does not match this deposit" });
    return;
  }

  const { data: credit } = await supabase.rpc("credit_trapay_deposit", {
    p_deposit_id: deposit.id,
    p_expected_amount: Number(deposit.amount),
    p_expected_currency: deposit.currency,
    p_source: "MANUAL_ADMIN",
  });

  const meta = ipMetadata(req);
  if (!credit || credit.ok !== true) {
    const refusalReason = credit?.error ?? "rpc_error";
    await supabase.from("company_payment_audit").insert({
      company_id: deposit.company_id,
      admin_id: caller.id,
      action: "TRAPAY_DEPOSIT_MANUAL_MARK_PAID_REJECTED",
      field_name: "deposits.status",
      details: {
        deposit_id: deposit.id, order_id: deposit.order_id, reason,
        refusal_reason: refusalReason, ...meta,
      },
    });
    res.status(409).json({ error: `Credit refused: ${refusalReason}` });
    return;
  }

  await supabase.from("company_payment_audit").insert({
    company_id: deposit.company_id,
    admin_id: caller.id,
    action: "TRAPAY_DEPOSIT_MANUAL_MARK_PAID",
    field_name: "deposits.status",
    details: {
      deposit_id: deposit.id, order_id: deposit.order_id,
      amount: Number(deposit.amount), currency: deposit.currency,
      provider_payment_id: deposit.provider_payment_id,
      reason, ...meta,
    },
  });

  console.info(JSON.stringify({
    scope: "trapay.manual_credit", depositId: deposit.id, orderId: deposit.order_id,
    adminId: caller.id, amount: Number(deposit.amount), currency: deposit.currency,
  }));

  res.json({ ok: true, status: "PAID", alreadyPaid: credit.already_paid === true });
}

async function handleCancel(req: any, res: any, supabase: any, caller: Caller, id: string, body: any) {
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 10) {
    res.status(400).json({ error: "A reason of at least 10 characters is required" });
    return;
  }

  const deposit = await loadDeposit(supabase, id);
  if (!deposit) {
    res.status(404).json({ error: "Deposit not found" });
    return;
  }
  if (!CANCELABLE_STATUSES.includes(deposit.status)) {
    res.status(409).json({ error: `Deposit in status ${deposit.status} cannot be cancelled` });
    return;
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("deposits")
    .update({ status: "CANCELLED", failed_at: now, failure_reason: `cancelled_by_admin: ${reason.slice(0, 180)}` })
    .eq("id", deposit.id)
    .in("status", CANCELABLE_STATUSES);

  if (updateError) {
    res.status(500).json({ error: "Failed to cancel deposit" });
    return;
  }

  await supabase.from("company_payment_audit").insert({
    company_id: deposit.company_id,
    admin_id: caller.id,
    action: "TRAPAY_DEPOSIT_CANCELLED",
    field_name: "deposits.status",
    details: {
      deposit_id: deposit.id, order_id: deposit.order_id,
      previous_status: deposit.status, reason, ...ipMetadata(req),
    },
  });

  console.info(JSON.stringify({
    scope: "trapay.cancel", depositId: deposit.id, orderId: deposit.order_id,
    adminId: caller.id, previousStatus: deposit.status,
  }));

  res.json({ ok: true, status: "CANCELLED" });
}
