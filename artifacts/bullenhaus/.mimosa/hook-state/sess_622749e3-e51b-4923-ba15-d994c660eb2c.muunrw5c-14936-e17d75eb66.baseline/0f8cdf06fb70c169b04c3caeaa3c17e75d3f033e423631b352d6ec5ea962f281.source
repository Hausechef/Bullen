import { useState, useEffect, useCallback } from 'react';
import { getLeadCounts, getLeadsPage, getLeadsRange, getUsersLeadPage, searchLeads, updateLeadStatus, LEAD_PAGE_SIZE } from '../../trading/services/leadsService';

// Matches the live `leads.stage` CHECK constraint (7-stage pipeline).
const LEAD_STAGE_DEFS = [
  ['New', 'NEW'],
  ['No Answer', 'NO_ANSWER'],
  ['In Progress', 'IN_PROGRESS'],
  ['Awaiting Deposit', 'AWAITING_DEPOSIT'],
  ['Deposited', 'DEPOSITED'],
  ['Closed', 'CLOSED'],
  ['Lost', 'LOST'],
] as const;

const STAGE_LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  LEAD_STAGE_DEFS.map(([label, stage]) => [stage, label])
);

// Fallback vocabulary, used only when the `leads` table itself is empty and we
// derive a pseudo-pipeline from the `users` table's kyc_status instead.
const USER_STAGE_DEFS = [
  ['New Inquiries', 'NEW_INQUIRY'],
  ['Pending KYC', 'PENDING_KYC'],
  ['Approved', 'APPROVED'],
  ['Rejected', 'REJECTED'],
] as const;

function groupRows(rows: any[], defs: readonly (readonly [string, string])[]) {
  return Object.fromEntries(defs.map(([label, stage]) => [label, rows.filter((l: any) => l.stage === stage)]));
}

function countsFromGroups(grouped: Record<string, any[]>) {
  return Object.fromEntries(Object.entries(grouped).map(([label, rows]) => [label, rows.length]));
}

