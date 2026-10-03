export const BACKEND_MIGRATION_MESSAGE = 'This module is temporarily unavailable: backend migration to Supabase Edge Functions is in progress.';

export const isLegacyApiRequest = (url: string) => url.startsWith('/api/');

export async function safeLegacyApiFetch(url: string, init?: RequestInit): Promise<Response> {
  if (!isLegacyApiRequest(url)) return fetch(url, init);

  try {
    return await fetch(url, init);
  } catch {
    return new Response(
      JSON.stringify({
        error: 'backend_migration_pending',
        message: BACKEND_MIGRATION_MESSAGE,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
