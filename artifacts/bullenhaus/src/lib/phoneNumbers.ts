// Keep a supplied international number intact when a country selector supplies
// the same calling code. This operation is safe to apply more than once.
export function withCallingCode(raw: string, callingCode: string): string {
  let phone = (raw ?? '').trim().replace(/[\s().-]/g, '');
  const code = callingCode.replace(/\D/g, '');
  if (!phone || !code) return phone;
  if (phone.startsWith('00')) phone = '+' + phone.slice(2);
  // Older registration forms could store "+49+49...". The second explicit
  // plus makes this duplication unambiguous; real national 49... is preserved.
  while (phone.startsWith(`+${code}+${code}`)) phone = phone.slice(code.length + 1);
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('0')) return '+' + code + phone.slice(1);
  if (phone.startsWith(code)) return '+' + phone;
  return '+' + code + phone;
}