export function useLeads(page = 1, limit = LEAD_PAGE_SIZE, search = '') {
  const [data, setData]       = useState<any[]>([]);
  const [meta, setMeta]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [stagePages, setStagePages] = useState<Record<string, number>>({});

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (search.trim().length >= 2) {
        const rows = await searchLeads(search);
        const derivedMode = rows.some((row: any) => row.pipelineSource === 'users');
        const grouped = groupRows(rows, derivedMode ? USER_STAGE_DEFS : LEAD_STAGE_DEFS);
        setData(rows);
        setStagePages({});
        setMeta({
          page,
          limit: Math.min(limit, 50),
          total: rows.length,
          grouped,
          stageCounts: countsFromGroups(grouped),
          searchMode: true,
          derivedMode,
          stageWritable: !derivedMode,
          hasMore: false,
        });
        return;
      }

      const [pageResults, countResults] = await Promise.all([
        Promise.allSettled(LEAD_STAGE_DEFS.map(([, stage]) => getLeadsPage({ stage, page: 0, pageSize: LEAD_PAGE_SIZE }))),
        Promise.allSettled(LEAD_STAGE_DEFS.map(([, stage]) => getLeadCounts({ stage }))),
      ]);

      const pages = pageResults.map((result) => result.status === 'fulfilled' ? result.value : null);
      const allLeadQueriesFailed = pages.every(pageResult => !pageResult);
      const totalRealLeads = countResults.reduce((sum, result) => sum + (result.status === 'fulfilled' ? result.value : 0), 0);

      if (allLeadQueriesFailed || totalRealLeads === 0) {
        const fallback = await getUsersLeadPage({ page: 0, pageSize: LEAD_PAGE_SIZE });
        const grouped = groupRows(fallback.rows, USER_STAGE_DEFS);
        setData(fallback.rows);
        setStagePages({ users: 0 });
        setMeta({
          page: 1,
          limit: LEAD_PAGE_SIZE,
          total: fallback.count,
          grouped,
          stageCounts: countsFromGroups(grouped),
          searchMode: false,
          derivedMode: true,
          stageWritable: false,
          hasMore: fallback.hasMore,
        });
        return;
      }

      const grouped = Object.fromEntries(LEAD_STAGE_DEFS.map(([label], i) => [label, pages[i]?.rows ?? []]));
      const stageCounts = Object.fromEntries(LEAD_STAGE_DEFS.map(([label], i) => [
        label,
        countResults[i].status === 'fulfilled' ? countResults[i].value : (grouped[label]?.length ?? 0),
      ]));
      const rows = Object.values(grouped).flat();

      setData(rows);
      setStagePages(Object.fromEntries(LEAD_STAGE_DEFS.map(([label]) => [label, 0])));
      setMeta({
        page: 1,
        limit: LEAD_PAGE_SIZE,
        total: Object.values(stageCounts).reduce((s: number, n: any) => s + Number(n || 0), 0),
        grouped,
        stageCounts,
        searchMode: false,
        derivedMode: false,
        stageWritable: true,
        hasMore: false,
      });
    } catch (err: any) {
      console.error('[useLeads] Failed to load leads', err);
      setError('Unable to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  const loadMoreStage = useCallback(async (stageLabel: string) => {
    if (!meta || meta.searchMode) return;
    if (meta.derivedMode) {
      const nextPage = (stagePages.users ?? 0) + 1;
      const res = await getUsersLeadPage({ page: nextPage, pageSize: LEAD_PAGE_SIZE });
      const nextGrouped = groupRows(res.rows, USER_STAGE_DEFS);
      setMeta((prev: any) => {
        const grouped = { ...(prev?.grouped ?? {}) };
        Object.entries(nextGrouped).forEach(([label, rows]) => {
          grouped[label] = [...(grouped[label] ?? []), ...(rows as any[])];
        });
        return {
          ...prev,
          grouped,
          stageCounts: countsFromGroups(grouped),
          hasMore: res.hasMore,
        };
      });
      setData((prev) => [...prev, ...res.rows]);
      setStagePages(prev => ({ ...prev, users: nextPage }));
      return;
    }

    const stageMap: Record<string, string> = Object.fromEntries(LEAD_STAGE_DEFS.map(([label, stage]) => [label, stage]));
    const stage = stageMap[stageLabel];
    if (!stage) return;
    const currentlyLoaded = (meta.grouped?.[stageLabel] ?? []).length;
    const res = await getLeadsRange({ stage, from: currentlyLoaded, count: LEAD_PAGE_SIZE });
    setMeta((prev: any) => {
      const grouped = { ...(prev?.grouped ?? {}) };
      grouped[stageLabel] = [...(grouped[stageLabel] ?? []), ...res.rows];
      return { ...prev, grouped };
    });
    setData((prev) => [...prev, ...res.rows]);
  }, [meta, stagePages]);

  // Called when an agent processes a lead (changes its stage). Moves the lead
  // between the in-memory stage groups and, if that leaves its old group
  // under LEAD_PAGE_SIZE while more rows exist in the database, immediately
  // fetches one more row from the database to backfill it -- so a stage
  // column visually always holds LEAD_PAGE_SIZE leads whenever the database
  // has that many left to show.
  const moveLeadStage = useCallback(async (leadId: string, fromStage: string, toStage: LeadStage) => {
    if (!meta || meta.searchMode || meta.derivedMode) {
      await updateLeadStatus(leadId, toStage);
      await fetchLeads();
      return;
    }

    const fromLabel = STAGE_LABEL_BY_VALUE[fromStage];
    const toLabel = STAGE_LABEL_BY_VALUE[toStage];
    if (!fromLabel || !toLabel || fromLabel === toLabel) return;

    await updateLeadStatus(leadId, toStage);

    const fromRows = meta.grouped[fromLabel] ?? [];
    const movedLead = fromRows.find((l: any) => l.id === leadId) ?? { id: leadId };
    const remaining = fromRows.filter((l: any) => l.id !== leadId);
    const toRows = meta.grouped[toLabel] ?? [];

    const stageCountsAfter = {
      ...meta.stageCounts,
      [fromLabel]: Math.max(0, (meta.stageCounts[fromLabel] ?? fromRows.length) - 1),
      [toLabel]: (meta.stageCounts[toLabel] ?? toRows.length) + 1,
    };

    let fromRowsAfter = remaining;
    if (remaining.length < LEAD_PAGE_SIZE && stageCountsAfter[fromLabel] > remaining.length) {
      try {
        const res = await getLeadsRange({ stage: fromStage, from: remaining.length, count: 1 });
        if (res.rows.length) fromRowsAfter = [...remaining, ...res.rows];
      } catch (e) {
        console.error('[useLeads] Auto-replenish failed', e);
      }
    }

    const groupedAfter = {
      ...meta.grouped,
      [fromLabel]: fromRowsAfter,
      [toLabel]: [{ ...movedLead, stage: toStage }, ...toRows],
    };

    setData(prev => {
      const withoutMoved = prev.filter(l => l.id !== leadId);
      return [...withoutMoved, { ...movedLead, stage: toStage }];
    });
    setMeta((prev: any) => prev ? { ...prev, grouped: groupedAfter, stageCounts: stageCountsAfter } : prev);
  }, [meta, fetchLeads]);

  useEffect(() => {
    fetchLeads().catch(() => {});
  }, [fetchLeads]);

  return { leads: data, meta, loading, error, refetch: fetchLeads, loadMoreStage, moveLeadStage };
}

export const LEAD_STAGES = LEAD_STAGE_DEFS.map(([label, value]) => ({ value, label })) as
  { value: typeof LEAD_STAGE_DEFS[number][1]; label: string }[];

export type LeadStage = typeof LEAD_STAGE_DEFS[number][1];

export async function updateLeadStage(leadId: string, stage: LeadStage): Promise<void> {
  await updateLeadStatus(leadId, stage);
}
