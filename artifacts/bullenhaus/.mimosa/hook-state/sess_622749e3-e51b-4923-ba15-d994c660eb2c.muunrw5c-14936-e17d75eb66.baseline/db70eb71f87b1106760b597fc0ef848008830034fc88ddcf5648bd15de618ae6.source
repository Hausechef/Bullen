import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

export const TICKET_STATUSES = [
  { value: 'new',       label: 'New',       color: '#3b82f6' },
  { value: 'open',      label: 'Open',      color: '#f59e0b' },
  { value: 'pending',   label: 'Pending',   color: '#a855f7' },
  { value: 'resolved',  label: 'Resolved',  color: '#10b981' },
  { value: 'closed',    label: 'Closed',    color: '#64748b' },
] as const;

export const TICKET_PRIORITIES = [
  { value: 'low',      label: 'Low',      color: '#64748b' },
  { value: 'medium',   label: 'Medium',   color: '#f59e0b' },
  { value: 'high',     label: 'High',     color: '#fb7185' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
] as const;

const TICKETS_SELECT = `
  id, client_id, subject, message, status, priority, assignee_id,
  sla_due_at, created_at, updated_at, resolved_at,
  client:users!support_tickets_client_id_fkey(id, email, full_name),
  assignee:users!support_tickets_assignee_id_fkey(id, email, full_name)
`;

function mapTicket(row: any) {
  return {
    ...row,
    clientName: row.client?.full_name || row.client?.email || 'Unknown',
    clientEmail: row.client?.email || null,
    assigneeName: row.assignee?.full_name || row.assignee?.email || null,
    clientId: row.client_id,
    assigneeId: row.assignee_id,
  };
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
}

export function useTickets(filters: TicketFilters = {}) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase.from('support_tickets').select(TICKETS_SELECT).order('created_at', { ascending: false });
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.priority) q = q.eq('priority', filters.priority);
      if (filters.assigneeId) q = q.eq('assignee_id', filters.assigneeId);
      if (filters.search) {
        q = q.or(`subject.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
      }

      const { data, error: dbError } = await q;
      if (dbError) throw new Error(dbError.message);
      setTickets((data || []).map(mapTicket));
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.priority, filters.assigneeId, filters.search]);

  useEffect(() => {
    fetchTickets().catch(() => {});
  }, [fetchTickets]);

  const updateTicket = useCallback(async (ticketId: string, patch: { status?: string; priority?: string; assignee_id?: string | null }) => {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, ...patch } : t));
    const finalPatch: any = { ...patch };
    if (patch.status === 'resolved' || patch.status === 'closed') {
      finalPatch.resolved_at = new Date().toISOString();
    }
    const { error: dbError } = await supabase.from('support_tickets').update(finalPatch).eq('id', ticketId);
    if (dbError) {
      fetchTickets();
      throw new Error(dbError.message);
    }
  }, [fetchTickets]);

  const createTicket = useCallback(async (payload: {
    clientId: string;
    subject: string;
    message: string;
    priority?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    // SLA: 24h for critical/high, 72h for medium, 168h for low
    const slaHours = payload.priority === 'critical' ? 4 : payload.priority === 'high' ? 24 : payload.priority === 'medium' ? 72 : 168;
    const slaDueAt = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();
    const { data, error: dbError } = await supabase.from('support_tickets').insert({
      client_id: payload.clientId,
      subject: payload.subject,
      message: payload.message,
      priority: payload.priority || 'medium',
      status: 'new',
      created_by: user?.id || null,
      sla_due_at: slaDueAt,
    }).select(TICKETS_SELECT).single();
    if (dbError) throw new Error(dbError.message);
    setTickets((prev) => [mapTicket(data), ...prev]);
    return mapTicket(data);
  }, []);

  // Fetch comments for a single ticket
  const fetchComments = useCallback(async (ticketId: string) => {
    const { data, error: dbError } = await supabase
      .from('ticket_comments')
      .select('id, author_id, body, created_at, author:users!ticket_comments_author_id_fkey(full_name, email)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (dbError) throw new Error(dbError.message);
    return (data || []).map((c: any) => ({
      ...c,
      authorName: c.author?.full_name || c.author?.email || 'Unknown',
    }));
  }, []);

  const addComment = useCallback(async (ticketId: string, body: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error: dbError } = await supabase.from('ticket_comments').insert({
      ticket_id: ticketId,
      author_id: user?.id || null,
      body,
    }).select('id, author_id, body, created_at, author:users!ticket_comments_author_id_fkey(full_name, email)').single();
    if (dbError) throw new Error(dbError.message);
    const author = (data as any).author;
    return {
      ...data,
      authorName: author?.full_name || author?.email || 'Unknown',
    };
  }, []);

  return { tickets, loading, error, refetch: fetchTickets, updateTicket, createTicket, fetchComments, addComment };
}
