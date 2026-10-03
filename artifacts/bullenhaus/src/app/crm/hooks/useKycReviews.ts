import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

export const KYC_DECISIONS = [
  { value: 'approved',        label: 'Approve',          color: '#10b981' },
  { value: 'rejected',        label: 'Reject',           color: '#ef4444' },
  { value: 'needs_more_info', label: 'Needs More Info',  color: '#f59e0b' },
  { value: 'escalated',       label: 'Escalate',         color: '#a855f7' },
] as const;

export const KYC_STATUSES = [
  { value: 'UNVERIFIED', label: 'Unverified', color: '#64748b' },
  { value: 'PENDING',    label: 'Pending',    color: '#f59e0b' },
  { value: 'VERIFIED',   label: 'Verified',   color: '#10b981' },
  { value: 'REJECTED',   label: 'Rejected',   color: '#ef4444' },
] as const;

const CLIENTS_SELECT = `
  id, email, full_name, kyc_status, kyc_documents, balance,
  country, created_at, updated_at,
  assigned_agent:users!users_assigned_agent_id_fkey(id, full_name, email)
`;

function mapClient(row: any) {
  const docs = Array.isArray(row.kyc_documents) ? row.kyc_documents : [];
  return {
    ...row,
    docs,
    agentName: row.assigned_agent?.full_name || row.assigned_agent?.email || null,
  };
}

export function useKycReviews(filter: { status?: string; search?: string } = {}) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase.from('users').select(CLIENTS_SELECT).eq('role', 'client');
      if (filter.status) q = q.eq('kyc_status', filter.status);
      if (filter.search) {
        q = q.or(`email.ilike.%${filter.search}%,full_name.ilike.%${filter.search}%`);
      }
      q = q.order('updated_at', { ascending: false }).limit(100);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      setClients((data || []).map(mapClient));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter.status, filter.search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const selectClient = useCallback(async (client: any) => {
    setSelected(client);
    if (!client) { setReviews([]); return; }
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('kyc_reviews')
        .select('id, user_id, reviewer_id, decision, reason, risk_flags, created_at, reviewer:users!kyc_reviews_reviewer_id_fkey(full_name, email)')
        .eq('user_id', client.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      setReviews((data || []).map((r: any) => ({
        ...r,
        reviewerName: r.reviewer?.full_name || r.reviewer?.email || 'Unknown',
      })));
    } catch (e: any) {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  const submitReview = useCallback(async (clientId: string, decision: string, reason: string, flags: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insErr } = await supabase.from('kyc_reviews').insert({
      user_id: clientId,
      reviewer_id: user?.id || null,
      decision,
      reason: reason || null,
      risk_flags: flags,
    });
    if (insErr) throw new Error(insErr.message);

    // Update user.kyc_status based on decision
    const newStatus = decision === 'approved' ? 'VERIFIED'
      : decision === 'rejected' ? 'REJECTED'
      : decision === 'needs_more_info' ? 'PENDING'
      : 'PENDING';
    const { error: updErr } = await supabase.from('users').update({ kyc_status: newStatus }).eq('id', clientId);
    if (updErr) throw new Error(updErr.message);

    // Refresh
    await fetchClients();
    if (selected?.id === clientId) {
      const refreshed = { ...selected, kyc_status: newStatus };
      setSelected(refreshed);
      await selectClient(refreshed);
    }
  }, [fetchClients, selected, selectClient]);

  return {
    clients, loading, error, refetch: fetchClients,
    selected, selectClient, reviews, loadingReviews, submitReview,
  };
}
