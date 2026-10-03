// ============================================================================
// CRM auth — Supabase-native implementation
// ============================================================================

import { supabase } from '../../../lib/supabase/browserClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

// ── localStorage keys ─────────────────────────────────────────────────────────

const KEYS = {
  role:         'aura_role',
  token:        'accessToken',
  refreshToken: 'aura_refresh',
  user:         'aura_user',
} as const;

export const authStorage = {
  getRole:         (): string | null => localStorage.getItem(KEYS.role),
  setRole:         (r: string)       => localStorage.setItem(KEYS.role, r),

  getToken:        (): string | null => localStorage.getItem(KEYS.token),
  setToken:        (t: string)       => localStorage.setItem(KEYS.token, t),

  getRefreshToken: (): string | null => localStorage.getItem(KEYS.refreshToken),
  setRefreshToken: (t: string)       => localStorage.setItem(KEYS.refreshToken, t),

  getUser: (): AuthUser | null => {
    try { return JSON.parse(localStorage.getItem(KEYS.user) || 'null'); }
    catch { return null; }
  },
  setUser: (u: AuthUser) => localStorage.setItem(KEYS.user, JSON.stringify(u)),

  clear: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
};

// ── Role mapping ──────────────────────────────────────────────────────────────

const CRM_ROLES = ['admin', 'director', 'manager', 'agent'] as const;

function mapRole(raw: string | undefined): string {
  const r = (raw || '').toLowerCase();
  if ((CRM_ROLES as readonly string[]).includes(r)) return r;
  throw new Error('Нет доступа: этот аккаунт не является CRM-оператором');
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user || !data.session) throw new Error('Login failed — no session returned');

  // 1. Try public.users table first (authoritative source)
  let role = '';
  try {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();
    if (profile?.role) role = mapRole(profile.role as string);
  } catch (err: any) {
    // Re-throw access-denied errors; ignore DB connectivity issues
    if (err?.message?.includes('Access denied')) throw err;
  }

  // 2. Fallback: user_metadata.role (set during user creation)
  if (!role) {
    role = mapRole(data.user.user_metadata?.role as string | undefined);
  }

  const nameParts = (data.user.user_metadata?.full_name as string || '').split(' ');
  const user: AuthUser = {
    id:        data.user.id,
    email:     data.user.email || email,
    firstName: nameParts[0] || '',
    lastName:  nameParts.slice(1).join(' ') || '',
    roles:     [role],
  };

  authStorage.setToken(data.session.access_token);
  authStorage.setRefreshToken(data.session.refresh_token || '');
  authStorage.setUser(user);
  authStorage.setRole(role);

  return user;
}

// ── Refresh ───────────────────────────────────────────────────────────────────

export async function refreshAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) return null;
  const token = data.session.access_token;
  authStorage.setToken(token);
  return token;
}

// ── Authenticated fetch ───────────────────────────────────────────────────────

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || authStorage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(url, { ...options, headers: { ...headers, Authorization: `Bearer ${newToken}` } });
    }
  }

  return res;
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function apiLogout(): Promise<void> {
  authStorage.clear();
  await supabase.auth.signOut().catch(() => {});
}
