import crypto from "node:crypto";
import { getAdminClient } from "../_lib/supabase.js";
import { clientIp, readRawBody, tryParseJson } from "../_lib/http.js";
import { hit } from "../_lib/ratelimit.js";
import { loadCompanyContext, verifyTrapayWebhook } from "../_lib/trapay/config.js";
import { mapTrapayStatus } from "../_lib/trapay/status-map.js";

// TRAPAY server-to-server webhook intake.
//
// Security posture (fail-closed):
//  - Every delivery is stored raw in trapay_events with a deterministic
//    fingerprint (UNIQUE) so provider retries/replays are idempotent.
//  - The webhook verification specification (signature header/algorithm/
//    secret) is NOT publicly documented — see verifyTrapayWebhook(). Until the
//    real specification is obtained from TRAPAY and implemented, every event
//    is stored as verified=false and NO balance credit can ever run.
//    TRAPAY_DOCUMENTATION_REQUIRED
//  - The response is always 200 {received:true} after the event is stored so
//    the provider does not retry-storm while BullenHaus cannot yet verify.

const WEBHOOK_RATE_LIMIT = 120;
const WEBHOOK_RATE_WINDOW_MS = 60_000;

function extractEventFields(payload: any): {
  providerPaymentId: string | null;
  orderId: string | null;
  providerStatus: string | null;
  eventType: string | null;
  amount: number | null;
  currency: string | null;
} {
  const result = typeof payload?.result === "object" && payload.result !== null ? payload.result : {};
  const pickString = (...candidates: unknown[]): string | null => {
    for (const c of candidates) {
      if (typeof c === "string" && c.length > 0) return c;
    }
    return null;
  };
  const pickNumber = (...candidates: unknown[]): number | null => {
    for (const c of candidates) {
      const n = typeof c === "number" ? c : Number(c);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  };
  return {
    providerPaymentId: pickString(result.id, payload?.id, payload?.paymentId, payload?.payment_id),
    orderId: pickString(result.orderId, payload?.orderId, payload?.order_id),
    providerStatus: pickString(result.status, payload?.status),
    eventType: pickString(payload?.event, payload?.type, payload?.event_type),
    amount: pickNumber(payload?.amount, result.amount),
    currency: pickString(payload?.currency, result.currency),
  };
}

async function findDepositId(supabase: any, providerPaymentId: string | null, orderId: string | null): Promise<string | null> {
  if (providerPaymentId) {
    const { data } = await supabase
      .from("deposits")
      .select("id")
      .eq("provider_payment_id", providerPaymentId)
      .maybeSingle();
    if (data) return data.id;
  }
  if (orderId) {
    const { data } = await supabase
      .from("deposits")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();
    if (data) return data.id;
  }
  return null;
}

// Only reachable once verifyTrapayWebhook can actually verify deliveries.
// Amount/currency must be present and match the stored deposit before any
// credit; unknown statuses never transition anything.
async function processVerifiedEvent(
  supabase: any,
  eventRowId: string,
  companyId: string | null,
  depositId: string | null,
  fields: ReturnType<typeof extractEventFields>,
): Promise<void> {
  const finish = (note?: string) =>
    supabase
      .from("trapay_events")
      .update({ processed: true, processed_at: new Date().toISOString(), error: note ?? null })
      .eq("id", eventRowId);

  if (!depositId) {
    await finish("unknown_deposit");
    return;
  }
  const { data: deposit } = await supabase
    .from("deposits")
    .select("id, user_id, company_id, order_id, amount, currency, status")
    .eq("id", depositId)
    .maybeSingle();
  if (!deposit) {
    await finish("unknown_deposit");
    return;
  }

  const mapped = mapTrapayStatus(fields.providerStatus);
  if (mapped === "UNKNOWN_PROVIDER_STATUS") {
    await finish("unknown_provider_status_no_transition");
    return;
  }

  if (mapped === "PAID") {
    // Security guards: amount AND currency must both be present and match.
    if (fields.amount === null || fields.currency === null) {
      await supabase.from("company_payment_audit").insert({
        company_id: companyId,
        action: "TRAPAY_WEBHOOK_REJECTED",
        field_name: "trapay_events.id",
        details: { event_id: eventRowId, deposit_id: deposit.id, reason: "missing_amount_or_currency" },
      });
      await finish("rejected_missing_amount_or_currency");
      return;
    }
    const result = await supabase.rpc("credit_trapay_deposit", {
      p_deposit_id: deposit.id,
      p_expected_amount: fields.amount,
      p_expected_currency: fields.currency,
      p_source: "WEBHOOK",
    });
    const payload = result?.data ?? null;
    if (!payload || payload.ok !== true) {
      const reason = payload?.error ?? "rpc_error";
      await supabase.from("company_payment_audit").insert({
        company_id: companyId,
        action: "TRAPAY_WEBHOOK_REJECTED",
        field_name: "trapay_events.id",
        details: { event_id: eventRowId, deposit_id: deposit.id, reason },
      });
      await finish(`credit_refused_${String(reason)}`);
      return;
    }
    await finish();
    return;
  }

  // Non-final status transitions (PENDING / FAILED / CANCELLED / REFUNDED /
  // CHARGEBACK) — never credit, only reflect the provider state.
  const now = new Date().toISOString();
  const finalNegative = mapped === "FAILED" || mapped === "CANCELLED";
  const update: Record<string, unknown> = {
    status: mapped,
    provider_status: fields.providerStatus,
    ...(finalNegative ? { failed_at: now, failure_reason: `provider_status_${fields.providerStatus}` } : {}),
  };
  await supabase.from("deposits").update(update).eq("id", deposit.id).in("status", ["CREATED", "PENDING", "PROCESSING"]);
  if (mapped === "FAILED") {
    await supabase.from("notifications").insert({
      user_id: deposit.user_id,
      type: "deposit",
      title: "Deposit failed",
      message: `Your deposit of ${deposit.amount} ${deposit.currency} was not completed.`,
      data: { deposit_id: deposit.id, order_id: deposit.order_id },
    });
  }
  await finish();
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const ip = clientIp(req);
  if (!hit(`wh:${ip}`, WEBHOOK_RATE_LIMIT, WEBHOOK_RATE_WINDOW_MS).allowed) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  let raw: string;
  try {
    raw = await readRawBody(req);
  } catch {
    res.status(400).json({ error: "Unreadable payload" });
    return;
  }

  const parsed = tryParseJson(raw);
  const payload = parsed.ok ? parsed.value : null;

  const supabase = getAdminClient();
  const context = await loadCompanyContext(supabase).catch(() => null);

  const fields = extractEventFields(payload);
  const depositId = await findDepositId(supabase, fields.providerPaymentId, fields.orderId);

  const fingerprint = crypto
    .createHash("sha256")
    .update(JSON.stringify({
      company: context?.company.id ?? null,
      payment: fields.providerPaymentId,
      order: fields.orderId,
      status: fields.providerStatus,
      event: fields.eventType,
      body: raw,
    }))
    .digest("hex");

  const verification = verifyTrapayWebhook(req, raw);

  const { data: existing } = await supabase
    .from("trapay_events")
    .select("id")
    .eq("fingerprint", fingerprint)
    .maybeSingle();
  if (existing) {
    // Duplicate delivery (retry/replay) — already recorded, nothing to do.
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  const { data: eventRow, error: insertError } = await supabase
    .from("trapay_events")
    .insert({
      company_id: context?.company.id ?? null,
      deposit_id: depositId,
      fingerprint,
      event_type: fields.eventType,
      provider_status: fields.providerStatus,
      payload: parsed.ok ? (payload as any) : null,
      verified: verification.verified,
      processed: false,
      error: verification.verified ? null : verification.reason,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error(JSON.stringify({ scope: "trapay.webhook", kind: "event_store_failed", error: insertError.message }));
    res.status(500).json({ error: "Could not store event" });
    return;
  }

  console.info(JSON.stringify({
    scope: "trapay.webhook", eventId: eventRow.id, depositId,
    providerPaymentId: fields.providerPaymentId ? `${fields.providerPaymentId.slice(0, 8)}…` : null,
    providerStatus: fields.providerStatus, verified: false,
  }));

  if (verification.verified) {
    await processVerifiedEvent(supabase, eventRow.id, context?.company.id ?? null, depositId, fields).catch(async (err) => {
      await supabase
        .from("trapay_events")
        .update({ error: `processing_failed: ${String(err?.message ?? err).slice(0, 200)}` })
        .eq("id", eventRow.id);
    });
  }

  res.status(200).json({ received: true });
}
