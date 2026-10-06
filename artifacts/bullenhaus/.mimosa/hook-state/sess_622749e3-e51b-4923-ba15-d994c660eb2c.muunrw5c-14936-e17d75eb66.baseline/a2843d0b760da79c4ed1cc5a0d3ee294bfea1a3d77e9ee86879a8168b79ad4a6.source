/**
 * browserClient.ts — Singleton Supabase browser client
 *
 * Auth is fully managed by @supabase/supabase-js:
 *   - Session is persisted to localStorage automatically
 *   - Access token is auto-refreshed before expiry
 *   - detectSessionInUrl handles the password-reset redirect flow
 *
 * Use this client for auth, database queries, and storage from the browser.
 * NEVER import SUPABASE_SERVICE_ROLE_KEY here.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY =
  (((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
   ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY)) as string | undefined;

let _client: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase browser client.
 * Throws if env vars are not configured — fail fast at startup rather than
 * silently pointing at localhost and surfacing confusing auth failures later.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error(
        '[Supabase] Missing required environment variables. Set VITE_SUPABASE_URL and ' +
        'VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) in your deployment environment.'
      );
    }
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
}

/** Named export for convenience: `import { supabase } from '@/lib/supabase/browserClient'` */
export const supabase = getSupabaseBrowserClient();
