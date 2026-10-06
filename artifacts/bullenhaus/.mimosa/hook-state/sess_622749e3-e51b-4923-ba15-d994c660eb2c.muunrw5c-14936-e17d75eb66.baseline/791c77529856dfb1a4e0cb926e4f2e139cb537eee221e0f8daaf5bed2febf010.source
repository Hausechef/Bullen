import React, { useState, useRef, useEffect } from "react";
import { Phone, Clock, FileText, PlayCircle, Plus, ChevronRight, MoreHorizontal, Loader2, AlertCircle, ChevronDown, Upload } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useLeads, LEAD_STAGES, type LeadStage } from "../hooks/useLeads";
import { useI18n } from "../lib/i18n";
import { usePhoneDialer } from "../contexts/PhoneDialerContext";
import { useAuth } from "../../trading/contexts/AuthContext";
import { supabase } from "../../../lib/supabase/browserClient";
import { toast } from "sonner";

const VISIBLE_PER_STAGE = 30;

const STAGE_DOT_COLOR: Record<string, string> = {
  Deposited:         'bg-aura-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  'Awaiting Deposit': 'bg-aura-warning shadow-[0_0_8px_rgba(234,179,8,0.5)]',
  New:               'bg-aura-platinum shadow-[0_0_8px_rgba(255,255,255,0.4)]',
  Approved:          'bg-aura-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  'Pending KYC':     'bg-aura-warning shadow-[0_0_8px_rgba(234,179,8,0.5)]',
  'New Inquiries':   'bg-aura-platinum shadow-[0_0_8px_rgba(255,255,255,0.4)]',
};

const STAGE_CARD_BORDER: Record<string, string> = {
  DEPOSITED:         'border-aura-emerald/30 hover:border-aura-emerald/50',
  AWAITING_DEPOSIT:  'border-aura-warning/30 hover:border-aura-warning/50',
  LOST:              'border-aura-ruby/30 hover:border-aura-ruby/50',
  PENDING_KYC:       'border-aura-warning/30 hover:border-aura-warning/50',
};

const STAGE_SELECT_STYLE: Record<string, string> = {
  DEPOSITED:         'bg-aura-emerald/10 border-aura-emerald/30 text-aura-emerald',
  APPROVED:          'bg-aura-emerald/10 border-aura-emerald/30 text-aura-emerald',
  AWAITING_DEPOSIT:  'bg-aura-warning/10 border-aura-warning/30 text-aura-warning',
  REJECTED:          'bg-aura-ruby/10 border-aura-ruby/30 text-aura-ruby',
  LOST:              'bg-aura-ruby/10 border-aura-ruby/30 text-aura-ruby',
  PENDING_KYC:       'bg-aura-warning/10 border-aura-warning/30 text-aura-warning',
  IN_PROGRESS:       'bg-aura-gold/10 border-aura-gold/30 text-aura-gold',
};

const STAGE_DISPLAY_LABEL: Record<string, string> = {
  NEW: 'New', NO_ANSWER: 'No Answer', IN_PROGRESS: 'In Progress',
  AWAITING_DEPOSIT: 'Awaiting Deposit', DEPOSITED: 'Deposited — FTD', CLOSED: 'Closed', LOST: 'Lost',
  NEW_INQUIRY: 'New Inquiry', IN_DISCUSSION: 'In Discussion', PENDING_KYC: 'Pending KYC',
  APPROVED: 'Approved', REJECTED: 'Rejected',
};

const STAGE_NEXT_ACTION: Record<string, (name: string) => string> = {
  NEW: (name) => `${name} just joined. Begin with an introduction call to understand their investment goals. Do not push for a deposit yet.`,
  NO_ANSWER: (name) => `${name} didn't pick up last time. Try a different time of day or a different number before writing them off.`,
  IN_PROGRESS: (name) => `${name} is engaged. Focus on objection handling and present the platform's risk management tools.`,
  AWAITING_DEPOSIT: (name) => `${name} is ready to fund. Remind them of the deposit steps and answer any last questions.`,
  DEPOSITED: (name) => `${name} has funded. Congratulate them and introduce them to their dedicated account manager.`,
  CLOSED: (name) => `${name}'s case is closed. No further outreach needed unless they re-engage.`,
  LOST: (name) => `${name} was marked as lost. Review the notes before any further outreach.`,
  NEW_INQUIRY: (name) => `${name} just joined. Begin with an introduction call to understand their investment goals. Do not push for a deposit yet.`,
  IN_DISCUSSION: (name) => `${name} is engaged. Focus on objection handling and present the platform's risk management tools.`,
  PENDING_KYC: (name) => `${name} is awaiting KYC. Remind them to upload their ID and proof of address.`,
  APPROVED: (name) => `${name} is approved. Review their account and choose the next compliant follow-up.`,
  REJECTED: (name) => `${name} was rejected in KYC. Review the compliance notes before any outreach.`,
};

