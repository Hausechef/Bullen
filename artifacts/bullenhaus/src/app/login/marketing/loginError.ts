// Only expose safe error codes/statuses, never request payloads or auth tokens.
export function loginFailure(error: unknown): { message: string; diagnostic: string } {
  const value = error as { code?: unknown; status?: unknown; name?: unknown; message?: unknown } | null;
  const code = typeof value?.code === 'string' && /^[a-z0-9_]{1,64}$/.test(value.code) ? value.code : '';
  const status = typeof value?.status === 'number' && value.status >= 400 && value.status <= 599 ? value.status : null;
  const name = typeof value?.name === 'string' ? value.name : '';
  const msg = typeof value?.message === 'string' ? value.message : '';
  const diagnostic = [code, status ? `HTTP ${status}` : ''].filter(Boolean).join(' · ');
  let message = 'Unable to sign in. Please check your credentials or contact support.';
  if (code === 'email_not_confirmed' || msg.includes('Email not confirmed')) {
    message = 'Account pending activation. Please contact support to verify your account.';
  } else if (code === 'invalid_credentials' || msg.includes('Invalid login credentials')) {
    message = 'Invalid email or password. Please try again.';
  } else if (code === 'over_request_rate_limit' || status === 429 || msg.includes('Too many requests')) {
    message = 'Too many attempts. Please wait a few minutes and try again.';
  } else if (code === 'user_banned') {
    message = 'This account is disabled. Please contact support.';
  } else if (code === 'validation_failed' || code === 'email_address_invalid') {
    message = 'Please enter the email address registered for this account.';
  } else if (code === 'unexpected_failure' || (status && status >= 500)) {
    message = 'The sign-in service returned an error. Please try again later or contact support.';
  } else if (name.includes('LockAcquireTimeout') || msg.includes('Navigator LockManager')) {
    message = 'Another sign-in operation is still pending. Close other Bullenhaus tabs and try again.';
  } else if (code === 'request_timeout' || name === 'AuthRetryableFetchError' || msg.includes('Failed to fetch')) {
    message = 'Network error. Please check your connection and try again.';
  }
  return { message, diagnostic };
}
