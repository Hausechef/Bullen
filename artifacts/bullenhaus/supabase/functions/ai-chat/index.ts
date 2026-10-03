import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" };
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat";

function jsonError(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
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
    if (req.method !== "POST") {
      return jsonError("Method not allowed — use POST", 405);
    }

    const url = requiredEnv("SUPABASE_URL");
    const anonKey = requiredEnv("SUPABASE_ANON_KEY");
    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    // Require a logged-in user — blocks anonymous abuse of the OpenRouter key.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonError("Unauthorized", 401);
    }
    const token = authHeader.slice(7);
    const anonClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return jsonError("Unauthorized — login required", 401);
    }

    // Read provider key + model from DB (admin-configured), fallback to env.
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: settings } = await admin.from("ai_settings").select(
      "openrouter_api_key, model",
    ).eq("id", 1).single();
    const apiKey = settings?.openrouter_api_key ||
      Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return jsonError(
        "AI service not configured — set an OpenRouter API key in the Admin Panel",
        503,
      );
    }
    const model = (settings?.model && settings.model.trim()) ||
      Deno.env.get("OPENROUTER_MODEL") || DEFAULT_MODEL;

    let body: { messages?: unknown; max_tokens?: number; temperature?: number };
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return jsonError("messages array required", 400);
    }

    const orRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://www.bullen-haus.online",
        "X-Title": "Bullenhaus CRM",
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        max_tokens: Math.min(
          typeof body.max_tokens === "number" ? body.max_tokens : 600,
          2000,
        ),
        temperature: typeof body.temperature === "number"
          ? body.temperature
          : 0.2,
      }),
    });
    if (!orRes.ok) {
      const errText = await orRes.text().catch(() => "");
      console.error("[ai-chat] OpenRouter error:", orRes.status, errText);
      return jsonError(`AI provider error ${orRes.status}`, 502);
    }
    const data = await orRes.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ reply, model }), {
      headers: JSON_HEADERS,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI service error";
    const status = msg.includes("not configured")
      ? 503
      : msg.includes("messages")
      ? 400
      : 502;
    console.error("[ai-chat] proxy failure", { status, reason: msg });
    return jsonError(
      "AI service is temporarily unavailable. Please try again or contact support.",
      status,
    );
  }
});
