import { getAdminClient } from "../_lib/supabase.js";

const PROVIDER = "openrouter";
const PRIMARY_MODEL = process.env.AI_PRIMARY_MODEL || "deepseek/deepseek-chat";
const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || "openai/gpt-4o-mini";
const BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS || "30000");

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.isFinite(TIMEOUT_MS) ? TIMEOUT_MS : 30000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const auth = req.headers["authorization"] as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }
  const token = auth.slice(7);
  const supabase = getAdminClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || (process.env.AI_PROVIDER || PROVIDER).toLowerCase() !== PROVIDER) {
    res.status(503).json({ error: "AI service not configured on this server." });
    return;
  }

  const { messages, max_tokens, temperature, profile } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required." });
    return;
  }

  const MAX_MSG_LEN = 4000;
  const MAX_MESSAGES = 20;
  const sanitizedMessages = messages
    .slice(0, MAX_MESSAGES)
    .filter((m: any) => typeof m === "object" && m !== null && m.role !== "system")
    .map((m: any) => ({
      role: String(m.role).slice(0, 10),
      content: typeof m.content === "string" ? m.content.slice(0, MAX_MSG_LEN) : "",
    }))
    .filter((m: any) => m.content.length > 0);

  if (sanitizedMessages.length === 0) {
    res.status(400).json({ error: "messages array is required." });
    return;
  }

  const models = [PRIMARY_MODEL, FALLBACK_MODEL].filter((m, i, arr) => m && arr.indexOf(m) === i);
  const endpoint = `${BASE_URL.replace(/\/$/, "")}/chat/completions`;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    try {
      const upstream = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://bullenhaus.app",
          "X-Title": "Bullenhaus Platform",
        },
        body: JSON.stringify({
          model,
          messages: sanitizedMessages,
          max_tokens: Math.min(Number(max_tokens) || (profile === "bullenhouse-crm" ? 1000 : 700), 2000),
          temperature: typeof temperature === "number" ? temperature : profile === "bullenhouse-crm" ? 0.15 : 0.2,
          provider: {
            allow_fallbacks: process.env.AI_OPENROUTER_ALLOW_FALLBACKS !== "false",
            sort: process.env.AI_OPENROUTER_SORT || "price",
            data_collection: process.env.AI_OPENROUTER_DATA_COLLECTION || "deny",
            ...(process.env.AI_OPENROUTER_ZDR === "true" ? { zdr: true } : {}),
          },
        }),
      });

      if (!upstream.ok) {
        console.error("[api/ai/chat] provider failure", { provider: PROVIDER, model, status: upstream.status, fallbackAttempt: index > 0 });
        continue;
      }

      const data = await upstream.json() as any;
      const reply = data.choices?.[0]?.message?.content;
      if (typeof reply === "string" && reply.trim()) {
        res.json({ reply: reply.trim(), provider: PROVIDER, model, fallbackUsed: index > 0 });
        return;
      }
    } catch (err: unknown) {
      console.error("[api/ai/chat] provider failure", { provider: PROVIDER, model, status: err instanceof Error ? err.name : "network", fallbackAttempt: index > 0 });
    }
  }

  res.status(502).json({ error: "AI service is temporarily unavailable. Please try again later." });
}
