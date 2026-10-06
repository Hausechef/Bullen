import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

export const WORKFLOW_TRIGGERS = [
  { value: 'lead_created',         label: 'Lead Created',         color: '#3b82f6' },
  { value: 'lead_stage_changed',   label: 'Lead Stage Changed',   color: '#a855f7' },
  { value: 'kyc_status_changed',   label: 'KYC Status Changed',   color: '#06b6d4' },
  { value: 'ticket_created',       label: 'Ticket Created',       color: '#f59e0b' },
  { value: 'task_overdue',         label: 'Task Overdue',         color: '#ef4444' },
  { value: 'deposit_received',     label: 'Deposit Received',     color: '#10b981' },
] as const;

const WORKFLOWS_SELECT = 'id, name, description, trigger, conditions, actions, status, priority, created_at, updated_at';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select(WORKFLOWS_SELECT)
        .order('priority', { ascending: false });
      if (error) throw new Error(error.message);
      setWorkflows(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    const status = isActive ? 'active' : 'disabled';
    setWorkflows((prev) => prev.map((w) => w.id === id ? { ...w, status } : w));
    const { error } = await supabase.from('workflows').update({ status }).eq('id', id);
    if (error) { fetchWorkflows(); throw new Error(error.message); }
  }, [fetchWorkflows]);

  const createWorkflow = useCallback(async (payload: {
    name: string;
    description?: string;
    trigger: string;
    conditions?: any;
    actions?: any[];
    priority?: number;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('workflows').insert({
      name: payload.name,
      description: payload.description || null,
      trigger: payload.trigger,
      conditions: payload.conditions || {},
      actions: payload.actions || [],
      status: 'active',
      priority: payload.priority || 50,
      created_by: user?.id || null,
    }).select(WORKFLOWS_SELECT).single();
    if (error) throw new Error(error.message);
    setWorkflows((prev) => [data, ...prev]);
    return data;
  }, []);

  const deleteWorkflow = useCallback(async (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    const { error } = await supabase.from('workflows').delete().eq('id', id);
    if (error) { fetchWorkflows(); throw new Error(error.message); }
  }, [fetchWorkflows]);

  const runWorkflow = useCallback(async (workflow: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('workflow_executions').insert({
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      trigger: workflow.trigger,
      triggered_by: user?.id || null,
      status: 'succeeded',
      result: 'Manual trigger from CRM UI',
    });
    if (error) throw new Error(error.message);
  }, []);

  return { workflows, loading, error, refetch: fetchWorkflows, toggleActive, createWorkflow, deleteWorkflow, runWorkflow };
}

// ---------------------------------------------------------------------------
// Executions hook (separate for the log panel)
// ---------------------------------------------------------------------------
export function useWorkflowExecutions(limit = 50) {
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('id, workflow_id, workflow_name, trigger, status, result, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      setExecutions(data || []);
    } catch {
      setExecutions([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchExecutions(); }, [fetchExecutions]);

  return { executions, loading, refetch: fetchExecutions };
}
