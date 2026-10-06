/**
 * Returns a same-origin path suitable for a post-login redirect.
 *
 * Login targets are intentionally paths, never full URLs: accepting arbitrary
 * URLs here would turn the authentication flow into an open redirect.
 */
export function getSafeNextPath(search: string): string | null {
  const next = new URLSearchParams(search).get('next');
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return null;
  }

  const parsed = new URL(next, window.location.origin);
  if (parsed.origin !== window.location.origin) return null;

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
