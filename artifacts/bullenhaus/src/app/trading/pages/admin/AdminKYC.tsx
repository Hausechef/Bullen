import React, { useEffect, useState } from 'react';
import {
  UserX, Check, RefreshCw, ShieldCheck, Eye, Download,
  FileText, Image as ImageIcon, ChevronDown, ChevronUp,
  DollarSign, Clock, XCircle, Bot, Loader2, Sparkles,
  AlertTriangle, CheckCircle2, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface KycDoc {
  type: string;
  name: string;
  path: string;
  contentType: string;
}

interface KycUser {
  id: string;
  email: string;
  full_name: string | null;
  kyc_status: string;
  kyc_documents: KycDoc[] | null;
  balance: number | null;
  created_at: string;
  updated_at: string;
}

interface BotResult {
  decision: 'approve' | 'reject' | 'escalate';
  confidence: number;
  risk_tier: 'low' | 'medium' | 'high';
  summary: string;
  reasoning: string;
  flags: string[];
  required_followup?: string[];
  document_analyses: Array<{ docType: string; fileName: string; analysis: unknown }>;
}

// Demo KYC users for mock/dummy mode (when Supabase is unreachable).
// Each user has documents that point to local sample images in /public/kyc-samples/.
const DEMO_KYC_USERS: KycUser[] = [
  {
    id: 'demo-hans',
    email: 'hans.mueller@example.com',
    full_name: 'Hans Mueller',
    kyc_status: 'PENDING',
    kyc_documents: [
      { type: 'passport', name: 'passport_german.png', path: '/kyc-samples/passport__valid_german_hans.png', contentType: 'image/png' },
      { type: 'selfie', name: 'selfie.png', path: '/kyc-samples/selfie__hans.png', contentType: 'image/png' },
      { type: 'proof_of_address', name: 'utility_bill.png', path: '/kyc-samples/proof_of_address__hans_utility.png', contentType: 'image/png' },
    ],
    balance: 5000,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'demo-marie',
    email: 'marie.dubois@example.com',
    full_name: 'Marie Dubois',
    kyc_status: 'PENDING',
    kyc_documents: [
      { type: 'id_card', name: 'id_card_french.png', path: '/kyc-samples/id_card__french_marie.png', contentType: 'image/png' },
      { type: 'selfie', name: 'selfie.png', path: '/kyc-samples/selfie__marie.png', contentType: 'image/png' },
      { type: 'proof_of_address', name: 'bank_statement.png', path: '/kyc-samples/proof_of_address__marie_bank.png', contentType: 'image/png' },
    ],
    balance: 2500,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

const isDummyMode = () =>
  import.meta.env.DEV && (import.meta.env.VITE_SUPABASE_URL?.includes('dummy') ?? false);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    PENDING:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
    VERIFIED:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REJECTED:   'bg-rose-500/10 text-rose-400 border-rose-500/20',
    UNVERIFIED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${map[status] || map.UNVERIFIED}`}>
      {status}
    </span>
  );
};

const DocViewer: React.FC<{ doc: KycDoc; userId: string }> = ({ doc, userId }) => {
  const { t } = useTranslation(['common']);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (url) return;
    setLoading(true);
    try {
      // In dummy mode or if path is a local URL, use it directly
      if (isDummyMode() || doc.path.startsWith('/')) {
        setUrl(doc.path);
        return;
      }
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(doc.path, 60 * 30);
      if (error) throw error;
      setUrl(data.signedUrl);
    } catch (e: any) {
      toast.error(t('adminKyc.toast.loadError', { error: e.message }));
    } finally {
      setLoading(false);
    }
  };

  const isImage = doc.contentType?.startsWith('image/');
  const Icon = isImage ? ImageIcon : FileText;

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/8">
      <Icon size={14} className="text-text-dim shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{doc.type.replace('_', ' ')}</p>
        <p className="text-[10px] text-text-dim truncate">{doc.name}</p>
      </div>
      <div className="flex gap-1">
        {isImage && url ? (
          <a href={url} target="_blank" rel="noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-accent-primary/10 text-text-muted hover:text-accent-primary transition-all"
            title="View">
            <Eye size={12} />
          </a>
        ) : (
          <button onClick={load} disabled={loading}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-accent-primary/10 text-text-muted hover:text-accent-primary transition-all disabled:opacity-40"
            title="Load URL">
            {loading
              ? <span className="block w-3 h-3 border border-text-dim border-t-transparent rounded-full animate-spin" />
              : <Eye size={12} />}
          </button>
        )}
        {url && (
          <a href={url} download={doc.name}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-accent-secondary/10 text-text-muted hover:text-accent-secondary transition-all"
            title="Download">
            <Download size={12} />
          </a>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// BotDecisionCard — displays the AI bot's analysis result
// ---------------------------------------------------------------------------
const BotDecisionCard: React.FC<{ result: BotResult }> = ({ result }) => {
  const colors: Record<string, string> = {
    approve: 'border-emerald-500/30 bg-emerald-500/5',
    reject: 'border-rose-500/30 bg-rose-500/5',
    escalate: 'border-amber-500/30 bg-amber-500/5',
  };
  const iconColor: Record<string, string> = {
    approve: 'text-emerald-400',
    reject: 'text-rose-400',
    escalate: 'text-amber-400',
  };
  const Icon = result.decision === 'approve' ? CheckCircle2 : result.decision === 'reject' ? XCircle : AlertTriangle;

  return (
    <div className={`rounded-xl border p-3 ${colors[result.decision]}`}>
      <div className="mb-2 flex items-center gap-2">
        <Bot size={14} className={iconColor[result.decision]} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-text">
          Bot: {result.decision.toUpperCase()}
        </span>
        <span className={`ml-auto text-[10px] font-mono font-bold ${iconColor[result.decision]}`}>
          {result.confidence}%
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
          result.risk_tier === 'low' ? 'bg-emerald-500/10 text-emerald-400'
          : result.risk_tier === 'medium' ? 'bg-amber-500/10 text-amber-400'
          : 'bg-rose-500/10 text-rose-400'
        }`}>
          {result.risk_tier} risk
        </span>
      </div>
      <p className="text-[11px] font-medium text-text mb-1">{result.summary}</p>
      <p className="text-[10px] text-text-muted leading-relaxed">{result.reasoning}</p>
      {result.flags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {result.flags.map((f, i) => (
            <span key={i} className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] text-rose-400">
              ⚠ {f}
            </span>
          ))}
        </div>
      )}
      {result.required_followup && result.required_followup.length > 0 && (
        <div className="mt-2 rounded-lg bg-black/30 p-2">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-amber-400">Required follow-up</p>
          <ul className="space-y-0.5">
            {result.required_followup.map((f, i) => (
              <li key={i} className="text-[10px] text-text-muted">• {f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const KycRow: React.FC<{
  item: KycUser;
  onApprove: (id: string, email: string) => void;
  onReject:  (id: string, email: string) => void;
}> = ({ item, onApprove, onReject }) => {
  const { t } = useTranslation(['common']);
  const [expanded, setExpanded] = useState(false);
  const [botResult, setBotResult] = useState<BotResult | null>(null);
  const [botLoading, setBotLoading] = useState(false);
  const docs: KycDoc[] = Array.isArray(item.kyc_documents) ? item.kyc_documents : [];

  // -------------------------------------------------------------------------
  // Run the KYC bot: fetch documents from Supabase Storage → send to Next.js API
  // -------------------------------------------------------------------------
  const runBot = async () => {
    if (docs.length === 0) {
      toast.error('No documents to analyze');
      return;
    }
    setBotLoading(true);
    setBotResult(null);
    try {
      // 1. Fetch each document. In dummy mode, docs point to local paths
      //    in /kyc-samples/. In real mode, they're in Supabase Storage.
      const docPayloads: Array<{ docType: string; fileName: string; fileData: string }> = [];

      for (const doc of docs) {
        try {
          let imageUrl: string;
          if (isDummyMode() || doc.path.startsWith('/')) {
            // Local sample image (served by Vite from /public)
            imageUrl = doc.path;
          } else {
            // Supabase Storage — create a signed URL
            const { data, error } = await supabase.storage
              .from('kyc-documents')
              .createSignedUrl(doc.path, 300);
            if (error || !data?.signedUrl) throw new Error('signed url failed');
            imageUrl = data.signedUrl;
          }

          // Fetch the image and convert to base64 data URI
          const imgRes = await fetch(imageUrl);
          const blob = await imgRes.blob();
          const dataUri: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          docPayloads.push({
            docType: doc.type,
            fileName: doc.name,
            fileData: dataUri,
          });
        } catch (e) {
          console.warn('Failed to fetch doc', doc.name, e);
        }
      }

      if (docPayloads.length === 0) {
        throw new Error('Could not load any documents');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session expired');

      // 2. Send to the KYC bot API (stateless advisory analysis)
      const res = await fetch('/api/kyc/analyze-external?XTransformPort=3001', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          clientName: item.full_name || item.email,
          clientEmail: item.email,
          clientCountry: 'Unknown',
          clientDob: null,
          documents: docPayloads,
        }),
      });
      if (!res.ok) throw new Error(`Bot API error (${res.status})`);
      const result: BotResult = await res.json();
      setBotResult(result);

      const decisionLabel = result.decision === 'approve' ? '✓ Approved'
        : result.decision === 'reject' ? '✗ Rejected'
        : '⚠ Escalated';
      toast.success(`Bot: ${decisionLabel} (${result.confidence}% confidence)`);
    } catch (e: any) {
      toast.error(`Bot failed: ${e.message}`);
    } finally {
      setBotLoading(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="px-6 py-4">
          <p className="font-bold text-text text-sm">{item.full_name || '—'}</p>
          <p className="text-[10px] text-text-dim mt-0.5">{item.email}</p>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={item.kyc_status} />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-1.5">
            <DollarSign size={13} className="text-accent-secondary" />
            <span className="font-mono font-bold text-text text-sm">
              {item.balance != null
                ? Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })
                : '0.00'}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${docs.length > 0 ? 'text-accent-primary' : 'text-text-dim'}`}>
            <FileText size={11} /> {docs.length} {docs.length === 1 ? 'file' : 'files'}
          </span>
        </td>
        <td className="px-6 py-4 text-text-dim text-xs font-mono">
          {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}
        </td>
        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
          <div className="flex justify-end gap-2 items-center">
            {/* KYC BOT BUTTON */}
            <button
              onClick={runBot}
              disabled={botLoading || docs.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 font-bold text-[10px] uppercase tracking-wider transition-all disabled:opacity-40"
              title="Run AI bot analysis on this client's documents"
            >
              {botLoading
                ? <><Loader2 size={11} className="animate-spin" /> Analyzing…</>
                : <><Bot size={11} /> Bot</>}
            </button>
            <button
              onClick={() => onApprove(item.id, item.email)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-bold text-[10px] uppercase tracking-wider transition-all"
            >
              <Check size={11} /> {t('adminKyc.actions.approve')}
            </button>
            <button
              onClick={() => onReject(item.id, item.email)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 font-bold text-[10px] uppercase tracking-wider transition-all"
            >
              <XCircle size={11} /> {t('adminKyc.actions.reject')}
            </button>
            <span className="text-text-dim ml-1">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>
        </td>
      </tr>

      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={6} className="px-6 pb-4 pt-0">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card p-4 space-y-3">
                  {/* Bot result card (shown after analysis) */}
                  {botResult && <BotDecisionCard result={botResult} />}

                  {/* Bot prompt (when no result yet) */}
                  {!botResult && !botLoading && docs.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-violet-500/5 border border-violet-500/10 p-2.5">
                      <Sparkles size={14} className="text-violet-400" />
                      <p className="text-[11px] text-text-muted flex-1">
                        Click <span className="font-bold text-violet-400">Bot</span> to run automated AI analysis on {docs.length} document{docs.length === 1 ? '' : 's'}.
                      </p>
                    </div>
                  )}
                  {botLoading && (
                    <div className="flex items-center gap-2 rounded-lg bg-violet-500/5 border border-violet-500/10 p-2.5">
                      <Loader2 size={14} className="animate-spin text-violet-400" />
                      <p className="text-[11px] text-text-muted">
                        Bot is analyzing documents with vision AI…
                      </p>
                    </div>
                  )}

                  {/* Documents */}
                  {docs.length === 0 ? (
                    <p className="text-xs text-text-dim text-center py-2">{t('adminKyc.empty.noDocs')}</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {docs.map((doc, i) => (
                        <DocViewer key={i} doc={doc} userId={item.id} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};

export const AdminKYC = () => {
  const { t } = useTranslation(['common']);
  const [users, setUsers]     = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState<'PENDING' | 'ALL'>('PENDING');
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // In dummy mode, use demo data instead of Supabase
      if (isDummyMode()) {
        await new Promise((r) => setTimeout(r, 300));
        let data = DEMO_KYC_USERS;
        if (filter === 'PENDING') data = data.filter((u) => u.kyc_status === 'PENDING');
        setUsers(data);
        return;
      }
      let q = supabase
        .from('users')
        .select('id, email, full_name, kyc_status, kyc_documents, balance, created_at, updated_at')
        .order('updated_at', { ascending: false });
      if (filter === 'PENDING') q = q.eq('kyc_status', 'PENDING');
      const { data, error } = await q;
      if (error) throw error;
      setUsers(data || []);
    } catch (e) {
      console.error('[AdminKYC] Failed to load KYC users', e);
      setUsers([]);
      setLoadError('KYC reviews are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const handleApprove = async (id: string, email: string) => {
    try {
      const { error } = await supabase.from('users').update({ kyc_status: 'VERIFIED' }).eq('id', id);
      if (error) throw error;
      toast.success(t('adminKyc.toast.approved', { email }));
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || t('adminKyc.toast.approveFailed'));
    }
  };

  const handleReject = async (id: string, email: string) => {
    if (!confirm(t('adminKyc.toast.rejectConfirm', { email }) as string)) return;
    try {
      const { error } = await supabase.from('users').update({ kyc_status: 'REJECTED' }).eq('id', id);
      if (error) throw error;
      toast.success(t('adminKyc.toast.rejected', { email }));
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || t('adminKyc.toast.rejectFailed'));
    }
  };

  const pendingCount = users.filter(u => u.kyc_status === 'PENDING').length;

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header — premium with gold accent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-1 bg-gradient-to-b from-accent-primary to-accent-primary/40 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent-primary/80">Compliance</span>
          </div>
          <h2 className="font-serif text-3xl font-light italic tracking-tight text-text flex items-center gap-3">
            {t('adminKyc.title')}
          </h2>
          <p className="text-sm text-text-muted mt-1.5 flex items-center gap-2 flex-wrap">
            {t('adminKyc.desc')}
            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-500/15 to-violet-500/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-400 border border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.1)]">
              <Zap size={9} /> AI Bot Enabled
            </span>
            {filter === 'PENDING' && pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-400 rounded-md text-[10px] font-bold border border-orange-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                </span>
                {t('adminKyc.pendingBadge', { count: pendingCount })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-black/40 border border-border rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            {(['PENDING', 'ALL'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-accent-primary/15 to-accent-primary/5 text-accent-primary border border-accent-primary/25 shadow-[0_0_12px_rgba(212,175,55,0.1)]'
                    : 'text-text-dim hover:text-text hover:bg-white/5'
                }`}
              >
                {f === 'PENDING' ? <><Clock size={10} className="inline mr-1" />{t('adminKyc.filters.pending')}</> : t('adminKyc.filters.all')}
              </button>
            ))}
          </div>
          <button
            onClick={fetchUsers}
            className="p-2 border border-border rounded-xl text-text-muted hover:text-accent-primary hover:border-accent-primary/30 hover:bg-accent-primary/5 transition-all"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table — premium with top gold hairline */}
      <div className="relative glass-card overflow-x-auto">
        {/* Top gold hairline */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] font-bold text-text-dim uppercase tracking-widest bg-surface/60">
              <th className="px-6 py-4">{t('adminKyc.columns.client')}</th>
              <th className="px-6 py-4">{t('adminKyc.columns.status')}</th>
              <th className="px-6 py-4">{t('adminKyc.columns.balance')}</th>
              <th className="px-6 py-4">{t('adminKyc.columns.documents')}</th>
              <th className="px-6 py-4">{t('adminKyc.columns.submitted')}</th>
              <th className="px-6 py-4 text-right">{t('adminKyc.columns.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
                      <UserX size={20} className="text-text-dim" />
                    </div>
                    <p className="text-sm font-medium text-text-muted">
                      {loading ? t('adminKyc.empty.loading') : loadError || (filter === 'PENDING' ? t('adminKyc.empty.noPending') : t('adminKyc.empty.noUsers'))}
                    </p>
                  </div>
                </td>
              </tr>
            ) : users.map(item => (
              <KycRow
                key={item.id}
                item={item}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
