import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

export const MESSAGE_CHANNELS = [
  { value: 'email',    label: 'Email',    color: '#3b82f6', icon: '✉' },
  { value: 'sms',      label: 'SMS',      color: '#10b981', icon: '💬' },
  { value: 'whatsapp', label: 'WhatsApp', color: '#25D366', icon: '🟢' },
  { value: 'telegram', label: 'Telegram', color: '#0088cc', icon: '✈' },
] as const;

export const TEMPLATE_CATEGORIES = [
  { value: 'general',    label: 'General' },
  { value: 'welcome',    label: 'Welcome' },
  { value: 'follow_up',  label: 'Follow-up' },
  { value: 'deposit',    label: 'Deposit' },
  { value: 'kyc',        label: 'KYC' },
  { value: 'retention',  label: 'Retention' },
  { value: 'win_back',   label: 'Win-back' },
] as const;

// ---------------------------------------------------------------------------
// Templates hook
// ---------------------------------------------------------------------------
export function useTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('category', { ascending: true });
      if (error) throw new Error(error.message);
      setTemplates(data || []);
    } catch (e: any) {
      console.error('templates:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const createTemplate = useCallback(async (payload: { name: string; channel: string; category: string; body: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('message_templates').insert({
      ...payload, created_by: user?.id || null,
    }).select().single();
    if (error) throw new Error(error.message);
    setTemplates((prev) => [...prev, data]);
    return data;
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from('message_templates').delete().eq('id', id);
    if (error) { fetchTemplates(); throw new Error(error.message); }
  }, [fetchTemplates]);

  return { templates, loading, refetch: fetchTemplates, createTemplate, deleteTemplate };
}

// ---------------------------------------------------------------------------
// Messages hook
// ---------------------------------------------------------------------------
export function useMessages(clientId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!clientId) { setMessages([]); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, client_id, channel, direction, subject, body, status, template_id, sent_by, created_at, sender:users!messages_sent_by_fkey(full_name, email)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      setMessages((data || []).map((m: any) => ({
        ...m,
        senderName: m.sender?.full_name || m.sender?.email || 'System',
      })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!clientId) return;
    const sub = supabase
      .channel(`messages-${clientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${clientId}` }, () => {
        fetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [clientId, fetchMessages]);

  const sendMessage = useCallback(async (payload: {
    clientId: string;
    channel: string;
    subject?: string;
    body: string;
    templateId?: string | null;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('messages').insert({
      client_id: payload.clientId,
      channel: payload.channel,
      direction: 'outbound',
      subject: payload.subject || null,
      body: payload.body,
      status: 'sent', // mock — no real gateway
      template_id: payload.templateId || null,
      sent_by: user?.id || null,
    }).select('id, client_id, channel, direction, subject, body, status, template_id, sent_by, created_at, sender:users!messages_sent_by_fkey(full_name, email)').single();
    if (error) throw new Error(error.message);
    const sender = (data as any).sender;
    const mapped = { ...data, senderName: sender?.full_name || sender?.email || 'You' };
    setMessages((prev) => [...prev, mapped]);
    return mapped;
  }, []);

  return { messages, loading, error, refetch: fetchMessages, sendMessage };
}
