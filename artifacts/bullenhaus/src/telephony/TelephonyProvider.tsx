// Global telephony provider — mounts at app shell so SIP registration
// survives navigation between /trade, /crm, /admin.
import { useEffect, useRef, type ReactNode } from 'react';
import { useTelephony } from './callStore';
import { PhoneWidget } from './PhoneWidget';
import { useAuth } from '../app/trading/contexts/AuthContext';

export function TelephonyProvider({ children }: { children: ReactNode }) {
  const { session, user, role } = useAuth();
  const connect = useTelephony((s) => s.connect);
  const disconnect = useTelephony((s) => s.disconnect);
  const setError = useTelephony((s) => s.setError);
  const accessToken = useRef(session?.access_token);
  accessToken.current = session?.access_token;
  const agentId = role === 'agent' ? user?.id : undefined;
  const hasToken = Boolean(session?.access_token);

  // Only agents get telephony. Fetch the password over an authenticated API
  // request; never put a SIP secret in Vite's public build or local storage.
  useEffect(() => {
    if (!agentId || !hasToken) {
      void disconnect();
      return;
    }
    let disposed = false;
    let running = false;
    let denied = false;
    let failures = 0;
    let request: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRetry = () => {
      if (disposed || denied || running || retryTimer) return;
      const delay = Math.min(30_000, 1000 * 2 ** Math.min(failures++, 5));
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void ensureConnected();
      }, delay);
    };

    const ensureConnected = async () => {
      const state = useTelephony.getState().state;
      if (disposed || running || denied || !['OFFLINE', 'FAILED'].includes(state)) return;
      running = true;
      const controller = new AbortController();
      request = controller;
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        // Retire a failed client before creating another one. A token refresh
        // updates the ref above without cancelling a healthy SIP registration.
        await disconnect();
        if (disposed) return;
        const token = accessToken.current;
        if (!token) throw new Error('Не удалось подтвердить сессию для телефонии');
        const response = await fetch('/api/telephony/config', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'same-origin',
          signal: controller.signal,
        });
        const body = await response.json().catch(() => ({}));
        denied = response.status === 403;
        if (!response.ok) throw new Error(body?.error || 'Телефония недоступна');
        if (!body?.wssUrl || !body?.sipDomain || !body?.sipUser || !body?.sipPassword) {
          throw new Error('Телефония не настроена на сервере');
        }
        if (disposed) return;
        if (controller.signal.aborted) throw new Error('Время ожидания настроек телефонии истекло');
        clearTimeout(timeout);
        await connect({
          wssUrl: String(body.wssUrl),
          sipUser: String(body.sipUser),
          sipPassword: String(body.sipPassword),
          sipDomain: String(body.sipDomain),
          agentId,
        });
      } catch (error: any) {
        if (disposed) return;
        setError(controller.signal.aborted ? 'Время ожидания настроек телефонии истекло' : error?.message || 'Телефония недоступна');
      } finally {
        clearTimeout(timeout);
        request = null;
        running = false;
        if (['OFFLINE', 'FAILED'].includes(useTelephony.getState().state)) scheduleRetry();
      }
    };

    const unsubscribe = useTelephony.subscribe((current, previous) => {
      if (current.state === previous.state) return;
      if (current.state === 'READY') failures = 0;
      else if (current.state === 'OFFLINE' || current.state === 'FAILED') scheduleRetry();
    });
    const onOnline = () => {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      void ensureConnected();
    };
    window.addEventListener('online', onOnline);
    void ensureConnected();

    return () => {
      disposed = true;
      request?.abort();
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener('online', onOnline);
      unsubscribe();
      void disconnect();
    };
  }, [agentId, hasToken, connect, disconnect, setError]);

  return (
    <>
      {children}
      {role === 'agent' && <PhoneWidget />}
    </>
  );
}
