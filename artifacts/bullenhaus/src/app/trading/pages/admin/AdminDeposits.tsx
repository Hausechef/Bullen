import React, { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw, Users, Send, CheckCircle2, CreditCard, Loader2, X } from 'lucide-react';
import { TxStatus } from '../../stores/transactionStore';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { apiFetch } from '../../lib/api';
import { PaymentDetailsForm, PaymentDetailsSentBadge } from '../../components/admin/PaymentDetailsForm';
import type { PaymentDetails } from '../../components/admin/PaymentDetailsForm';
import { useTranslation } from 'react-i18next';

interface OnlineDeposit {
  id: string;
  order_id: string;
  provider: string;
  provider_payment_id: string | null;
  method: 'CARD' | 'BANK_TRANSFER';
  amount: string | number;
  currency: string;
  status: string;
  provider_status: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  users: { email: string | null; full_name: string | null; display_name: string | null } | null;
}

interface OnlineDepositDetails extends OnlineDeposit {
  company_id: string;
  checkout_url: string | null;
  failure_reason: string | null;
  paid_source: string | null;
  capabilities?: { canMarkPaid: boolean; canCancel: boolean };
  events: { id: string; event_type: string | null; provider_status: string | null; verified: boolean; processed: boolean; received_at: string; error: string | null }[];
  audit: { id: string; action: string; created_at: string; details: Record<string, unknown> }[];
}

const MANUAL_SETTLEMENT_CONFIRMATION = 'I verified this payment in the TRAPAY merchant dashboard';

const methodLabel = (m: string) => (m === 'CARD' ? 'Bank Card' : m === 'BANK_TRANSFER' ? 'Bank Transfer' : m);

