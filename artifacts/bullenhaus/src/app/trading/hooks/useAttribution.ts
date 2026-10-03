const STORAGE_KEY = 'attribution_data';
const COOKIE_NAME = 'attribution';
const TTL_DAYS = 30;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

export interface AttributionPayload {
  ref?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

function readURLParams(): AttributionPayload | null {
  const params = new URLSearchParams(window.location.search);
  const ref          = params.get('ref')          || undefined;
  const utm_source   = params.get('utm_source')   || undefined;
  const utm_medium   = params.get('utm_medium')   || undefined;
  const utm_campaign = params.get('utm_campaign') || undefined;
  const utm_content  = params.get('utm_content')  || undefined;
  const utm_term     = params.get('utm_term')     || undefined;

  const hasAny = ref || utm_source || utm_medium || utm_campaign || utm_content || utm_term;
  if (!hasAny) return null;

  return { ref, utm_source, utm_medium, utm_campaign, utm_content, utm_term };
}

function writeCookie(payload: AttributionPayload): void {
  const expires = new Date(Date.now() + TTL_MS).toUTCString();
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(payload))}; expires=${expires}; path=/; SameSite=Lax`;
}

function readCookie(): AttributionPayload | null {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(COOKIE_NAME + '='));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
  } catch {
    return null;
  }
}

function writeLocalStorage(payload: AttributionPayload): void {
  const entry = { payload, expiresAt: Date.now() + TTL_MS };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
  }
}

function readLocalStorage(): AttributionPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { payload, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return payload as AttributionPayload;
  } catch {
    return null;
  }
}

function persist(payload: AttributionPayload): void {
  writeLocalStorage(payload);
  writeCookie(payload);
}

export function getAttribution(): AttributionPayload | null {
  const fromURL = readURLParams();
  if (fromURL) {
    persist(fromURL);
    return fromURL;
  }
  return readLocalStorage() || readCookie();
}

export function clearAttribution(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
