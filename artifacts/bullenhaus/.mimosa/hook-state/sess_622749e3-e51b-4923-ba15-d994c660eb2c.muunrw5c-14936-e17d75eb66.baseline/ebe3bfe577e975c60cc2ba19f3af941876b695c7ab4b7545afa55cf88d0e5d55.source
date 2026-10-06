import {
  AI_PROFILES,
  type AiProfile,
  getAiConfig,
  normalizeProfile,
} from "./ai-config.ts";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type CompletionInput = {
  messages: unknown;
  profile?: unknown;
  maxTokens?: number;
  temperature?: number;
};

export type CompletionResult = {
  reply: string;
  provider: "openrouter";
  model: string;
  fallbackUsed: boolean;
  profile: AiProfile;
};

function sanitizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m): m is ChatMessage => {
      const item = m as Partial<ChatMessage>;
      return (
        (item.role === "system" || item.role === "user" ||
          item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
      );
    })
    .slice(-30)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 12000) }));
}

function providerPolicy(config: ReturnType<typeof getAiConfig>) {
  const policy: Record<string, unknown> = {
    allow_fallbacks: config.openrouter.allowFallbacks,
    sort: config.openrouter.sort,
    data_collection: config.openrouter.dataCollection,
  };
  if (config.openrouter.zdr) policy.zdr = true;
  return policy;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function logProviderError(context: Record<string, unknown>) {
  console.error("[ai-chat] provider failure", context);
}

export async function completeWithOpenRouter(
  input: CompletionInput,
): Promise<CompletionResult> {
  const config = getAiConfig();
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!config.enabled) throw new Error("AI provider disabled");
  if (!apiKey) throw new Error("AI provider not configured");

  const profile = normalizeProfile(input.profile);
  const preset = AI_PROFILES[profile];
  const messages = sanitizeMessages(input.messages);
  if (messages.length === 0) throw new Error("messages array required");

  const maxTokens = Math.min(
    typeof input.maxTokens === "number" ? input.maxTokens : preset.maxTokens,
    2000,
  );
  const temperature = typeof input.temperature === "number"
    ? input.temperature
    : preset.temperature;
  const models = [config.primaryModel, config.fallbackModel].filter((
    m,
    i,
    arr,
  ) => m && arr.indexOf(m) === i);
  const endpoint = `${
    config.openrouter.baseUrl.replace(/\/$/, "")
  }/chat/completions`;

  let lastStatus: number | "network" | "timeout" = "network";
  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://bullenhaus.app",
          "X-Title": "Bullenhaus Platform",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          provider: providerPolicy(config),
        }),
      }, config.timeoutMs);

      if (!response.ok) {
        lastStatus = response.status;
        logProviderError({
          provider: "openrouter",
          profile,
          model,
          status: response.status,
          fallbackAttempt: index > 0,
        });
        continue;
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content;
      if (typeof reply === "string" && reply.trim()) {
        return {
          reply: reply.trim(),
          provider: "openrouter",
          model,
          fallbackUsed: index > 0,
          profile,
        };
      }
      lastStatus = response.status;
      logProviderError({
        provider: "openrouter",
        profile,
        model,
        status: response.status,
        reason: "empty_response",
        fallbackAttempt: index > 0,
      });
    } catch (error) {
      lastStatus = error instanceof DOMException && error.name === "AbortError"
        ? "timeout"
        : "network";
      logProviderError({
        provider: "openrouter",
        profile,
        model,
        status: lastStatus,
        fallbackAttempt: index > 0,
      });
    }
  }

  throw new Error(`AI provider unavailable (${lastStatus})`);
}
