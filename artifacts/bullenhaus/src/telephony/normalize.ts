// Shared E.164 normalization for international routes supported by the carrier.
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export type NormalizeResult =
  | { ok: true; e164: string }
  | { ok: false; reason: 'EMPTY' | 'INVALID' };

// External calls are country-neutral. Accept an explicit +/00 prefix or a
// complete country-code number without punctuation; never silently add +49.
export function normalizeOutboundNumber(raw: string): NormalizeResult {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { ok: false, reason: 'EMPTY' };

  const compact = trimmed.replace(/[\s().-]/g, '');
  let input: string;
  if (compact.startsWith('+')) input = compact;
  else if (compact.startsWith('00')) input = '+' + compact.slice(2);
  else if (/^[1-9]\d{6,14}$/.test(compact)) input = '+' + compact;
  else return { ok: false, reason: 'INVALID' };

  const parsed = parsePhoneNumberFromString(input);
  if (!parsed || !parsed.isValid()) return { ok: false, reason: 'INVALID' };

  return { ok: true, e164: parsed.number };
}

export function formatPhoneNumber(raw: string): string {
  const normalized = normalizeOutboundNumber(raw);
  if (!normalized.ok) return raw;
  return parsePhoneNumberFromString(normalized.e164)?.formatInternational() ?? normalized.e164;
}

// Preserve the international prefix for the matching country-specific dialplan.
export function toDialDigits(e164: string): string {
  return e164;
}
