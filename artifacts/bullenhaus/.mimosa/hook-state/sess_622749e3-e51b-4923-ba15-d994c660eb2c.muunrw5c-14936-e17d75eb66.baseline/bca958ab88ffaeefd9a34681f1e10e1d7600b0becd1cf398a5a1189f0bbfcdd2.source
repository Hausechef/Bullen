import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

export const SCRIPT_CATEGORIES = [
  { value: 'cold_call',          label: 'Cold Call',          color: '#3b82f6' },
  { value: 'follow_up',          label: 'Follow-up',          color: '#10b981' },
  { value: 'objection_handling', label: 'Objection Handling', color: '#f59e0b' },
  { value: 'closing',            label: 'Closing',            color: '#a855f7' },
  { value: 'kyc_help',           label: 'KYC Help',           color: '#06b6d4' },
  { value: 'general',            label: 'General',            color: '#64748b' },
] as const;

const SCRIPTS_SELECT = 'id, title, category, stage, body, objections, tags, created_at, updated_at';

export function useScripts(filter: { category?: string; search?: string } = {}) {
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase.from('sales_scripts').select(SCRIPTS_SELECT).order('category', { ascending: true });
      if (filter.category) q = q.eq('category', filter.category);
      if (filter.search) {
        q = q.or(`title.ilike.%${filter.search}%,body.ilike.%${filter.search}%`);
      }
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      setScripts(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter.category, filter.search]);

  useEffect(() => { fetchScripts(); }, [fetchScripts]);

  const createScript = useCallback(async (payload: {
    title: string;
    category: string;
    stage?: string | null;
    body: string;
    objections?: any[];
    tags?: string[];
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('sales_scripts').insert({
      title: payload.title,
      category: payload.category,
      stage: payload.stage || null,
      body: payload.body,
      objections: payload.objections || [],
      tags: payload.tags || [],
      created_by: user?.id || null,
    }).select(SCRIPTS_SELECT).single();
    if (error) throw new Error(error.message);
    setScripts((prev) => [...prev, data]);
    return data;
  }, []);

  const updateScript = useCallback(async (id: string, patch: any) => {
    setScripts((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
    const { error } = await supabase.from('sales_scripts').update(patch).eq('id', id);
    if (error) { fetchScripts(); throw new Error(error.message); }
  }, [fetchScripts]);

  const deleteScript = useCallback(async (id: string) => {
    setScripts((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from('sales_scripts').delete().eq('id', id);
    if (error) { fetchScripts(); throw new Error(error.message); }
  }, [fetchScripts]);

  return { scripts, loading, error, refetch: fetchScripts, createScript, updateScript, deleteScript };
}
