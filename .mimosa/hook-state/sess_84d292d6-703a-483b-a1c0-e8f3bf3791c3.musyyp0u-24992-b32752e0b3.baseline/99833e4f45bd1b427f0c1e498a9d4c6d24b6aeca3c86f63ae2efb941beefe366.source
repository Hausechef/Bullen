/**
 * aiClient.ts — Frontend wrapper for the AI edge functions.
 *
 * Routes to Supabase Edge Functions:
 *   - ai-status : returns whether the OpenRouter key is configured
 *   - ai-chat   : proxies a chat completion (requires a logged-in user)
 *
 * The OpenRouter API key never touches the browser — it lives only in the
 * edge function environment.
 */

import { supabase } from '../supabase/browserClient';
import type { AiProfile } from './aiConfig';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string || '';
const ANON_KEY =
  ((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
  '';

const AI_BASE = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '';

export interface AiChatBody {
  profile?: AiProfile;
  model?: string;
  messages: { role: string; content: string }[];
  max_tokens?: number;
  temperature?: number;
}

/** Returns { configured: boolean } — false if the backend is unreachable. */
export interface AiStatus {
  configured: boolean;
  enabled?: boolean;
  provider?: string;
  primaryModel?: string;
  fallbackModel?: string;
  routing?: {
    allowFallbacks: boolean;
    sort: string;
    dataCollection: string;
    zdr: boolean;
  };
  profiles?: Record<string, unknown>;
}

export async function aiStatus(): Promise<AiStatus> {
  if (!AI_BASE) return { configured: false };
  try {
    const res = await fetch(`${AI_BASE}/ai-status`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    });
    if (!res.ok) return { configured: false };
    return await res.json();
  } catch {
    return { configured: false };
  }
}

/** Sends a chat completion request. Returns the raw Response so callers keep their own error handling. */
export async function aiChat(body: AiChatBody): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || ANON_KEY;
  return fetch(`${AI_BASE}/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}