const DERIVED_STAGE_OPTIONS = [
  { value: 'NEW_INQUIRY', label: 'New Inquiry' },
  { value: 'PENDING_KYC', label: 'Pending KYC' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
] as const;

interface LocalTask {
  name: string;
  type: string;
  time: string;
  urgent: boolean;
}

function LeadPipeline({ leads, meta, loading, error, onRetry, onCall, onStageChange, onOpen, selectable, selectedIds, onToggleSelect, onSelectMany, onLoadMoreStage }: {
  leads: any[];
  meta: any;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onCall: (phone: string, name: string) => void;
  onStageChange: (leadId: string, fromStage: string, stage: LeadStage) => void;
  onOpen: (lead: any) => void;
  selectable: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectMany: (ids: string[], selected: boolean) => void;
  onLoadMoreStage: (stage: string) => void;
}) {
  const { t } = useI18n();
  const stages = meta?.grouped || {
    'New Inquiries': [],
    'In Discussion': [],
    'Pending KYC': [],
    'Funded (FTD)': [],
  };

  if (loading) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center p-12 border border-glass-border rounded-xl">
        <Loader2 className="w-8 h-8 text-aura-gold animate-spin" />
        <p className="text-sm font-mono tracking-widest uppercase mt-4 text-aura-platinum/60">Loading Pipeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center p-12 border border-aura-ruby/30 rounded-xl bg-aura-ruby/5">
        <AlertCircle className="w-8 h-8 text-aura-ruby" />
        <p className="text-sm font-mono tracking-widest uppercase mt-4 text-aura-ruby">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Retry</Button>
      </div>
    );
  }

  const stageNames = Object.keys(stages);

  return (
    <div className="mt-12">
       <div className="flex items-center justify-between mb-6">
         <h3 className="text-sm font-bold tracking-[0.2em] text-aura-platinum/80 uppercase">Lead Pipeline</h3>
         <Button variant="outline" size="sm" className="h-8 text-[10px]">View Analytics <ChevronRight className="w-3 h-3 ml-1" /></Button>
       </div>
       
       <div className="space-y-8">
          {Object.entries(stages).map(([stage, stageLeads]) => {
            const leadsList = stageLeads as any[];
            const totalCount = meta?.stageCounts?.[stage] ?? leadsList.length;
            const isFirstStage = stage === stageNames[0];
            const showLoadMore = totalCount > leadsList.length || (meta?.derivedMode && meta?.hasMore && isFirstStage);
            const stageOptions = meta?.derivedMode ? DERIVED_STAGE_OPTIONS : LEAD_STAGES;
            return (
              <div key={stage}>
                 <div className="flex items-center justify-between mb-4 px-1">
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${STAGE_DOT_COLOR[stage] ?? 'bg-aura-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]'}`} />
                     <h4 className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum/60">{stage}</h4>
                   </div>
                   <div className="flex items-center gap-2">
                     {selectable && leadsList.length > 0 && (
                       <button
                         onClick={() => onSelectMany(leadsList.map((l: any) => l.id), !leadsList.every((l: any) => selectedIds.has(l.id)))}
                         className="text-[9px] uppercase tracking-widest text-aura-gold/70 hover:text-aura-gold"
                       >
                         {leadsList.every((l: any) => selectedIds.has(l.id)) ? t('leadDeselectAll') : t('leadSelectAll')}
                       </button>
                     )}
                     <span className="text-[10px] font-mono text-aura-platinum/40 bg-white/5 px-2 py-0.5 rounded">{totalCount}</span>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                   {leadsList.map((lead: any) => (
                     <div
                       key={lead.id} 
                       onClick={() => selectable ? onToggleSelect(lead.id) : onOpen(lead)}
                       className={`p-4 rounded-xl border glass-card hover:-translate-y-1 transition-transform cursor-pointer group shadow-sm hover:shadow-md ${selectedIds.has(lead.id) ? 'ring-2 ring-aura-gold border-aura-gold/60' : ''}
                         ${STAGE_CARD_BORDER[lead.stage] ?? 'border-glass-border hover:border-aura-platinum/30'}
                       `}
                     >
                       <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {selectable && (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(lead.id)}
                                onClick={e => e.stopPropagation()}
                                onChange={() => onToggleSelect(lead.id)}
                                className="accent-aura-gold w-4 h-4 cursor-pointer shrink-0"
                              />
                            )}
                            <div className="font-medium text-sm text-aura-platinum">{lead.firstName} {lead.lastName}</div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); onOpen(lead); }} className="text-aura-platinum/30 hover:text-aura-platinum opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></button>
                       </div>
                       <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono">
                          <div>
                            <div className="text-[8px] uppercase tracking-widest text-aura-platinum/40 mb-0.5 font-sans">Capacity</div>
                            <div className={lead.stage === 'DEPOSITED' ? 'text-aura-emerald' : 'text-aura-platinum'}>{lead.capacity || 'TBD'}</div>
                          </div>
                          <div>
                            <div className="text-[8px] uppercase tracking-widest text-aura-platinum/40 mb-0.5 font-sans">Added</div>
                            <div className="text-aura-platinum/70 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                            </div>
                          </div>
                       </div>
                       {/* Stage selector */}
                       <div className="mb-3" onClick={e => e.stopPropagation()}>
                         <div className="relative">
                           {(() => {
                             const canMoveStage = Boolean(meta?.stageWritable) && lead.pipelineSource !== 'users';
                             return (
                           <select
                             value={lead.stage}
                             disabled={!canMoveStage}
                             title={canMoveStage ? "Move stage" : "Pipeline stage storage is not configured yet"}
                             onChange={e => onStageChange(lead.id, lead.stage, e.target.value as LeadStage)}
                             className={`w-full appearance-none rounded-lg px-3 py-1.5 pr-7 text-[10px] font-bold uppercase tracking-widest border outline-none cursor-pointer transition-colors ${
                               STAGE_SELECT_STYLE[lead.stage] ?? 'bg-white/5 border-glass-border text-aura-platinum/60'
                             } ${!canMoveStage ? 'cursor-not-allowed opacity-60' : ''}`}
                           >
                             {stageOptions.map(s => (
                               <option key={s.value} value={s.value} className="glass-card text-aura-platinum">{s.label}</option>
                             ))}
                           </select>
                             );
                           })()}
                           <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                         </div>
                       </div>

                       <div className="flex justify-between items-center border-t border-glass-border pt-3">
                          <span className="text-[9px] uppercase tracking-widest text-aura-platinum/40">{lead.acquisitionSource?.leadSource || 'Unknown'}</span>
                          <div className="flex gap-1">
                            <button onClick={e => { e.stopPropagation(); onOpen(lead); }} className="w-6 h-6 rounded bg-black/40 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/10 transition-colors">
                              <FileText className="w-3 h-3 text-aura-platinum/60" />
                            </button>
                            <button
                              title={lead.phone ? `Call ${lead.firstName}` : "No phone number"}
                              onClick={e => {
                                e.stopPropagation();
                                if (!lead.phone) {
                                  toast.error('No phone number available');
                                  return;
                                }
                                onCall(lead.phone, `${lead.firstName} ${lead.lastName}`.trim());
                              }}
                              className="w-6 h-6 rounded bg-black/40 border border-white/5 flex items-center justify-center hover:bg-aura-emerald/20 hover:border-aura-emerald/30 transition-colors"
                            >
                              <Phone className={`w-3 h-3 ${lead.phone ? 'text-aura-emerald' : 'text-aura-platinum/30'}`} />
                            </button>
                          </div>
                       </div>
                     </div>
                   ))}
                   {leadsList.length === 0 && (
                     <div className="col-span-full p-4 rounded-xl border border-dashed border-glass-border bg-transparent flex items-center justify-center h-24">
                       <span className="text-[10px] uppercase tracking-widest text-aura-platinum/30">Empty</span>
                     </div>
                   )}
                   {showLoadMore && (
                     <div className="col-span-full flex justify-center p-2">
                       <button
                         onClick={() => onLoadMoreStage(stage)}
                         className="rounded-lg border border-glass-border bg-black/30 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-aura-gold hover:border-aura-gold/30 hover:bg-aura-gold/10"
                       >
                         {totalCount > leadsList.length ? `Load more (${totalCount - leadsList.length})` : 'Load more'}
                       </button>
                     </div>
                   )}
                 </div>
              </div>
            );
          })}
       </div>
    </div>
  );
}

// Roles allowed to bulk-upload leads.
const LEAD_UPLOAD_ROLES = ['super-admin', 'superadmin', 'admin', 'crm_admin', 'director'];
function canUploadLeads(role?: string | null): boolean {
  return LEAD_UPLOAD_ROLES.includes((role || '').toLowerCase());
}

// Roles allowed to bulk-assign leads to an agent (agent excluded).
const LEAD_ASSIGN_ROLES = ['manager', 'director', 'admin', 'crm_admin', 'super-admin', 'superadmin'];
function canAssignLeads(role?: string | null): boolean {
  return LEAD_ASSIGN_ROLES.includes((role || '').toLowerCase());
}

// Minimal CSV parser (header row + comma-separated, basic quote support).
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += c;
      } else {
        if (c === '"') q = true;
        else if (c === ',') { out.push(cur); cur = ''; }
        else cur += c;
      }
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(l => {
    const cells = parseLine(l);
    const o: Record<string, string> = {};
    headers.forEach((h, i) => { o[h] = (cells[i] ?? '').trim(); });
    return o;
  });
}

function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) { if (row[k] !== undefined && row[k] !== '') return row[k]; }
  return '';
}

type UploadResult = { parsed: number; inserted: number; skipped: number; error?: string };

function LeadUploadButton({ onDone, role }: { onDone: () => void; role?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  if (!canUploadLeads(role)) return null;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      let text = await file.text();
      // Guard against Excel / binary files: they corrupt into garbage when read as text.
      // The control chars below are the intentional ZIP/xlsx magic-number signature.
      // eslint-disable-next-line no-control-regex
      if (/^PK\x03\x04/.test(text) || /\.xlsx?$/i.test(file.name) || text.includes("\u0000")) {
        setResult({ parsed: 0, inserted: 0, skipped: 0, error: "Please upload a CSV file (UTF-8). In Excel: Save As \u2192 CSV UTF-8." });
        setBusy(false);
        return;
      }
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip UTF-8 BOM
      const rows = parseCsv(text);
      const mapped = rows.map(r => {
        const fn = pick(r, ['firstName', 'first_name', 'First Name', 'firstname']);
        const ln = pick(r, ['lastName', 'last_name', 'Last Name', 'lastname']);
        const email = pick(r, ['email', 'Email', 'mail', 'E-mail']).toLowerCase();
        const phone = pick(r, ['mobile', 'phone', 'Phone', 'tel', 'Mobile']).replace(/[^\d+]/g, '');
        const country = pick(r, ['country', 'Country']);
        const source = pick(r, ['source', 'Source', 'leadSource']) || 'upload';
        return {
          first_name: fn,
          last_name: ln,
          name: `${fn} ${ln}`.trim(),
          email,
          phone,
          country,
          stage: 'NEW',
          acquisition_source: { source, country, imported_from: file.name },
        };
      }).filter(r => r.email);

      // de-duplicate within file
      const seen = new Set<string>();
      const unique = mapped.filter(r => { if (seen.has(r.email)) return false; seen.add(r.email); return true; });

      // de-duplicate against existing leads without scanning the full table
      const existing = new Set<string>();
      const emails = unique.map(r => r.email);
      for (let i = 0; i < emails.length; i += 500) {
        const { data, error } = await supabase.from('leads').select('email').in('email', emails.slice(i, i + 500));
        if (error) throw new Error(error.message);
        (data ?? []).forEach((x: any) => { if (x.email) existing.add(String(x.email).toLowerCase()); });
      }
      const toInsert = unique.filter(r => !existing.has(r.email));

      let inserted = 0;
      for (let i = 0; i < toInsert.length; i += 500) {
        const chunk = toInsert.slice(i, i + 500);
        const { error } = await supabase.from('leads').insert(chunk);
        if (error) throw new Error(error.message);
        inserted += chunk.length;
      }

      setResult({ parsed: rows.length, inserted, skipped: rows.length - inserted });
      onDone();
    } catch (err: any) {
      setResult({ parsed: 0, inserted: 0, skipped: 0, error: err?.message || 'Upload failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onPick} className="hidden" />
      <Button variant="secondary" onClick={() => inputRef.current?.click()} isLoading={busy}>
        {!busy && <Upload className="w-4 h-4" />} {busy ? 'Uploading…' : 'Upload Leads'}
      </Button>
      <Modal isOpen={!!result} onClose={() => setResult(null)} title="Lead Upload" subtitle={result?.error ? 'Failed' : 'Import summary'}>
        {result && (result.error ? (
          <div className="flex items-start gap-2 text-xs text-aura-ruby"><AlertCircle className="w-4 h-4 shrink-0" /><span>{result.error}</span></div>
        ) : (
          <div className="space-y-2 text-xs text-aura-platinum">
            <div>Parsed rows: <b>{result.parsed}</b></div>
            <div>Inserted: <b className="text-aura-emerald">{result.inserted}</b></div>
            <div>Skipped (duplicate / no email): <b>{result.skipped}</b></div>
            <p className="text-[10px] text-aura-platinum/40 pt-2">Expected columns: firstName, lastName, mobile, email, country, source</p>
          </div>
        ))}
      </Modal>
    </>
  );
}

function leadStageLabel(stage: string): string {
  const derived = DERIVED_STAGE_OPTIONS.find(s => s.value === stage);
  if (derived) return derived.label;
  const found = LEAD_STAGES.find(s => s.value === stage);
  return found ? found.label : (stage || '\u2014');
}

function LeadRow({ label, value }: { label: string; value: any }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className="py-2 border-b border-glass-border/60">
      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-0.5">{label}</div>
      <div className="text-xs text-aura-platinum break-words">{empty ? '\u2014' : String(value)}</div>
    </div>
  );
}

function LeadDetailsModal({ lead, onClose, onCall }: {
  lead: any | null;
  onClose: () => void;
  onCall: (phone: string, name: string) => void;
}) {
  if (!lead) return null;
  const fullName = `${lead.firstName ?? lead.first_name ?? ''} ${lead.lastName ?? lead.last_name ?? ''}`.trim() || lead.name || lead.email || 'Lead';
  const src = lead.acquisitionSource || lead.acquisition_source || {};
  return (
    <Modal isOpen={!!lead} onClose={onClose} title={fullName} subtitle={leadStageLabel(lead.stage)}>
      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-2 gap-x-4">
          <LeadRow label="First Name" value={lead.firstName ?? lead.first_name} />
          <LeadRow label="Last Name" value={lead.lastName ?? lead.last_name} />
          <LeadRow label="Email" value={lead.email} />
          <LeadRow label="Phone" value={lead.phone} />
          <LeadRow label="Country" value={lead.country} />
          <LeadRow label="Capacity" value={lead.capacity} />
          <LeadRow label="Timezone" value={lead.timezone} />
          <LeadRow label="Stage" value={leadStageLabel(lead.stage)} />
          <LeadRow label="Source" value={src.source || src.leadSource} />
          <LeadRow label="Assigned Agent" value={lead.assigned_agent_id} />
          <LeadRow label="Created" value={lead.created_at ? new Date(lead.created_at).toLocaleString() : null} />
          <LeadRow label="Updated" value={lead.updated_at ? new Date(lead.updated_at).toLocaleString() : null} />
        </div>

        {lead.notes && (
          <div className="mt-3 py-2">
            <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Notes</div>
            <div className="text-xs text-aura-platinum whitespace-pre-wrap break-words">{lead.notes}</div>
          </div>
        )}

        {src && Object.keys(src).length > 0 && (
          <div className="mt-3 py-2">
            <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Acquisition Source</div>
            <div className="space-y-1">
              {Object.entries(src).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 text-[11px]">
                  <span className="text-aura-platinum/50">{k}</span>
                  <span className="text-aura-platinum break-all text-right">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {lead.phone && (
          <Button variant="primary" className="w-full mt-5" onClick={() => onCall(lead.phone, fullName)}>
            <Phone className="w-3.5 h-3.5 fill-black" /> Call {fullName}
          </Button>
        )}
      </div>
    </Modal>
  );
}

export function AgentWorkspace() {
  const { t } = useI18n();
  const { openDialer } = usePhoneDialer();
  const { role } = useAuth();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<any[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');
  const [chosenAgentId, setChosenAgentId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<any | null>(null);

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });
  const clearSelection = () => setSelectedIds(new Set());
  const selectMany = (ids: string[], sel: boolean) => setSelectedIds(prev => {
    const n = new Set(prev); ids.forEach(id => { if (sel) n.add(id); else n.delete(id); }); return n;
  });

  useEffect(() => {
    if (!canAssignLeads(role)) return;
    supabase.from('users').select('id, full_name, display_name, email').eq('role', 'agent').order('full_name')
      .then(({ data }) => setAgents(data ?? []));
  }, [role]);

  const doAssign = async () => {
    if (!chosenAgentId || selectedIds.size === 0) return;
    setAssigning(true);
    try {
      const { data, error } = await supabase.rpc('assign_leads_bulk', {
        p_agent_id: chosenAgentId,
        p_lead_ids: Array.from(selectedIds),
      });
      if (error) throw new Error(error.message);
      setAssignResult(data);
      setAssignOpen(false);
      setChosenAgentId(null);
      clearSelection();
      await refetch();
    } catch (err: any) {
      const map: Record<string, string> = {
        insufficient_privileges: t('leadErrInsufficient'),
        invalid_agent: t('leadErrInvalidAgent'),
        empty_selection: t('leadErrEmptySelection'),
        limit_exceeded: t('leadErrLimit'),
      };
      const raw = err?.message || 'Assignment failed';
      const key = Object.keys(map).find(k => raw.includes(k));
      setAssignResult({ error: key ? map[key] : raw });
      setAssignOpen(false);
    } finally {
      setAssigning(false);
    }
  };

  const agentName = (a: any) => a?.full_name || a?.display_name || a?.email || 'Agent';
  const filteredAgents = agents.filter(a => agentName(a).toLowerCase().includes(agentSearch.toLowerCase()));
  const [localTasks, setLocalTasks] = useState<LocalTask[]>([]);
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState('Call');
  const [taskTime, setTaskTime] = useState('Next 1 Hour');

  const { leads, meta, loading, error, refetch, loadMoreStage, moveLeadStage } = useLeads(1, VISIBLE_PER_STAGE);

  const handleStageChange = async (leadId: string, fromStage: string, stage: LeadStage) => {
    if (!meta?.stageWritable) {
      toast.error('Pipeline stage storage is not configured yet');
      return;
    }
    try {
      await moveLeadStage(leadId, fromStage, stage);
    } catch (e) {
      console.error('[AgentWorkspace] Stage update failed', e);
      toast.error('Unable to update lead stage');
    }
  };

  // Stats derived from leads
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const ftdToday = leads.filter(
    (l) => l.stage === 'DEPOSITED' && new Date(l.created_at) >= todayStart
  ).length;

  const callsToday = leads.filter(
    (l) => new Date(l.created_at) >= todayStart
  ).length;

  // Featured lead (first in list)
  const featuredLead = leads[0] ?? null;
  const featuredName = featuredLead
    ? `${featuredLead.firstName ?? ''} ${featuredLead.lastName ?? ''}`.trim()
    : null;
  const featuredInitials = featuredName
    ? featuredName.split(' ').map((p: string) => p[0] ?? '').join('').toUpperCase().slice(0, 2)
    : '—';

  // Task queue: auto-generated from leads + user-added tasks
  const urgentLeads = leads.filter((l) => l.stage === 'NEW' || l.stage === 'NEW_INQUIRY').slice(0, 2);
  const followUpLeads = leads.filter((l) => l.stage === 'IN_PROGRESS' || l.stage === 'IN_DISCUSSION').slice(0, 2);
  const autoTasks: LocalTask[] = [
    ...urgentLeads.map((l) => ({
      name: `${l.firstName ?? ''} ${l.lastName ?? ''}`.trim(),
      type: 'Urgent Call',
      time: 'Now',
      urgent: true,
    })),
    ...followUpLeads.map((l) => ({
      name: `${l.firstName ?? ''} ${l.lastName ?? ''}`.trim(),
      type: 'Follow Up',
      time: 'Today',
      urgent: false,
    })),
  ];
  const taskQueue = [...autoTasks, ...localTasks].slice(0, 5);

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskName.trim()) { setIsTaskModalOpen(false); return; }
    setLocalTasks((prev) => [
      ...prev,
      {
        name: taskName.trim(),
        type: taskType,
        time: taskTime === 'Next 1 Hour' ? 'in 1 hr' : taskTime === 'Today' ? 'Today' : 'Tomorrow',
        urgent: taskType === 'Call' && taskTime === 'Next 1 Hour',
      },
    ]);
    setTaskName('');
    setIsTaskModalOpen(false);
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-glass-border pb-4 mb-6 flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t('agentTitle')}</h2>
          <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t('agentSubtitle')}</p>
        </div>
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
           <div className="flex gap-4">
             <div className="text-right">
               <div className="text-xl font-light text-aura-gold">
                 {loading ? <Loader2 className="w-4 h-4 animate-spin text-aura-gold inline" /> : callsToday}
               </div>
               <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40">Leads Today</div>
             </div>
             <div className="text-right border-l border-glass-border pl-4">
               <div className="text-xl font-light text-aura-emerald">
                 {loading ? <Loader2 className="w-4 h-4 animate-spin text-aura-emerald inline" /> : ftdToday}
               </div>
               <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40">FTD Today</div>
             </div>
           </div>
           <LeadUploadButton onDone={refetch} role={role} />
           <Button variant="secondary" size="icon" onClick={() => setIsTaskModalOpen(true)}>
             <Plus className="w-4 h-4" />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Featured Lead Panel */}
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-xl border border-glass-border glass-card p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-aura-gold animate-spin" />
              </div>
            ) : !featuredLead ? (
              <div className="flex flex-col items-center justify-center py-12 text-aura-platinum/30">
                <Phone className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-[10px] uppercase tracking-widest">No leads in pipeline</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-glass-border gap-4">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded border border-aura-gold/30 bg-black flex items-center justify-center text-lg font-display text-aura-gold">
                       {featuredInitials}
                     </div>
                     <div>
                       <h3 className="text-lg font-medium text-aura-platinum">{featuredName}</h3>
                       <div className={`text-[10px] uppercase tracking-widest mt-1 ${
                         featuredLead.stage === 'DEPOSITED' ? 'text-aura-emerald' :
                         featuredLead.stage === 'AWAITING_DEPOSIT' || featuredLead.stage === 'PENDING_KYC' ? 'text-aura-warning' :
                         featuredLead.stage === 'LOST' || featuredLead.stage === 'REJECTED' ? 'text-aura-ruby' :
                         'text-aura-gold'
                       }`}>
                         {STAGE_DISPLAY_LABEL[featuredLead.stage] ?? featuredLead.stage}
                       </div>
                     </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                     <Button variant="secondary" className="flex-1 sm:flex-auto" onClick={() => setSelectedLead(featuredLead)}>
                       <FileText className="w-3.5 h-3.5" /> Notes
                     </Button>
                     <Button
                       variant="primary"
                       className="flex-1 sm:flex-auto"
                       onClick={() => {
                         if (!featuredLead.phone) {
                           toast.error('No phone number available');
                           return;
                         }
                         openDialer({ phone: featuredLead.phone, name: featuredName ?? 'Lead' });
                         toast.success('Call started');
                       }}
                     >
                       <Phone className="w-3.5 h-3.5 fill-black" /> Call Now
                     </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-sm">
                   <div>
                      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Source</div>
                      <div className="text-aura-platinum text-xs">{featuredLead.acquisitionSource?.leadSource || 'Unknown'}</div>
                   </div>
                   <div>
                      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Capacity</div>
                      <div className="font-mono text-aura-gold text-xs">{featuredLead.capacity || 'TBD'}</div>
                   </div>
                   <div>
                      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Added</div>
                      <div className="text-aura-platinum text-xs">
                        {featuredLead.created_at ? new Date(featuredLead.created_at).toLocaleDateString() : '—'}
                      </div>
                   </div>
                   <div>
                      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Email</div>
                      <div className="text-aura-platinum text-xs truncate">{featuredLead.email || '—'}</div>
                   </div>
                </div>

                <div className="rounded border border-aura-gold/20 bg-gradient-to-br from-aura-gold/10 to-transparent p-6 backdrop-blur-md">
                  <div className="text-[10px] text-aura-gold font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" /> AI NEXT BEST ACTION
                  </div>
                  <div className="rounded bg-black/40 p-4 border border-glass-border border-l-2 border-l-aura-gold">
                    <p className="text-aura-platinum/90 text-xs leading-relaxed">
                      {(STAGE_NEXT_ACTION[featuredLead.stage] ?? STAGE_NEXT_ACTION.DEPOSITED)(featuredName ?? 'This lead')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Task Queue */}
        <div className="space-y-6">
          <div className="rounded-xl border border-glass-border glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">Task Queue</h3>
              <button 
                className="text-[10px] text-aura-gold hover:text-aura-gold-light uppercase tracking-widest font-bold transition-colors"
                onClick={() => setIsTaskModalOpen(true)}
              >
                + New
              </button>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-aura-gold animate-spin" />
                </div>
              ) : taskQueue.length === 0 ? (
                <div className="text-center py-6 text-aura-platinum/30 text-[10px] uppercase tracking-widest">
                  No tasks — add leads to pipeline
                </div>
              ) : (
                taskQueue.map((task, i) => (
                  <div key={i} className={`p-4 rounded border-l-2 flex justify-between items-center transition-colors hover:bg-white/5 ${task.urgent ? 'border-aura-ruby bg-aura-ruby/5' : 'border-aura-platinum/30 glass-card'}`}>
                    <div>
                      <div className="text-xs font-medium text-aura-platinum">{task.name}</div>
                      <div className={`text-[9px] uppercase tracking-widest mt-1 ${task.urgent ? 'text-aura-ruby' : 'text-aura-platinum/50'}`}>{task.type}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-aura-platinum/50">
                      <Clock className="w-3 h-3" /> {task.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      <LeadPipeline
        leads={leads}
        meta={meta}
        loading={loading}
        error={error}
        onRetry={refetch}
        onCall={(phone, name) => openDialer({ phone, name })}
        onStageChange={handleStageChange}
        onOpen={setSelectedLead}
        selectable={canAssignLeads(role) && Boolean(meta?.stageWritable)}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectMany={selectMany}
        onLoadMoreStage={loadMoreStage}
      />

      {/* Bulk selection action bar */}
      {canAssignLeads(role) && selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-3 rounded-xl border border-aura-gold/30 glass-card shadow-2xl">
          <span className="text-xs text-aura-platinum">{t('leadSelectedLabel')}: <b className="text-aura-gold">{selectedIds.size}</b></span>
          <Button variant="primary" size="sm" onClick={() => { setAgentSearch(''); setChosenAgentId(null); setAssignOpen(true); }}>
            {t('leadAssignToAgent')}
          </Button>
          <button onClick={clearSelection} className="text-[10px] uppercase tracking-widest text-aura-platinum/50 hover:text-aura-platinum">{t('leadClearSelection')}</button>
        </div>
      )}

      {/* Agent picker modal */}
      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title={t('leadAssignToAgent')} subtitle={`${selectedIds.size} ${t('leadsSelectedSuffix')}`}>
        <div className="space-y-3">
          <input
            value={agentSearch}
            onChange={e => setAgentSearch(e.target.value)}
            placeholder={t('leadSearchAgent')}
            className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-xs text-aura-platinum outline-none focus:border-aura-gold/50"
          />
          <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
            {filteredAgents.length === 0 ? (
              <div className="text-[11px] text-aura-platinum/40 py-4 text-center">{t('leadNoAgents')}</div>
            ) : filteredAgents.map(a => (
              <button
                key={a.id}
                onClick={() => setChosenAgentId(a.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left text-xs transition-colors ${
                  chosenAgentId === a.id ? 'border-aura-gold/50 bg-aura-gold/10 text-aura-platinum' : 'border-glass-border glass-card text-aura-platinum/70 hover:bg-white/5'
                }`}
              >
                <span>{agentName(a)}</span>
                {chosenAgentId === a.id && <span className="text-aura-gold text-[10px] uppercase tracking-widest">{t('leadChosen')}</span>}
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            className="w-full"
            isLoading={assigning}
            disabled={!chosenAgentId || assigning}
            onClick={doAssign}
          >
            {t('leadAssignAction')} {selectedIds.size} {t('leadsWordLower')}
          </Button>
        </div>
      </Modal>

      {/* Result modal */}
      <Modal isOpen={!!assignResult} onClose={() => setAssignResult(null)} title={t('leadAssignmentTitle')} subtitle={assignResult?.error ? t('commonError') : t('commonResult')}>
        {assignResult && (assignResult.error ? (
          <div className="flex items-start gap-2 text-xs text-aura-ruby"><AlertCircle className="w-4 h-4 shrink-0" /><span>{assignResult.error}</span></div>
        ) : (
          <div className="space-y-2 text-xs text-aura-platinum">
            <div>{t('leadRequested')}: <b>{assignResult.requested}</b></div>
            <div>{t('leadAssigned')}: <b className="text-aura-emerald">{assignResult.assigned}</b></div>
            <div>{t('leadSkipped')}: <b>{assignResult.summary?.skipped ?? 0}</b></div>
            {Array.isArray(assignResult.skipped) && assignResult.skipped.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                {assignResult.skipped.map((sk: any, i: number) => (
                  <div key={i} className="flex justify-between gap-2 text-[10px] text-aura-platinum/50">
                    <span className="truncate">{sk.lead_id}</span><span>{sk.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Modal>

      <LeadDetailsModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onCall={(phone, name) => openDialer({ phone, name })}
      />

      <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)}
        title="Create Agent Task"
        subtitle="Schedule a follow-up or internal action"
      >
         <form className="space-y-4 text-sm" onSubmit={handleAddTask}>
            <div>
               <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Lead / Client Name</label>
               <input
                 type="text"
                 value={taskName}
                 onChange={(e) => setTaskName(e.target.value)}
                 className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors"
                 placeholder="e.g. James Layton"
                 required
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Task Type</label>
                 <select
                   value={taskType}
                   onChange={(e) => setTaskType(e.target.value)}
                   className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors appearance-none"
                 >
                    <option>Call</option>
                    <option>Email</option>
                    <option>Review Docs</option>
                 </select>
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Time</label>
                 <select
                   value={taskTime}
                   onChange={(e) => setTaskTime(e.target.value)}
                   className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors appearance-none"
                 >
                    <option>Next 1 Hour</option>
                    <option>Today</option>
                    <option>Tomorrow</option>
                 </select>
               </div>
            </div>
            <div>
               <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Notes</label>
               <textarea className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors" rows={3} placeholder="Add context..."></textarea>
            </div>
            <div className="pt-4 border-t border-glass-border flex justify-end gap-3 flex-col sm:flex-row">
               <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
               <Button type="submit" variant="primary">Create Task</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
