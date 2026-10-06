/**
 * Central env helpers for the API server.
 * Reads server-side secrets from process.env (set via /etc/bullenhaus/api.env).
 * Never expose these to the SPA build.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export function getEnv(name: string, fallback?: string): string | undefined {
  return process.env[name]?.trim() || fallback;
}
