import crypto from "node:crypto";
import { getAdminClient } from "../../../_lib/supabase.js";
import { requirePaymentAdmin } from "../../../_lib/payment-auth.js";
import { getCanonicalAppUrl } from "../../../_lib/app-url.js";
import { loadCompanyContext, resolveBaseUrl } from "../../../_lib/trapay/config.js";
import { createTrapayPayment, TrapayClientError } from "../../../_lib/trapay/client.js";
import { resolveGatewayId } from "../../../_lib/trapay/validation.js";

// "Run Sandbox Payment Test" — the honest connectivity check.
// TRAPAY documents no credentials healthcheck endpoint, so instead of faking
// "Connection successful" this runs the one documented call: a real sandbox
// payment creation with a BH-TEST- order id. No deposit row, no credit.
// Production environment is refused — tests run against the sandbox only.

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const caller = await requirePaymentAdmin(req, res);
  if (!caller) return;

  const supabase = getAdminClient();
  const context = await loadCompanyContext(supabase);
  if (!context || !context.settings) {
    res.status(400).json({ ok: false, error: "TRAPAY is not configured for the current company" });
    return;
  }
  const settings = context.settings;
  if (settings.environment !== "SANDBOX") {
    res.status(400).json({ ok: false, error: "Sandbox tests are only available while the environment is SANDBOX" });
    return;
  }
  if (!settings.public_key) {
    res.status(400).json({ ok: false, error: "Missing Public Key" });
    return;
  }

  const method = String(req.body?.method ?? "CARD").toUpperCase() === "BANK_TRANSFER" ? "BANK_TRANSFER" : "CARD";
  const gatewayId = resolveGatewayId(method, settings);
  if (!gatewayId) {
    res.status(400).json({ ok: false, error: `Missing ${method === "CARD" ? "Card" : "Bank Transfer"} Gateway ID` });
    return;
  }
  const baseUrl = resolveBaseUrl(settings);
  if (!baseUrl) {
    res.status(400).json({ ok: false, error: "Missing sandbox base URL" });
    return;
  }
  // Sandbox test callbacks also come from the canonical APP_URL config, never
  // from request headers.
  let origin: string;
  try {
    origin = getCanonicalAppUrl().origin;
  } catch {
    res.status(503).json({ ok: false, error: "APP_URL is not configured on the server; callbacks cannot be built" });
    return;
  }

  const orderId = `BH-TEST-${crypto.randomUUID()}`;
  const amount = Number(settings.minimum_deposit);
  const currency = settings.default_currency;
  const statusUrl = (page: string) => `${origin}/trade/deposit/${page}?test=${orderId}`;

  try {
    const result = await createTrapayPayment(baseUrl, {
      publicKey: settings.public_key,
      gateway: gatewayId,
      orderId,
      amount,
      currency,
      successUrl: statusUrl("success"),
      failUrl: statusUrl("failed"),
      pendingUrl: statusUrl("pending"),
    });
    await supabase.from("company_payment_audit").insert({
      company_id: context.company.id,
      admin_id: caller.id,
      action: "TRAPAY_SANDBOX_TEST",
      field_name: null,
      details: { ok: true, method, providerPaymentId: result.providerPaymentId, providerStatus: result.providerStatus },
    });
    res.json({ ok: true, orderId, providerStatus: result.providerStatus, checkoutUrl: result.proxyUrl });
  } catch (err) {
    const kind = err instanceof TrapayClientError ? err.kind : "unexpected_error";
    const providerStatus = err instanceof TrapayClientError ? err.httpStatus ?? null : null;
    await supabase.from("company_payment_audit").insert({
      company_id: context.company.id,
      admin_id: caller.id,
      action: "TRAPAY_SANDBOX_TEST",
      field_name: null,
      details: { ok: false, method, kind, providerHttpStatus: providerStatus },
    });
    res.status(502).json({ ok: false, error: `Sandbox payment test failed (${kind})` });
  }
}