const statusBadge = (status: string) => {
  const cls =
    status === 'PAID' ? 'bg-success/10 text-success' :
    status === 'FAILED' || status === 'CANCELLED' ? 'bg-danger/10 text-danger' :
    status === 'REFUNDED' || status === 'CHARGEBACK' ? 'bg-warning/10 text-warning' :
    'bg-info/10 text-info';
  return <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter inline-block ${cls}`}>{status}</span>;
};

// ── Online (TRAPAY) deposits ────────────────────────────────────────────────
const OnlineDepositsTab = () => {
  const { t } = useTranslation('common');
  // The server decides capabilities (feature flag + role); the UI only renders
  // what GET /api/admin/deposits/:id reports.

  const [rows, setRows] = useState<OnlineDeposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<OnlineDepositDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  // Manual settlement form — only reachable when the server reports the
  // capability (feature flag TRAPAY_MANUAL_SETTLEMENT_ENABLED + admin role).
  const [settleForm, setSettleForm] = useState({ providerPaymentId: '', reason: '', confirmed: false });
  const [cancelForm, setCancelForm] = useState({ open: false, reason: '' });

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiFetch(`/api/admin/deposits?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.deposits)) setRows(data.deposits);
    } catch {
      // keep previous rows
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const openDetails = async (id: string) => {
    setSelectedId(id);
    setDetails(null);
    setDetailsLoading(true);
    setSettleForm({ providerPaymentId: '', reason: '', confirmed: false });
    setCancelForm({ open: false, reason: '' });
    try {
      const res = await apiFetch(`/api/admin/deposits/${id}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDetails(data.deposit);
        if (data.deposit?.provider_payment_id) {
          setSettleForm(f => ({ ...f, providerPaymentId: data.deposit.provider_payment_id }));
        }
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const settleReady =
    settleForm.providerPaymentId.trim().length > 0 &&
    settleForm.providerPaymentId.trim() === details?.provider_payment_id &&
    settleForm.reason.trim().length >= 10 &&
    settleForm.confirmed;

  const markPaid = async () => {
    if (!details || marking || !settleReady) return;
    setMarking(true);
    try {
      const res = await apiFetch(`/api/admin/deposits/${details.id}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'mark_paid',
          reason: settleForm.reason.trim(),
          providerPaymentId: settleForm.providerPaymentId.trim(),
          confirmation: MANUAL_SETTLEMENT_CONFIRMATION,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        toast.success(t('adminTx.markPaidOk', 'Deposit credited to customer balance'));
        setSelectedId(null);
        setDetails(null);
        fetchRows();
      } else {
        toast.error(payload?.error || t('adminTx.markPaidFailed', 'Credit refused'));
      }
    } catch {
      toast.error(t('adminTx.markPaidFailed', 'Credit refused'));
    } finally {
      setMarking(false);
    }
  };

  const cancelDeposit = async () => {
    if (!details || cancelForm.reason.trim().length < 10) return;
    setMarking(true);
    try {
      const res = await apiFetch(`/api/admin/deposits/${details.id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel', reason: cancelForm.reason.trim() }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        toast.success(t('adminTx.cancelledOk', 'Deposit cancelled — no balance change'));
        setSelectedId(null);
        setDetails(null);
        fetchRows();
      } else {
        toast.error(payload?.error || t('adminTx.cancelFailed', 'Cancel failed'));
      }
    } catch {
      toast.error(t('adminTx.cancelFailed', 'Cancel failed'));
    } finally {
      setMarking(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('adminTx.onlineSearch', 'Search order ID / TRAPAY ID / customer')}
          className="input-dark py-2 text-xs w-full sm:w-72"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-dark py-2 text-xs w-fit">
          <option value="">{t('adminTx.allStatuses', 'All statuses')}</option>
          {['CREATED', 'PROVIDER_CREATE_PENDING', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'CHARGEBACK'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button onClick={fetchRows} className="p-2 border border-border rounded-xl text-text-muted hover:text-text transition-all">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] font-bold text-text-dim uppercase tracking-widest bg-surface/60">
              <th className="px-6 py-4 font-bold">{t('date')}</th>
              <th className="px-6 py-4 font-bold">Customer</th>
              <th className="px-6 py-4 font-bold">{t('adminTx.columns.amount')}</th>
              <th className="px-6 py-4 font-bold">{t('method')}</th>
              <th className="px-6 py-4 font-bold">{t('adminTx.columns.status')}</th>
              <th className="px-6 py-4 font-bold">Order ID</th>
              <th className="px-6 py-4 font-bold">TRAPAY ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-xs">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
                      <CreditCard size={20} className="text-text-dim" />
                    </div>
                    <p className="text-sm font-medium text-text-muted">{loading ? t('adminTx.processing') : t('adminTx.noOnline', 'No online deposits yet')}</p>
                  </div>
                </td>
              </tr>
            ) : rows.map(d => (
              <tr key={d.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => openDetails(d.id)}>
                <td className="px-6 py-4 text-text-dim">{d.created_at ? new Date(d.created_at).toLocaleString() : '—'}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-text font-sans">{d.users?.full_name || d.users?.display_name || '—'}</p>
                  <p className="text-[10px] text-text-dim mt-0.5">{d.users?.email || '—'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-text font-bold">${Number(d.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-text-dim">{d.currency}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-surface border border-border text-text-muted">
                    {methodLabel(d.method)}
                  </span>
                </td>
                <td className="px-6 py-4 font-sans">{statusBadge(d.status)}</td>
                <td className="px-6 py-4 text-gold/70">{d.order_id}</td>
                <td className="px-6 py-4 text-text-dim">{d.provider_payment_id || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details dialog */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedId(null)}>
          <div className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 border border-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-serif text-lg font-light italic text-text">{t('adminTx.onlineDetails', 'Online Deposit Details')}</h4>
              <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {detailsLoading || !details ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-gold animate-spin" /></div>
            ) : (
              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  {([
                    ['Customer', details.users?.full_name || details.users?.display_name || '—'],
                    ['Email', details.users?.email || '—'],
                    ['Amount', `${Number(details.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${details.currency}`],
                    ['Method', methodLabel(details.method)],
                    ['Status', details.status],
                    ['TRAPAY status', details.provider_status || '—'],
                    ['TRAPAY payment ID', details.provider_payment_id || '—'],
                    ['Order ID', details.order_id],
                    ['Created', details.created_at ? new Date(details.created_at).toLocaleString() : '—'],
                    ['Updated', details.updated_at ? new Date(details.updated_at).toLocaleString() : '—'],
                    ['Paid', details.paid_at ? new Date(details.paid_at).toLocaleString() : '—'],
                    ['Paid via', details.paid_source || '—'],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 border-b border-border/60 pb-1.5">
                      <span className="text-text-dim">{label}</span>
                      <span className="font-mono text-text-muted text-right break-all">{value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">{t('adminTx.eventHistory', 'Provider event history')}</p>
                  {details.events.length === 0 ? (
                    <p className="text-xs text-text-dim italic">{t('adminTx.noEvents', 'No TRAPAY events recorded')}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {details.events.map(ev => (
                        <div key={ev.id} className="flex flex-wrap items-center gap-2 text-[11px] font-mono bg-surface border border-border rounded-lg px-3 py-2">
                          <span className="text-text-dim">{new Date(ev.received_at).toLocaleString()}</span>
                          <span className="text-text-muted">{ev.provider_status || ev.event_type || 'event'}</span>
                          <span className={`px-1.5 rounded text-[9px] font-bold uppercase ${ev.verified ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                            {ev.verified ? 'verified' : 'unverified'}
                          </span>
                          {ev.error && <span className="text-danger/80">{ev.error}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {details.audit.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">{t('adminTx.auditHistory', 'Audit history')}</p>
                    <div className="space-y-1.5">
                      {details.audit.map(a => (
                        <div key={a.id} className="flex flex-wrap items-center gap-2 text-[11px] font-mono bg-surface border border-border rounded-lg px-3 py-2">
                          <span className="text-text-dim">{new Date(a.created_at).toLocaleString()}</span>
                          <span className="text-text-muted">{a.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {details.capabilities?.canMarkPaid && (
                  <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-warning">
                      {t('adminTx.manualSettlement', 'Manual settlement — exceptional fallback')}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {t('adminTx.settleHint', `Verify payment ${details.provider_payment_id ?? ''} in the TRAPAY merchant dashboard first. Manual credit is audited with your admin id and IP.`)}
                    </p>
                    <div className="flex justify-between text-xs font-mono text-text-muted border-b border-border/60 pb-1.5">
                      <span className="text-text-dim">{t('adminTx.settleAmount', 'Amount to credit')}</span>
                      <span>{Number(details.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {details.currency} · {details.order_id}</span>
                    </div>
                    <input
                      value={settleForm.providerPaymentId}
                      onChange={e => setSettleForm(f => ({ ...f, providerPaymentId: e.target.value }))}
                      placeholder="TRAPAY payment ID"
                      className="input-dark w-full text-xs font-mono"
                    />
                    <textarea
                      value={settleForm.reason}
                      onChange={e => setSettleForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder={t('adminTx.settleReason', 'Reason (min 10 characters) — e.g. verified in TRAPAY dashboard, ticket #…')}
                      className="input-dark w-full text-xs h-16 resize-none"
                    />
                    <label className="flex items-start gap-2 text-[11px] text-text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settleForm.confirmed}
                        onChange={e => setSettleForm(f => ({ ...f, confirmed: e.target.checked }))}
                        className="mt-0.5 accent-[#d4af37]"
                      />
                      {MANUAL_SETTLEMENT_CONFIRMATION}
                    </label>
                    <button
                      onClick={markPaid}
                      disabled={marking || !settleReady}
                      className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {marking ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {t('adminTx.markPaid', 'Mark as Paid — credit customer balance')}
                    </button>
                  </div>
                )}

                {details.capabilities?.canCancel && (
                  <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                    {cancelForm.open ? (
                      <>
                        <textarea
                          value={cancelForm.reason}
                          onChange={e => setCancelForm(f => ({ ...f, reason: e.target.value }))}
                          placeholder={t('adminTx.cancelReason', 'Why is this deposit being cancelled? (min 10 characters)')}
                          className="input-dark w-full text-xs h-16 resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={cancelDeposit} disabled={marking || cancelForm.reason.trim().length < 10} className="px-4 py-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 font-bold text-[10px] uppercase transition-all disabled:opacity-40">
                            {t('adminTx.confirmCancel', 'Confirm cancel')}
                          </button>
                          <button onClick={() => setCancelForm({ open: false, reason: '' })} className="px-4 py-2 rounded-lg border border-border text-text-muted font-bold text-[10px] uppercase transition-all">
                            {t('adminTx.cancelCancel', 'Keep deposit')}
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => setCancelForm({ open: true, reason: '' })}
                        className="px-4 py-2 rounded-lg border border-border text-text-muted hover:text-text hover:border-border-strong font-bold text-[10px] uppercase transition-all"
                      >
                        {t('adminTx.cancelDeposit', 'Cancel deposit (no balance change)')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Page shell with tabs ────────────────────────────────────────────────────
export const AdminDeposits = () => {
  const { t } = useTranslation(['common']);
  const [tab, setTab] = useState<'manual' | 'online'>('manual');
  const [requests, setRequests]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [formOpen, setFormOpen]       = useState(false);
  const [selectedTx, setSelectedTx]   = useState<any>(null);

  const deposits = requests.filter(r => r.type === 'Deposit');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id: string, status: TxStatus) => {
    try {
      if (status === 'Completed') {
        // Atomic approve+credit via DB function — prevents double-credit under concurrent requests
        const { data: result, error: rpcErr } = await supabase.rpc('approve_deposit', {
          p_transaction_id: id,
        });
        if (rpcErr) throw rpcErr;

        const res = result as { ok: boolean; error?: string; amount?: number };
        if (!res.ok) {
          if (res.error === 'already_approved') {
            toast.info('Deposit already approved — balance unchanged');
          } else {
            throw new Error(res.error ?? 'Approval failed');
          }
          return;
        }

        toast.success(`Deposit approved — $${Number(res.amount ?? 0).toLocaleString()} credited to client`);
      } else {
        // Reject / other statuses — never touch the balance
        const { error } = await supabase.from('transactions').update({ status }).eq('id', id);
        if (error) throw error;
        toast.success(t('adminTx.toastUpdated', 'Request updated successfully'));
      }

      fetchRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('adminTx.toastFailed', 'Failed to update request'));
    }
  };

  const openForm = (req: any) => {
    setSelectedTx(req);
    setFormOpen(true);
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-text flex items-center gap-3">
            <Download className="text-success" size={22} /> {t('adminTx.depositsTitle')}
          </h2>
          <p className="text-sm text-text-muted mt-1">{t('adminTx.depositsDesc')}</p>
        </div>
        {tab === 'manual' && (
          <button onClick={fetchRequests} className="p-2 border border-border rounded-xl text-text-muted hover:text-text hover:border-border-strong transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      <div className="flex gap-2 bg-surface p-1 rounded-xl w-fit border border-border mb-6">
        {([
          ['manual', t('adminTx.manualTab', 'Manual Requests')],
          ['online', t('adminTx.onlineTab', 'Online (TRAPAY)')],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === key
                ? 'bg-gold text-black shadow-[0_2px_12px_rgba(212,175,55,0.3)]'
                : 'text-text-muted hover:text-text hover:bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'online' ? (
        <OnlineDepositsTab />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold text-text-dim uppercase tracking-widest bg-surface/60">
                <th className="px-6 py-4 font-bold">{t('adminTx.columns.user')}</th>
                <th className="px-6 py-4 font-bold">{t('adminTx.columns.amount')}</th>
                <th className="px-6 py-4 font-bold">{t('method')}</th>
                <th className="px-6 py-4 font-bold">{t('adminTx.columns.status')}</th>
                <th className="px-6 py-4 font-bold">Payment Details</th>
                <th className="px-6 py-4 font-bold">{t('date')}</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-xs">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
                        <Users size={20} className="text-text-dim" />
                      </div>
                      <p className="text-sm font-medium text-text-muted">
                        {loading ? t('adminTx.processing') : t('adminTx.noPending')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : deposits.map(req => (
                <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-text font-sans">{req.user_name || '—'}</p>
                    <p className="text-[10px] text-text-dim mt-0.5">{req.user_email || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-text font-bold">${Number(req.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-text-dim">{req.currency || 'USD'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-surface border border-border text-text-muted">
                      {req.method || 'Other'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter inline-block ${
                      req.status === 'Completed' || req.status === 'Approved' ? 'bg-success/10 text-success' :
                      req.status === 'Pending'   ? 'bg-warning/10 text-warning' :
                      req.status === 'Rejected'  ? 'bg-danger/10 text-danger'  :
                      'bg-info/10 text-info'
                    }`}>{t(`${req.status.toLowerCase()}`) || req.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    {req.payment_details ? (
                      <PaymentDetailsSentBadge
                        details={req.payment_details as PaymentDetails}
                        accentColor="text-success"
                      />
                    ) : (
                      <button
                        onClick={() => openForm(req)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20 font-bold text-[10px] uppercase tracking-wider transition-all"
                      >
                        <Send size={10} /> Send Details
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-text-dim">
                    {req.created_at ? new Date(req.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleAction(req.id, 'Completed')} className="px-3 py-1 rounded bg-success/10 text-success hover:bg-success/20 font-bold text-[10px] uppercase transition-all">
                      {t('adminTx.approve')}
                    </button>
                    <button onClick={() => handleAction(req.id, 'Rejected')} className="px-3 py-1 rounded bg-danger/10 text-danger hover:bg-danger/20 font-bold text-[10px] uppercase transition-all">
                      {t('adminTx.reject')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTx && tab === 'manual' && (
        <PaymentDetailsForm
          isOpen={formOpen}
          onClose={() => { setFormOpen(false); setSelectedTx(null); }}
          transactionId={selectedTx.id}
          txType="Deposit"
          clientName={selectedTx.user_name || selectedTx.user_email || 'Client'}
          amount={Number(selectedTx.amount || 0)}
          method={selectedTx.method}
          onSent={fetchRequests}
        />
      )}
    </div>
  );
};
