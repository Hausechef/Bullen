import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

export const TASK_TYPES = [
  { value: 'call',           label: 'Call' },
  { value: 'email',          label: 'Email' },
  { value: 'deposit_check',  label: 'Deposit Check' },
  { value: 'kyc',            label: 'KYC' },
  { value: 'follow_up',      label: 'Follow-up' },
  { value: 'manual',         label: 'Manual' },
] as const;

export const TASK_PRIORITIES = [
  { value: 'low',    label: 'Low',    color: '#64748b' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high',   label: 'High',   color: '#ef4444' },
] as const;

export const TASK_STATUSES = [
  { value: 'pending',    label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',  label: 'Completed' },
  { value: 'cancelled',  label: 'Cancelled' },
] as const;

const TASKS_SELECT = `
  id, title, type, client_id, lead_id, assignee_id, created_by,
  due_at, priority, status, notes, created_at, updated_at,
  client:users!tasks_client_id_fkey(id, email, full_name),
  assignee:users!tasks_assignee_id_fkey(id, email, full_name)
`;

function mapTask(row: any) {
  return {
    ...row,
    clientName: row.client?.full_name || row.client?.email || null,
    assigneeName: row.assignee?.full_name || row.assignee?.email || null,
    clientId: row.client_id,
    assigneeId: row.assignee_id,
  };
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
  clientId?: string;
  overdue?: boolean;
}

export function useTasks(filters: TaskFilters = {}) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase.from('tasks').select(TASKS_SELECT).order('due_at', { ascending: true, nullsFirst: false });
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.priority) q = q.eq('priority', filters.priority);
      if (filters.assigneeId) q = q.eq('assignee_id', filters.assigneeId);
      if (filters.clientId) q = q.eq('client_id', filters.clientId);

      const { data, error: dbError } = await q;
      if (dbError) throw new Error(dbError.message);

      let rows = (data || []).map(mapTask);
      // Client-side overdue filter (NULL-safe)
      if (filters.overdue) {
        const now = new Date().toISOString();
        rows = rows.filter((t: any) => t.due_at && t.due_at < now && t.status !== 'completed' && t.status !== 'cancelled');
      }
      setTasks(rows);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.priority, filters.assigneeId, filters.clientId, filters.overdue]);

  useEffect(() => {
    fetchTasks().catch(() => {});
  }, [fetchTasks]);

  const createTask = useCallback(async (payload: {
    title: string;
    type?: string;
    clientId?: string | null;
    leadId?: string | null;
    assigneeId?: string | null;
    dueAt?: string | null;
    priority?: string;
    notes?: string | null;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error: dbError } = await supabase.from('tasks').insert({
      title: payload.title,
      type: payload.type || 'manual',
      client_id: payload.clientId || null,
      lead_id: payload.leadId || null,
      assignee_id: payload.assigneeId || null,
      due_at: payload.dueAt || null,
      priority: payload.priority || 'medium',
      status: 'pending',
      notes: payload.notes || null,
      created_by: user?.id || null,
    }).select(TASKS_SELECT).single();
    if (dbError) throw new Error(dbError.message);
    setTasks((prev) => [mapTask(data), ...prev]);
    return mapTask(data);
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    // Optimistic
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t));
    const { error: dbError } = await supabase.from('tasks').update({ status }).eq('id', taskId);
    if (dbError) {
      // Revert by refetching
      fetchTasks();
      throw new Error(dbError.message);
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const { error: dbError } = await supabase.from('tasks').delete().eq('id', taskId);
    if (dbError) {
      fetchTasks();
      throw new Error(dbError.message);
    }
  }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks, createTask, updateTaskStatus, deleteTask };
}
