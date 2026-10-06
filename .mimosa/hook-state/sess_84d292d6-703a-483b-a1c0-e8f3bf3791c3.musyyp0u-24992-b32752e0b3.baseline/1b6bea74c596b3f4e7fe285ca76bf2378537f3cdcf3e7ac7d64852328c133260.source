import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

export interface CRMClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  company: string | null;
  totalBalance: number;
  tier: 'Titanium' | 'Platinum' | 'Silver';
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  kyc_status: string;
  updatedAt: string;
  createdAt: string;
}

function mapUser(u: any): CRMClient {
  const firstName = u.first_name?.trim() || (u.full_name || u.email.split('@')[0]).trim().split(/\s+/)[0] || '';
  const lastName  = u.last_name?.trim()  || (u.full_name || '').trim().split(/\s+/).slice(1).join(' ') || '';
  const balance   = Number(u.balance) || 0;

  const tier: CRMClient['tier'] =
    balance >= 100_000 ? 'Titanium' :
    balance >= 10_000  ? 'Platinum' : 'Silver';

  const riskScore: CRMClient['riskScore'] =
    balance === 0 ? 'LOW' : balance < 5_000 ? 'MEDIUM' : 'LOW';

  return {
    id: u.id,
    firstName,
    lastName,
    email:        u.email,
    phone:        (u.phone as string | null) ?? null,
    country:      (u.country as string | null) ?? null,
    company:      null,
    totalBalance: balance,
    tier,
    riskScore,
    kyc_status:   u.kyc_status ?? 'PENDING',
    updatedAt:    u.updated_at ?? u.created_at,
    createdAt:    u.created_at,
  };
}

export type BalanceFlashDirection = 'up' | 'down';

export function useClients(page = 1, limit = 50, search = '') {
  const [data, setData]               = useState<CRMClient[]>([]);
  const [meta, setMeta]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [flashMap, setFlashMap]       = useState<Record<string, BalanceFlashDirection>>({});
  const [reconnecting, setReconnecting] = useState(false);
  const flashTimers                   = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const retryTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef                    = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const destroyed                     = useRef(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('users')
        .select('id, email, full_name, first_name, last_name, phone, country, balance, kyc_status, created_at, updated_at')
        .eq('role', 'client')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      const { data: rows, error: dbError } = await q;
      if (dbError) throw new Error(dbError.message);

      const clients = (rows ?? []).map(mapUser);
      setData(clients);
      setMeta({ page, limit, total: clients.length });
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchClients().catch(() => {});
  }, [fetchClients]);

  useEffect(() => {
    const timers = flashTimers.current;
    destroyed.current = false;

    function handlePayload(payload: any) {
      const updated = payload.new as any;
      if (updated.role !== 'client') return;
      setData(prev => {
        const idx = prev.findIndex(c => c.id === updated.id);
        if (idx === -1) return prev;
        const oldBalance = prev[idx].totalBalance;
        const newBalance = Number(updated.balance) || 0;
        if (newBalance !== oldBalance) {
          const direction: BalanceFlashDirection = newBalance > oldBalance ? 'up' : 'down';
          setFlashMap(m => ({ ...m, [updated.id]: direction }));
          if (timers[updated.id]) clearTimeout(timers[updated.id]);
          timers[updated.id] = setTimeout(() => {
            setFlashMap(m => {
              const next = { ...m };
              delete next[updated.id];
              return next;
            });
          }, 1500);
        }
        const next = [...prev];
        next[idx] = mapUser(updated);
        return next;
      });
    }

    function subscribe() {
      if (destroyed.current) return;

      const ch = supabase
        .channel(`crm-useClients-balance-${Math.random().toString(36).substring(2, 9)}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users' },
          handlePayload
        )
        .subscribe((status) => {
          if (destroyed.current) return;
          if (status === 'SUBSCRIBED') {
            setReconnecting(false);
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            setReconnecting(true);
            if (retryTimer.current) clearTimeout(retryTimer.current);
            retryTimer.current = setTimeout(() => {
              if (destroyed.current) return;
              supabase.removeChannel(ch).catch(() => {});
              subscribe();
            }, 3000);
          }
        });

      channelRef.current = ch;
    }

    subscribe();

    return () => {
      destroyed.current = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current).catch(() => {});
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  return { clients: data, meta, loading, error, refetch: fetchClients, flashMap, reconnecting };
}

export interface ClientTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'APPROVED' | 'REJECTED' | 'PROCESSING';
  amount: number;
  created_at: string;
}

export async function fetchClientTransactions(userId: string): Promise<ClientTransaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, type, status, amount, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any): ClientTransaction => ({
    id:         row.id,
    type:       (row.type   as string).toUpperCase() as ClientTransaction['type'],
    status:     (row.status as string).toUpperCase() as ClientTransaction['status'],
    amount:     Number(row.amount),
    created_at: row.created_at,
  }));
}
