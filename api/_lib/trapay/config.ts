import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyPaymentSettingsRecord, CompanyRecord } from "./types.js";

// Loads the current company and its TRAPAY configuration server-side.
// The company is resolved from the database (single active company on this
// platform) — never from client input. All queries run with the service-role
// client; company_payment_settings is deny-all under RLS.

export interface ResolvedCompanyContext {
  company: CompanyRecord;
  settings: CompanyPaymentSettingsRecord | null;
}

function normalizeSettingsRow(row: any): CompanyPaymentSettingsRecord {
  return {
    id: row.id,
    company_id: row.company_id,
    provider: "TRAPAY",
    enabled: Boolean(row.enabled),
    environment: row.environment === "PRODUCTION" ? "PRODUCTION" : "SANDBOX",
    public_key: row.public_key ?? null,
    secret_encrypted: row.secret_encrypted ?? null,
    sandbox_base_url: row.sandbox_base_url ?? "https://demo.trapay.uk",
    production_base_url: row.production_base_url ?? null,
    card_enabled: Boolean(row.card_enabled),
    bank_transfer_enabled: Boolean(row.bank_transfer_enabled),
    card_gateway_id: row.card_gateway_id ?? null,
    bank_transfer_gateway_id: row.bank_transfer_gateway_id ?? null,
    default_currency: row.default_currency ?? "USD",
    supported_currencies: Array.isArray(row.supported_currencies) ? row.supported_currencies : ["USD"],
    minimum_deposit: Number(row.minimum_deposit ?? 50),
    maximum_deposit: Number(row.maximum_deposit ?? 100000),
    webhook_configured: Boolean(row.webhook_configured),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

export async function loadCompanyContext(supabase: SupabaseClient): Promise<ResolvedCompanyContext | null> {
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (companyError || !company) return null;

  const { data: settings } = await supabase
    .from("company_payment_settings")
    .select("*")
    .eq("company_id", company.id)
    .maybeSingle();

  return {
    company: company as CompanyRecord,
    settings: settings ? normalizeSettingsRow(settings) : null,
  };
}

export function resolveBaseUrl(settings: CompanyPaymentSettingsRecord): string | null {
  return settings.environment === "PRODUCTION" ? settings.production_base_url : settings.sandbox_base_url;
}

// Webhook verification — TRAPAY_DOCUMENTATION_REQUIRED.
//
// The public TRAPAY website confirms webhook integration exists, but the exact
// scheme (signature header, algorithm, secret format) is not publicly
// documented. Inventing one would be worse than having none: it would silently
// authorize untrusted payloads. Until the real specification is obtained from
// the TRAPAY dashboard or official documentation and implemented here, every
// webhook is stored but treated as UNVERIFIED and can never credit a balance.
export interface WebhookVerificationResult {
  verified: false;
  reason: "TRAPAY_DOCUMENTATION_REQUIRED";
}

export function verifyTrapayWebhook(_req: any, _rawBody: string): WebhookVerificationResult {
  return { verified: false, reason: "TRAPAY_DOCUMENTATION_REQUIRED" };
}
