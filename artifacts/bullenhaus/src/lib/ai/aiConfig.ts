export const AI_PROVIDER = 'openrouter';
export const AI_PRIMARY_MODEL = 'deepseek/deepseek-chat';
export const AI_FALLBACK_MODEL = 'openai/gpt-4o-mini';

export type AiProfile = 'bullenhouse-livechat' | 'bullenhouse-crm';

export const AI_PROFILES: Record<AiProfile, {
  label: string;
  maxTokens: number;
  temperature: number;
}> = {
  'bullenhouse-livechat': {
    label: 'Bullenhouse Live Chat',
    maxTokens: 700,
    temperature: 0.2,
  },
  'bullenhouse-crm': {
    label: 'Bullenhouse CRM',
    maxTokens: 1000,
    temperature: 0.15,
  },
};

export const AI_MODEL_OPTIONS = [
  { value: AI_PRIMARY_MODEL, label: `Primary: ${AI_PRIMARY_MODEL}` },
  { value: AI_FALLBACK_MODEL, label: `Fallback: ${AI_FALLBACK_MODEL}` },
] as const;
