import { Router, type IRouter } from "express";

const router: IRouter = Router();

const PROVIDER = "openrouter";
const PRIMARY_MODEL = process.env.AI_PRIMARY_MODEL || "deepseek/deepseek-chat-v3.1";
const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || "openai/gpt-4.1-mini";
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

router.get("/status", (_req, res) => {
  res.json({
    configured: Boolean(process.env.OPENROUTER_API_KEY),
    enabled: process.env.AI_OPENROUTER_ENABLED !== "false",
    provider: PROVIDER,
    primaryModel: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
    routing: {
      allowFallbacks: process.env.AI_OPENROUTER_ALLOW_FALLBACKS !== "false",
      sort: process.env.AI_OPENROUTER_SORT || "price",
      dataCollection: process.env.AI_OPENROUTER_DATA_COLLECTION || "deny",
      zdr: process.env.AI_OPENROUTER_ZDR === "true",
    },
    profiles: {
      "bullenhouse-livechat": { temperature: 0.2, maxTokens: 700 },
      "bullenhouse-crm": { temperature: 0.15, maxTokens: 1000 },
    },
  });
});

router.post("/chat", async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || (process.env.AI_PROVIDER || PROVIDER).toLowerCase() !== PROVIDER) {
    res.status(503).json({ error: "AI service not configured on this server." });
    return;
  }

  const { messages, max_tokens, temperature, profile } = req.body as {
    messages?: { role: string; content: string }[];
    max_tokens?: number;
    temperature?: number;
    profile?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
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
          messages,
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
        req.log.warn({ provider: PROVIDER, model, status: upstream.status, fallbackAttempt: index > 0 }, "AI provider failure");
        continue;
      }

      const data = await upstream.json() as {
        choices?: { message?: { content?: string } }[];
      };
      const reply = data.choices?.[0]?.message?.content;
      if (typeof reply === "string" && reply.trim()) {
        res.json({ reply: reply.trim(), provider: PROVIDER, model, fallbackUsed: index > 0 });
        return;
      }
    } catch (err: unknown) {
      req.log.warn({ provider: PROVIDER, model, err: err instanceof Error ? err.name : "network", fallbackAttempt: index > 0 }, "AI provider failure");
    }
  }

  res.status(502).json({ error: "AI service is temporarily unavailable. Please try again later." });
});

export default router;
