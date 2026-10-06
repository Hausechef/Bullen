import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" };

const VALID_ACTIONS = [
  "registerClient",
  "transaction",
  "activity",
  "kycUpdate",
] as const;
type Action = typeof VALID_ACTIONS[number];

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: JSON_HEADERS,
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return jsonError("Method not allowed", 405);

    // ── 1. Auth: verify Supabase JWT ───────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonError("Unauthorized", 401);
    }
    const token = authHeader.slice(7);

    const supabase = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_ANON_KEY"),
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return jsonError("Invalid token", 401);

    // ── 2. Input validation ────────────────────────────────────────────────────
    let body: { action?: unknown; payload?: unknown };
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const { action, payload } = body;

    if (
      typeof action !== "string" ||
      !(VALID_ACTIONS as readonly string[]).includes(action)
    ) {
      return jsonError(
        `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}`,
        400,
      );
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return jsonError("payload must be a non-null object", 400);
    }

    // ── 3. Forward to external CRM (or skip gracefully if not configured) ──────
    const crmUrl = Deno.env.get("CRM_API_URL");
    const crmKey = Deno.env.get("CRM_API_KEY");

    if (!crmUrl || !crmKey) {
      // CRM not yet configured — log server-side, return success to frontend
      console.warn(
        `[crm-sync] CRM_API_URL/CRM_API_KEY not configured. Skipping action: ${action}`,
      );
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: JSON_HEADERS,
      });
    }

    let crmResult: unknown = {};
    try {
      const crmRes = await fetch(`${crmUrl}/api/crm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${crmKey}`,
          "X-Caller-User-Id": user.id,
          "X-Caller-Email": user.email ?? "",
        },
        body: JSON.stringify({ action, payload }),
        // Abort if CRM is slow — don't block the user
        signal: AbortSignal.timeout(8000),
      });

      if (!crmRes.ok) {
        const txt = await crmRes.text().catch(() => "");
        console.warn(
          `[crm-sync] CRM responded ${crmRes.status} for action ${action}: ${txt}`,
        );
        // Non-critical: return ok so the frontend doesn't error
        return new Response(
          JSON.stringify({ ok: true, crmStatus: crmRes.status }),
          { headers: JSON_HEADERS },
        );
      }

      crmResult = await crmRes.json().catch(() => ({}));
    } catch (err) {
      console.error(`[crm-sync] Network error for action ${action}:`, err);
      // Non-critical: CRM failures must not crash the user flow
      return new Response(JSON.stringify({ ok: true, crmError: "timeout" }), {
        headers: JSON_HEADERS,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, ...(crmResult as object) }),
      { headers: JSON_HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error
      ? err.message
      : "Unexpected CRM sync error";
    return jsonError(message, 500);
  }
});
