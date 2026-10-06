import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Mail, Lock, AlertCircle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../trading/lib/supabase';
import { UnifiedRole, useAuth } from '../../trading/contexts/AuthContext';

interface LoginPanelProps {
  open: boolean;
  onClose: () => void;
  /** Element to return focus to when the panel closes (e.g. the header trigger). */
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
  labelledById?: string;
}

/**
 * LoginPanel — a controlled dropdown auth panel that opens OVER the page. The
 * semi-transparent backdrop keeps the marketing content and background visible
 * (it never replaces the page). Closes on ESC, backdrop click, or the ✕ button,
 * and restores focus to the trigger. Auth logic mirrors the original LoginPage.
 */
export const LoginPanel: React.FC<LoginPanelProps> = ({ open, onClose, returnFocusRef, labelledById }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { signInMockAdmin, signInMockClient, signInMockAgent } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => emailRef.current?.focus(), 60);
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [open, onClose]);

  const close = () => {
    onClose();
    returnFocusRef?.current?.focus();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Dev/demo shortcut — identical to the original LoginPage behaviour.
      if (import.meta.env.DEV && import.meta.env.VITE_SUPABASE_URL?.includes('dummy')) {
        await new Promise((r) => setTimeout(r, 500));
        if (email.includes('admin')) { signInMockAdmin(email); navigate('/admin/dashboard', { replace: true }); }
        else if (email.includes('agent') || email.includes('manager') || email.includes('director')) { signInMockAgent(email); navigate('/crm/dashboard', { replace: true }); }
        else { signInMockClient(email); navigate('/trade/dashboard', { replace: true }); }
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      let target = '/trade/dashboard';
      const userId = data.user?.id;
      if (userId) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', userId).single();
        let role = (profile?.role || null) as UnifiedRole;
        if (!role) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const metaRole = authUser?.user_metadata?.role as string | undefined;
          role = (metaRole && ['client', 'agent', 'manager', 'director', 'admin', 'trade_admin', 'crm_admin'].includes(metaRole))
            ? (metaRole as UnifiedRole) : 'client';
        }
        if (role === 'admin' || role === 'trade_admin') target = '/admin/dashboard';
        else if (role === 'agent' || role === 'manager' || role === 'director' || role === 'crm_admin') target = '/crm/dashboard';
      }
      navigate(target, { replace: true });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) setError('Account pending activation. Please contact support to verify your account.');
      else if (msg.includes('Invalid login credentials')) setError('Invalid email or password. Please try again.');
      else if (msg.includes('Too many requests')) setError('Too many attempts. Please wait a few minutes and try again.');
      else if (msg.includes('Failed to fetch')) setError('Network error. Please check your connection and try again.');
      else setError('Unable to sign in. Please check your credentials or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — semi-transparent so the page/background stays visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Panel — drops from the top-right on desktop, near-full-width on mobile */}
          <motion.div
            id={labelledById}
            role="dialog"
            aria-modal="true"
            aria-label="Log in to your account"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card fixed left-1/2 top-20 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 p-6 sm:left-auto sm:right-4 sm:translate-x-0 md:right-6"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="label-eyebrow">Terminal access</p>
                <h2 className="mt-1 font-serif text-xl font-semibold text-text">Welcome back</h2>
              </div>
              <button
                onClick={close}
                aria-label="Close login"
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/5 hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft p-3">
                <AlertCircle className="mt-0.5 shrink-0 text-danger" size={15} />
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label htmlFor={`${panelId}-email`} className="label-eyebrow mb-1.5 block">Email or Login</label>
                <div className="relative">
                  <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
                  <input
                    ref={emailRef}
                    id={`${panelId}-email`}
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className="input-dark pl-10"
                    placeholder="user@bullenhaus.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${panelId}-pass`} className="label-eyebrow mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
                  <input
                    id={`${panelId}-pass`}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    className="input-dark pl-10"
                    placeholder="••••••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-text-muted">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-surface-2 accent-[var(--color-gold)]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => { close(); navigate('/forgot-password'); }}
                  className="text-xs font-medium text-gold transition-colors hover:text-gold-light"
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading} className="btn-gold mt-1 w-full">
                {loading
                  ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  : <>Log In <ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="mt-5 border-t border-border pt-4 text-center text-xs text-text-muted">
              New to Bullenhaus?{' '}
              <button
                onClick={() => { close(); navigate('/register'); }}
                className="font-bold text-gold transition-colors hover:text-gold-light"
              >
                Apply for access
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
