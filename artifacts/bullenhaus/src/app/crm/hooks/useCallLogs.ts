import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

export interface CallLog {
  id: string;
  agent_id: string;
  client_id: string | null;
  phone_number: string;
  direction: 'outbound' | 'inbound';
  status: 'initiated' | 'ringing' | 'answered' | 'no_answer' | 'busy' | 'failed' | 'completed';
  duration_seconds: number;
  notes: string | null;
  created_at: string;
  agent?: { full_name: string | null; email: string };
  client?: { full_name: string | null; email: string } | null;
}

export async function logCall(params: {
  agentId: string;
  clientId?: string | null;
  phoneNumber: string;
  direction: 'outbound' | 'inbound';
  status: CallLog['status'];
  durationSeconds?: number;
  notes?: string;
}): Promise<CallLog | null> {
  const { data, error } = await supabase
    .from('call_logs')
    .insert({
      agent_id:         params.agentId,
      client_id:        params.clientId ?? null,
      phone_number:     params.phoneNumber,
      direction:        params.direction,
      status:           params.status,
      duration_seconds: params.durationSeconds ?? 0,
      notes:            params.notes ?? null,
    })
    .select()
    .single();

  if (error) { console.error('[callLogs] insert error', error); return null; }
  return data as CallLog;
}

export async function updateCallLog(id: string, patch: Partial<Pick<CallLog, 'status' | 'duration_seconds' | 'notes'>>) {
  await supabase.from('call_logs').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
}

export function useCallLogs(limit = 100) {
  const [logs, setLogs]       = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from('call_logs')
        .select(`
          *,
          agent:users!call_logs_agent_id_fkey(full_name, email),
          client:users!call_logs_client_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (dbErr) throw new Error(dbErr.message);
      setLogs((data ?? []) as CallLog[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load call logs');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { logs, loading, error, refetch: fetch };
}
