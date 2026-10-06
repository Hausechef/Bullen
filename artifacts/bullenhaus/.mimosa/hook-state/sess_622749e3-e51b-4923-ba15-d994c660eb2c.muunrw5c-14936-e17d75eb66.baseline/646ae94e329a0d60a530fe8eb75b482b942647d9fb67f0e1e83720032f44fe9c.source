import { getSupabaseBrowserClient } from './browserClient';

export const SUPABASE_PENDING_MESSAGE = 'Data temporarily unavailable: schema migration is still pending.';

export function toUserMessage(error: unknown, fallback = SUPABASE_PENDING_MESSAGE): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === '42P01') return 'Table does not exist yet. Module is waiting for MVP schema to be applied.';
  if (code === '42501') return 'Insufficient permissions to read data (RLS).';
  return fallback;
}

export async function fetchTable<T>(table: string, query: (q: any) => any): Promise<{ data: T[]; error: string | null }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { data: [], error: 'Supabase is not configured in this environment.' };

  const { data, error } = await query(client.from(table));
  if (error) return { data: [], error: toUserMessage(error) };
  return { data: (data as T[]) ?? [], error: null };
}
