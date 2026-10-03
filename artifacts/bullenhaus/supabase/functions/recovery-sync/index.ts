import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const JSON_HEADERS = { "Content-Type": "application/json" };
const MAX_BODY_BYTES = 16 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegistrationPayload = {
  externalUserId?: unknown;
  fullName?: unknown;
  email?: unknown;
  registeredAt?: unknown;
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getDatabaseSecret(): string {
  const modernSecrets = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (modernSecrets) {
    try {
      const parsed = JSON.parse(modernSecrets) as Record<string, string>;
      if (parsed.default) return parsed.default;
    } catch {
      // Fall back to the legacy service-role variable below.
    }
  }
  return requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

async function digest(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  const [left, right] = await Promise.all([digest(provided), digest(expected)]);
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) mismatch |= left[i] ^ right[i];
  return mismatch === 0;
}

function cleanString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > max) return null;
  return cleaned;
}

Deno.serve(async (request) => {
  try {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const suppliedSecret = request.headers.get("x-recovery-sync-secret") ?? "";
    if (!suppliedSecret || !(await secretsMatch(suppliedSecret, requiredEnv("RECOVERY_SYNC_SECRET")))) {
      return json({ error: "Unauthorized" }, 401);
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return json({ error: "Request body is too large" }, 413);
    }

    let payload: RegistrationPayload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const externalUserId = cleanString(payload.externalUserId, 191);
    const fullName = cleanString(payload.fullName, 80);
    const email = cleanString(payload.email, 254)?.toLowerCase() ?? null;
    const registeredAt = cleanString(payload.registeredAt, 64);
    const registeredDate = registeredAt ? new Date(registeredAt) : null;

    if (
      !externalUserId ||
      !fullName ||
      !email ||
      !EMAIL_PATTERN.test(email) ||
      !registeredDate ||
      Number.isNaN(registeredDate.getTime())
    ) {
      return json({ error: "Invalid recovery registration payload" }, 400);
    }

    const supabase = createClient(requiredEnv("SUPABASE_URL"), getDatabaseSecret(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const syncedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("recovery_registrations")
      .upsert(
        {
          external_user_id: externalUserId,
          full_name: fullName,
          email,
          source: "BHRecover",
          registered_at: registeredDate.toISOString(),
          last_synced_at: syncedAt,
          sync_metadata: { application: "BHRecover", schema_version: 1 },
        },
        { onConflict: "external_user_id" },
      )
      .select("id, registration_status, last_synced_at")
      .single();

    if (error) {
      console.error("[recovery-sync] Database upsert failed", error.code);
      return json({ error: "Unable to synchronize registration" }, 500);
    }

    return json({ ok: true, registration: data });
  } catch (error) {
    console.error(
      "[recovery-sync] Unexpected failure",
      error instanceof Error ? error.message : "unknown error",
    );
    return json({ error: "Recovery synchronization is unavailable" }, 500);
  }
});
