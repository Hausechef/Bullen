// Shared E.164 normalization for international routes supported by the carrier.
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { withCallingCode } from '../lib/phoneNumbers';

export type NormalizeResult =
  | { ok: true; e164: string }
  | { ok: false; reason: 'EMPTY' | 'INVALID' };

// Unprefixed local numbers still use Germany; explicit international codes are preserved.
export function normalizeOutboundNumber(raw: string): NormalizeResult {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { ok: false, reason: 'EMPTY' };

  const compact = trimmed.replace(/[\s().-]/g, '');
  // Keep the previously supported legacy 049... international spelling.
  const input = compact.startsWith('049') ? '+' + compact.slice(1) : withCallingCode(trimmed, '+49');
  const parsed = parsePhoneNumberFromString(input, 'DE');
  if (!parsed || !parsed.isValid()) return { ok: false, reason: 'INVALID' };

  return { ok: true, e164: parsed.number };
}

// Existing call buttons and lead actions share this compatibility entry point.
export const normalizeGermanNumber = normalizeOutboundNumber;

export function formatPhoneNumber(raw: string): string {
  const normalized = normalizeOutboundNumber(raw);
  if (!normalized.ok) return raw;
  return parsePhoneNumberFromString(normalized.e164)?.formatInternational() ?? normalized.e164;
}

// Preserve the international prefix for the matching country-specific dialplan.
export function toDialDigits(e164: string): string {
  return e164;
}
