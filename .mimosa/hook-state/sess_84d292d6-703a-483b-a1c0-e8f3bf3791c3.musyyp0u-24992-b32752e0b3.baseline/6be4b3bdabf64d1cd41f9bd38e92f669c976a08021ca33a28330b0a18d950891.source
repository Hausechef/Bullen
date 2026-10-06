import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" };

// Reports whether the OpenRouter key is configured (DB or env) + active model.
// No sensitive data is returned.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data } = await admin.from("ai_settings").select(
      "openrouter_api_key, model",
    ).eq("id", 1).single();
    const configured = !!(data?.openrouter_api_key) ||
      !!Deno.env.get("OPENROUTER_API_KEY");
    return new Response(
      JSON.stringify({
        configured,
        model: data?.model ?? "deepseek/deepseek-chat",
      }),
      { headers: JSON_HEADERS },
    );
  } catch (_e) {
    const configured = !!Deno.env.get("OPENROUTER_API_KEY");
    return new Response(
      JSON.stringify({ configured, model: "deepseek/deepseek-chat" }),
      { headers: JSON_HEADERS },
    );
  }
});
