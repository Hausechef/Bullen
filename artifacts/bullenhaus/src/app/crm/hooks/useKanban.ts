import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

// 7-stage pipeline (matches migration 24)
export const KANBAN_STAGES = [
  { value: 'NEW',              label: 'New',            color: '#64748b' },
  { value: 'NO_ANSWER',        label: 'No Answer',      color: '#f59e0b' },
  { value: 'IN_PROGRESS',      label: 'In Progress',    color: '#3b82f6' },
  { value: 'AWAITING_DEPOSIT', label: 'Awaiting Deposit', color: '#a855f7' },
  { value: 'DEPOSITED',        label: 'Deposited',      color: '#10b981' },
  { value: 'CLOSED',           label: 'Closed',         color: '#06b6d4' },
  { value: 'LOST',             label: 'Lost',           color: '#ef4444' },
] as const;

export type KanbanStage = typeof KANBAN_STAGES[number]['value'];

// Columns show this many leads at a time; a lead leaving a column (processed /
// moved to another stage) triggers an automatic top-up fetch for that column
// so it keeps showing this many whenever the database still has that many left.
export const KANBAN_PAGE_SIZE = 30;

const LEADS_SELECT = 'id, first_name, last_name, email, phone, country, stage, capacity, acquisition_source, notes, created_at, assigned_agent_id';

function mapLead(row: any) {
  return {
    ...row,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    country: row.country ?? row.acquisition_source?.country ?? null,
    acquisitionSource: row.acquisition_source ?? {},
  };
}

export interface KanbanFilters {
  agentId?: string | null;
  source?: string | null;
  search?: string;
  vipOnly?: boolean;
}

function applyFilters(query: any, filters: KanbanFilters) {
  let q = query;
  if (filters.search) {
    q = q.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }
  if (filters.agentId) q = q.eq('assigned_agent_id', filters.agentId);
  if (filters.source) q = q.eq('acquisition_source->>channel', filters.source);
  return q;
}

async function fetchStagePage(stage: KanbanStage, filters: KanbanFilters, from: number, to: number) {
  let q = supabase
    .from('leads')
    .select(LEADS_SELECT, { count: 'exact' })
    .eq('stage', stage)
    .order('created_at', { ascending: false })
    .range(from, to);
  q = applyFilters(q, filters);
  const { data, count, error } = await q;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []).map(mapLead), count: count ?? 0 };
}

export function useKanban(filters: KanbanFilters = {}) {
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        KANBAN_STAGES.map((s) => fetchStagePage(s.value, filters, 0, KANBAN_PAGE_SIZE - 1))
      );
      const nextGrouped: Record<string, any[]> = {};
      const nextCounts: Record<string, number> = {};
      KANBAN_STAGES.forEach((s, i) => {
        nextGrouped[s.value] = results[i].rows;
        nextCounts[s.value] = results[i].count;
      });
      setGrouped(nextGrouped);
      setCounts(nextCounts);
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.agentId, filters.source]);

  useEffect(() => {
    fetchLeads().catch(() => {});
  }, [fetchLeads]);

  // Move a lead to a new stage (DnD). Logs to lead_stage_history, then tops
  // the vacated column back up to KANBAN_PAGE_SIZE from the database if more
  // leads are available for that stage.
  const moveLead = useCallback(async (leadId: string, fromStage: string, toStage: KanbanStage) => {
    if (fromStage === toStage) return;
    setMoving(leadId);

    const fromRows = grouped[fromStage] ?? [];
    const movedLead = fromRows.find((l) => l.id === leadId);
    const remaining = fromRows.filter((l) => l.id !== leadId);
    const toRows = grouped[toStage] ?? [];

    // Optimistic update
    setGrouped((prev) => ({
      ...prev,
      [fromStage]: remaining,
      [toStage]: movedLead ? [{ ...movedLead, stage: toStage }, ...toRows] : toRows,
    }));

    try {
      const { error: updErr } = await supabase
        .from('leads')
        .update({ stage: toStage })
        .eq('id', leadId);
      if (updErr) throw new Error(updErr.message);

      // Log to history (best-effort, non-blocking)
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('lead_stage_history').insert({
        lead_id: leadId,
        from_stage: fromStage,
        to_stage: toStage,
        changed_by: user?.id || null,
      });

      setCounts((prev) => ({
        ...prev,
        [fromStage]: Math.max(0, (prev[fromStage] ?? fromRows.length) - 1),
        [toStage]: (prev[toStage] ?? toRows.length) + 1,
      }));

      if (remaining.length < KANBAN_PAGE_SIZE) {
        const totalRemaining = counts[fromStage] ?? fromRows.length;
        if (totalRemaining - 1 > remaining.length) {
          const topUp = await fetchStagePage(fromStage as KanbanStage, filters, remaining.length, remaining.length);
          if (topUp.rows.length) {
            setGrouped((prev) => ({ ...prev, [fromStage]: [...(prev[fromStage] ?? remaining), ...topUp.rows] }));
          }
        }
      }
    } catch (err: any) {
      // Revert on error
      setGrouped((prev) => ({
        ...prev,
        [fromStage]: fromRows,
        [toStage]: toRows,
      }));
      setError(err.message);
      throw err;
    } finally {
      setMoving(null);
    }
  }, [grouped, counts, filters]);

  const loadMoreStage = useCallback(async (stage: KanbanStage) => {
    const currentRows = grouped[stage] ?? [];
    const res = await fetchStagePage(stage, filters, currentRows.length, currentRows.length + KANBAN_PAGE_SIZE - 1);
    setGrouped((prev) => ({ ...prev, [stage]: [...(prev[stage] ?? currentRows), ...res.rows] }));
  }, [grouped, filters]);

  return { leads: Object.values(grouped).flat(), grouped, counts, loading, error, moving, refetch: fetchLeads, moveLead, loadMoreStage };
}
