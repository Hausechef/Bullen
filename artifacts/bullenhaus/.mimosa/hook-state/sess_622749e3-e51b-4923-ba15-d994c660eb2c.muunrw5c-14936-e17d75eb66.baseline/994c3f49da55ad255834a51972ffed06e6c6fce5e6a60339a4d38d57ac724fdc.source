export type AiProfile = "bullenhouse-livechat" | "bullenhouse-crm";

export const AI_PROVIDER = "openrouter";
export const DEFAULT_PRIMARY_MODEL = "deepseek/deepseek-chat-v3.1";
export const DEFAULT_FALLBACK_MODEL = "openai/gpt-4.1-mini";
export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const AI_PROFILES: Record<AiProfile, {
  label: string;
  maxTokens: number;
  temperature: number;
}> = {
  "bullenhouse-livechat": {
    label: "Bullenhouse Live Chat",
    maxTokens: 700,
    temperature: 0.2,
  },
  "bullenhouse-crm": {
    label: "Bullenhouse CRM",
    maxTokens: 1000,
    temperature: 0.15,
  },
};

export function normalizeProfile(value: unknown): AiProfile {
  return value === "bullenhouse-crm"
    ? "bullenhouse-crm"
    : "bullenhouse-livechat";
}

export function getAiConfig() {
  const provider = (Deno.env.get("AI_PROVIDER") || AI_PROVIDER).toLowerCase();
  const primaryModel = Deno.env.get("AI_PRIMARY_MODEL") ||
    DEFAULT_PRIMARY_MODEL;
  const fallbackModel = Deno.env.get("AI_FALLBACK_MODEL") ||
    DEFAULT_FALLBACK_MODEL;
  const timeoutMs = Number(Deno.env.get("AI_REQUEST_TIMEOUT_MS") || "30000");

  return {
    provider,
    enabled: provider === AI_PROVIDER &&
      Deno.env.get("AI_OPENROUTER_ENABLED") !== "false",
    primaryModel,
    fallbackModel,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 30000,
    openrouter: {
      baseUrl: Deno.env.get("OPENROUTER_BASE_URL") ||
        DEFAULT_OPENROUTER_BASE_URL,
      allowFallbacks: Deno.env.get("AI_OPENROUTER_ALLOW_FALLBACKS") !== "false",
      sort: Deno.env.get("AI_OPENROUTER_SORT") || "price",
      dataCollection: Deno.env.get("AI_OPENROUTER_DATA_COLLECTION") || "deny",
      zdr: Deno.env.get("AI_OPENROUTER_ZDR") === "true",
    },
  };
}
