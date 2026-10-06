import { useState, useEffect, useCallback, useRef } from "react";
import type { ChangeEvent } from "react";
import type { BalanceFlashDirection } from "../hooks/useClients";
import { useI18n } from "../lib/i18n";
import {
  Search, Phone, Mail, Globe, Loader2, AlertCircle, RefreshCw,
  DollarSign, User, TrendingUp, ArrowDownLeft, ArrowUpRight, X, WifiOff,
  Upload, FileText, Download, Trash2, Paperclip
} from "lucide-react";
import { supabase } from "../../../lib/supabase/browserClient";
import { usePhoneDialer } from "../contexts/PhoneDialerContext";
import { fetchClientTransactions, type ClientTransaction } from "../hooks/useClients";
import { useClientFiles, validateFile, ACCEPTED_EXTENSIONS } from "../hooks/useClientFiles";
import { authStorage } from "../lib/auth";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

// Roles allowed to view & manage client file attachments.
// 'superadmin' is forward-compat only (not a real role in the DB yet).
const CLIENT_FILE_ROLES = ['superadmin', 'admin', 'director', 'manager'];
function canManageClientFiles(): boolean {
  return CLIENT_FILE_ROLES.includes((authStorage.getRole() || '').toLowerCase());
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB'];
  let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface AgentClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  totalBalance: number;
  kyc_status: string;
  createdAt: string;
  tier: 'Titanium' | 'Platinum' | 'Silver';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function mapRow(u: any): AgentClient {
  const fn = u.first_name?.trim() || (u.full_name || u.email.split('@')[0]).trim().split(/\s+/)[0] || '';
  const ln = u.last_name?.trim()  || (u.full_name || '').trim().split(/\s+/).slice(1).join(' ') || '';
  const balance = Number(u.balance) || 0;
  const tier: AgentClient['tier'] =
    balance >= 100_000 ? 'Titanium' :
    balance >= 10_000  ? 'Platinum' : 'Silver';
  return {
    id: u.id, firstName: fn, lastName: ln, email: u.email,
    phone: u.phone ?? null, country: u.country ?? null,
    totalBalance: balance, kyc_status: u.kyc_status ?? 'PENDING',
    createdAt: u.created_at, tier,
  };
}

// ── Client Files Tab ──────────────────────────────────────────────────────────

function ClientFilesTab({ clientId }: { clientId: string }) {
  const { files, loading, error, uploadFile, deleteFile } = useClientFiles(clientId);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) { setLocalError(validationError); return; }

    setLocalError(null);
    setUploading(true);
    try {
      await uploadFile(file);
    } catch (err: any) {
      setLocalError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    setBusyId(id);
    setLocalError(null);
    try {
      await deleteFile(id);
    } catch (err: any) {
      setLocalError(err?.message || 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={onPick}
        className="hidden"
      />
      <Button
        variant="outline"
        size="md"
        className="w-full"
        isLoading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {!uploading && <Upload className="w-3.5 h-3.5" />}
        {uploading ? 'Uploading…' : 'Upload File'}
      </Button>

      <p className="text-[9px] text-aura-platinum/30 text-center">
        PDF, images, Office docs · max 15 MB
      </p>

      {(localError || error) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-aura-ruby/10 border border-aura-ruby/20 text-aura-ruby text-[10px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{localError || error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-aura-gold animate-spin" /></div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Paperclip className="w-8 h-8 text-aura-platinum/10" />
          <span className="text-xs text-aura-platinum/30">No files attached</span>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-glass-border">
              <FileText className="w-4 h-4 text-aura-gold shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-aura-platinum truncate">{f.file_name}</div>
                <div className="text-[9px] text-aura-platinum/40">
                  {formatBytes(f.size_bytes)} · {new Date(f.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </div>
              </div>
              {f.signed_url && (
                <a
                  href={f.signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-white/5 text-aura-platinum/40 hover:text-aura-gold transition-colors"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => onDelete(f.id)}
                disabled={busyId === f.id}
                className="p-1.5 rounded-lg hover:bg-white/5 text-aura-platinum/40 hover:text-aura-ruby transition-colors disabled:opacity-40"
                title="Delete"
              >
                {busyId === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Client Drawer (no KYC tab) ────────────────────────────────────────────────

type DrawerTab = 'overview' | 'transactions' | 'files';

function ClientDrawer({ client, onClose }: { client: AgentClient | null; onClose: () => void }) {
  const { t } = useI18n();
  const { openDialer } = usePhoneDialer();
  const showFiles = canManageClientFiles();
  const TABS: DrawerTab[] = showFiles ? ['overview', 'transactions', 'files'] : ['overview', 'transactions'];
  const [tab, setTab] = useState<DrawerTab>('overview');
  const [txList, setTxList] = useState<ClientTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    setTab('overview');
    setTxList([]);
  }, [client?.id]);

  useEffect(() => {
    if (tab !== 'transactions' || !client) return;
    setTxLoading(true);
    fetchClientTransactions(client.id)
      .then(setTxList)
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, [tab, client?.id]);

  if (!client) return null;
  const clientName = `${client.firstName} ${client.lastName}`.trim();

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${client ? '' : 'pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card-l border-glass-border flex flex-col h-full overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-aura-gold/20 to-transparent border border-aura-gold/20 flex items-center justify-center text-sm font-bold text-aura-gold">
              {client.firstName.charAt(0)}{client.lastName.charAt(0) || ''}
            </div>
            <div>
              <div className="text-sm font-semibold text-aura-platinum">{clientName || client.email}</div>
              <div className="text-[10px] text-aura-gold uppercase tracking-widest">{client.tier}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-aura-platinum/40 hover:text-aura-platinum transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-glass-border">
          {TABS.map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                tab === tb ? 'text-aura-gold border-b-2 border-aura-gold -mb-px bg-aura-gold/5' : 'text-aura-platinum/40 hover:text-aura-platinum'
              }`}>
              {tb}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Contact info */}
              <div className="space-y-3">
                {client.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-glass-border">
                    <Phone className="w-4 h-4 text-aura-emerald shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-aura-platinum/40 uppercase tracking-wider">{t('agcPhone')}</div>
                      <div className="text-xs font-mono text-aura-platinum">{client.phone}</div>
                    </div>
                    <button
                      onClick={() => openDialer({ phone: client.phone!, name: clientName, clientId: client.id })}
                      className="px-3 py-1.5 rounded-lg bg-aura-emerald/10 border border-aura-emerald/20 text-aura-emerald text-[10px] font-bold hover:bg-aura-emerald/20 transition-colors"
                    >
                      Call
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-glass-border">
                  <Mail className="w-4 h-4 text-aura-platinum/40 shrink-0" />
                  <div>
                    <div className="text-[9px] text-aura-platinum/40 uppercase tracking-wider">{t('email')}</div>
                    <div className="text-xs text-aura-platinum">{client.email}</div>
                  </div>
                </div>
                {client.country && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-glass-border">
                    <Globe className="w-4 h-4 text-aura-platinum/40 shrink-0" />
                    <div>
                      <div className="text-[9px] text-aura-platinum/40 uppercase tracking-wider">{t('agcCountry')}</div>
                      <div className="text-xs text-aura-platinum">{client.country}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-black/40 border border-aura-gold/20">
                  <div className="text-[9px] text-aura-platinum/40 uppercase tracking-wider mb-1">{t('agcBalance')}</div>
                  <div className="text-lg font-light font-mono text-aura-gold">{fmt(client.totalBalance)}</div>
                </div>
                <div className="p-4 rounded-lg bg-black/40 border border-glass-border">
                  <div className="text-[9px] text-aura-platinum/40 uppercase tracking-wider mb-1">{t('agcKyc')}</div>
                  <Badge variant={client.kyc_status === 'VERIFIED' ? 'success' : client.kyc_status === 'REJECTED' ? 'danger' : 'warning'}>
                    {client.kyc_status}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-glass-border">
                <div className="text-[9px] text-aura-platinum/40 uppercase tracking-wider mb-1">{t('agcRegistered')}</div>
                <div className="text-xs text-aura-platinum">{new Date(client.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
              </div>
            </div>
          )}

          {tab === 'transactions' && (
            txLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-aura-gold animate-spin" /></div>
            ) : txList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <TrendingUp className="w-8 h-8 text-aura-platinum/10" />
                <span className="text-xs text-aura-platinum/30">{t('agcNoTx')}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {txList.map(tx => {
                  const isDeposit = tx.type === 'DEPOSIT';
                  const isWithdrawal = tx.type === 'WITHDRAWAL';
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-glass-border">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDeposit ? 'bg-aura-emerald/10' : isWithdrawal ? 'bg-aura-ruby/10' : 'bg-aura-platinum/5'}`}>
                          {isDeposit ? <ArrowDownLeft className="w-4 h-4 text-aura-emerald" /> :
                           isWithdrawal ? <ArrowUpRight className="w-4 h-4 text-aura-ruby" /> :
                           <TrendingUp className="w-4 h-4 text-aura-gold" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-aura-platinum uppercase">{tx.type}</div>
                          <div className="text-[9px] text-aura-platinum/40">{new Date(tx.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-mono font-bold ${isDeposit ? 'text-aura-emerald' : isWithdrawal ? 'text-aura-ruby' : 'text-aura-platinum'}`}>
                          {isDeposit ? '+' : isWithdrawal ? '−' : ''}{fmt(tx.amount)}
                        </div>
                        <div className={`text-[9px] uppercase ${tx.status === 'COMPLETED' || tx.status === 'APPROVED' ? 'text-aura-emerald' : tx.status === 'FAILED' || tx.status === 'REJECTED' ? 'text-aura-ruby' : tx.status === 'PROCESSING' ? 'text-blue-400' : 'text-yellow-400'}`}>{tx.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tab === 'files' && showFiles && (
            <ClientFilesTab clientId={client.id} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AgentClients() {
  const { t } = useI18n();
  const { openDialer } = usePhoneDialer();
  const [clients, setClients]     = useState<AgentClient[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<AgentClient | null>(null);
  const [flashMap, setFlashMap]       = useState<Record<string, BalanceFlashDirection>>({});
  const [reconnecting, setReconnecting] = useState(false);
  const flashTimers                   = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const retryTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef                    = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const destroyed                     = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let q = supabase
        .from('users')
        .select('id, email, full_name, first_name, last_name, phone, country, balance, kyc_status, created_at')
        .eq('role', 'client')
        .eq('assigned_agent_id', user.id)
        .order('created_at', { ascending: false });

      if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);

      const { data, error: dbErr } = await q;
      if (dbErr) throw new Error(dbErr.message);
      setClients((data ?? []).map(mapRow));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timers = flashTimers.current;
    destroyed.current = false;

    function handlePayload(payload: any) {
      const updated = payload.new as any;
      if (updated.role !== 'client') return;
      setClients(prev => {
        const idx = prev.findIndex(c => c.id === updated.id);
        if (idx === -1) return prev;
        const oldBalance = prev[idx].totalBalance;
        const newBalance = Number(updated.balance) || 0;
        if (newBalance !== oldBalance) {
          const direction: BalanceFlashDirection = newBalance > oldBalance ? 'up' : 'down';
          setFlashMap(m => ({ ...m, [updated.id]: direction }));
          if (timers[updated.id]) clearTimeout(timers[updated.id]);
          timers[updated.id] = setTimeout(() => {
            setFlashMap(m => {
              const next = { ...m };
              delete next[updated.id];
              return next;
            });
          }, 1500);
        }
        const next = [...prev];
        next[idx] = mapRow(updated);
        return next;
      });
      setSelected(prev => {
        if (!prev || prev.id !== updated.id) return prev;
        return mapRow(updated);
      });
    }

    function subscribe() {
      if (destroyed.current) return;

      const ch = supabase
        .channel(`crm-agentClients-balance-${Math.random().toString(36).substring(2, 9)}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users' },
          handlePayload
        )
        .subscribe((status) => {
          if (destroyed.current) return;
          if (status === 'SUBSCRIBED') {
            setReconnecting(false);
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            setReconnecting(true);
            if (retryTimer.current) clearTimeout(retryTimer.current);
            retryTimer.current = setTimeout(() => {
              if (destroyed.current) return;
              supabase.removeChannel(ch).catch(() => {});
              subscribe();
            }, 3000);
          }
        });

      channelRef.current = ch;
    }

    subscribe();

    return () => {
      destroyed.current = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current).catch(() => {});
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const total      = clients.length;
  const totalBal   = clients.reduce((s, c) => s + c.totalBalance, 0);
  const newClients = clients.filter(c => Date.now() - new Date(c.createdAt).getTime() < 48 * 3600_000).length;

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="border-b border-glass-border pb-4">
        <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t('agcTitle')}</h2>
        <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t('agcSubtitle')}</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('agcTotalClients'), value: String(total),      sub: `${newClients} new this 48h`, icon: User,       color: 'text-aura-platinum' },
          { label: t('agcTotalBalance'), value: fmt(totalBal),    sub: t('agcAcrossAll'),             icon: DollarSign, color: 'text-aura-gold' },
          { label: t('agcWithPhone'),    value: String(clients.filter(c => c.phone).length), sub: t('agcCanBeCalled'), icon: Phone, color: 'text-aura-emerald' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-glass-border bg-gradient-to-b from-white/5 to-transparent p-5 hover:border-aura-gold/20 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <k.icon className={`w-4 h-4 ${k.color} opacity-50`} />
              <div className="text-[10px] uppercase tracking-[0.2em] text-aura-platinum/40">{k.label}</div>
            </div>
            <div className={`text-2xl font-light font-mono ${k.color}`}>{k.value}</div>
            <div className="text-[10px] text-aura-platinum/30 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Search + refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-aura-platinum/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('agcSearchPlaceholder')}
            className="w-full bg-black/40 border border-glass-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-aura-platinum placeholder:text-aura-platinum/30 outline-none focus:border-aura-gold/40 transition-colors" />
        </div>
        {reconnecting && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <WifiOff className="w-3 h-3" /> {t('agcReconnecting')}
          </div>
        )}
        <button onClick={load} disabled={loading}
          className="p-2.5 rounded-xl border border-glass-border glass-card hover:bg-white/5 text-aura-platinum/40 hover:text-aura-platinum transition-colors disabled:opacity-30">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="p-4 rounded-xl border border-aura-ruby/30 bg-aura-ruby/5 text-aura-ruby text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-xl border border-glass-border glass-card p-5 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-3/4 mb-3" />
              <div className="h-3 bg-white/5 rounded w-1/2 mb-5" />
              <div className="h-8 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-glass-border glass-card py-20 flex flex-col items-center gap-3">
          <User className="w-10 h-10 text-aura-platinum/10" />
          <p className="text-sm text-aura-platinum/30">{search ? t('agcNoMatch') : t('agcNoneAssigned')}</p>
          <p className="text-xs text-aura-platinum/20">{t('agcAskManager')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(c => {
            const name  = `${c.firstName} ${c.lastName}`.trim() || c.email;
            const init  = `${c.firstName.charAt(0)}${c.lastName.charAt(0)}`.toUpperCase() || c.email.charAt(0).toUpperCase();
            const isNew = Date.now() - new Date(c.createdAt).getTime() < 48 * 3600_000;
            return (
              <div key={c.id}
                onClick={() => setSelected(c)}
                className={`rounded-xl border glass-card p-5 cursor-pointer group relative transition-all duration-200 hover:bg-white/5 ${
                  isNew ? 'border-aura-emerald/40 hover:border-aura-emerald/60' : 'border-glass-border hover:border-aura-gold/20'
                }`}>
                {isNew && (
                  <div className="absolute top-0 left-0 bg-aura-emerald text-black text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-br flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-black animate-pulse" /> {t('agcNew')}
                  </div>
                )}

                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-aura-gold/20 to-transparent border border-aura-gold/20 flex items-center justify-center text-[11px] font-bold text-aura-gold shrink-0">{init}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-aura-platinum truncate">{name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${c.tier === 'Titanium' ? 'text-aura-gold' : c.tier === 'Platinum' ? 'text-aura-platinum/70' : 'text-aura-platinum/40'}`}>{c.tier}</span>
                      {c.country && <><span className="text-aura-platinum/20">·</span><span className="text-[9px] text-aura-platinum/40">{c.country}</span></>}
                    </div>
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className={`bg-black/40 rounded p-2 border border-aura-gold/10 transition-all duration-300 ${flashMap[c.id] === 'up' ? 'balance-flash-up' : flashMap[c.id] === 'down' ? 'balance-flash-down' : ''}`}>
                    <div className="text-[8px] text-aura-platinum/40 uppercase tracking-wider">Balance</div>
                    <div className="font-mono text-aura-gold font-medium mt-0.5">{fmt(c.totalBalance)}</div>
                  </div>
                  <div className="bg-black/40 rounded p-2 border border-glass-border">
                    <div className="text-[8px] text-aura-platinum/40 uppercase tracking-wider">KYC</div>
                    <div className={`text-[10px] font-bold mt-0.5 ${c.kyc_status === 'VERIFIED' ? 'text-aura-emerald' : c.kyc_status === 'REJECTED' ? 'text-aura-ruby' : 'text-yellow-400'}`}>{c.kyc_status}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-glass-border pt-3" onClick={e => e.stopPropagation()}>
                  <button
                    disabled={!c.phone}
                    onClick={() => c.phone && openDialer({ phone: c.phone, name, clientId: c.id })}
                    title={c.phone || 'No phone'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-glass-border glass-card text-[10px] font-bold text-aura-platinum/60 hover:bg-aura-emerald/10 hover:border-aura-emerald/30 hover:text-aura-emerald transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Phone className="w-3 h-3" /> {c.phone ? t('call') : t('agcNoPhone')}
                  </button>
                  <button
                    onClick={() => setSelected(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-glass-border glass-card text-[10px] font-bold text-aura-platinum/60 hover:bg-white/5 hover:text-aura-platinum transition-all"
                  >
                    {t('agcView')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ClientDrawer client={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
