import React, { useEffect, useState, useCallback } from 'react';
import { Users, Activity, ShieldAlert, Server, Globe2, AlertTriangle, Zap, Bell, CheckCircle2, ArrowDownRight, ArrowUpRight, Clock, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface Metrics {
  totalUsers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  volumeToday: number;
  pendingKyc: number;
}

interface TxEvent {
  id: string;
  type: string;
  status: string;
  amount: number;
  user_name: string | null;
  user_email: string | null;
  created_at: string;
}

const statusIcon = (s: string) => {
  if (s === 'Completed' || s === 'Approved') return <CheckCircle2 size={11} className="text-emerald-400" />;
  if (s === 'Rejected') return <XCircle size={11} className="text-rose-400" />;
  return <Clock size={11} className="text-orange-400" />;
};

const statusColor = (s: string) =>
  s === 'Completed' || s === 'Approved' ? 'text-emerald-400' :
  s === 'Rejected' ? 'text-rose-400' :
  s === 'Pending'  ? 'text-orange-400' : 'text-blue-400';

export const AdminOverview = () => {
  const { t } = useTranslation(['common', 'crm']);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [events,  setEvents]  = useState<TxEvent[]>([]);
  const [alerts,  setAlerts]  = useState<{ label: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, pendingKycRes, txRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('kyc_status', 'PENDING'),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      const allTx: TxEvent[] = txRes.data || [];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const volumeToday = allTx
        .filter(t => new Date(t.created_at) >= todayStart && (t.status === 'Completed' || t.status === 'Approved'))
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      const pendingDeposits    = allTx.filter(tx => tx.type === 'Deposit'    && tx.status === 'Pending').length;
      const pendingWithdrawals = allTx.filter(tx => tx.type === 'Withdrawal' && tx.status === 'Pending').length;

      setMetrics({ totalUsers: usersRes.count ?? 0, pendingDeposits, pendingWithdrawals, volumeToday, pendingKyc: pendingKycRes.count ?? 0 });
      setEvents(allTx.slice(0, 15));

      const newAlerts: { label: string; count: number }[] = [];
      if ((pendingKycRes.count ?? 0) > 0)
        newAlerts.push({ label: t('adminDashboard.alerts.kycAlert'),   count: pendingKycRes.count! });
      if (pendingDeposits > 0)
        newAlerts.push({ label: t('pending') + ' ' + t('deposits'),    count: pendingDeposits });
      if (pendingWithdrawals > 0)
        newAlerts.push({ label: t('pending') + ' ' + t('withdrawals'), count: pendingWithdrawals });
      setAlerts(newAlerts);
    } catch {
      // keep previous state on error
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
    const iv = window.setInterval(fetchData, 20000);
    return () => window.clearInterval(iv);
  }, [fetchData]);

  const metricCards = [
    { label: t('adminDashboard.cards.totalUsers'),         value: metrics?.totalUsers?.toLocaleString() ?? '…', sub: t('adminDashboard.cards.registeredAccounts'), icon: Users,      color: 'text-blue-400' },
    { label: t('adminDashboard.cards.volumeToday'),        value: metrics ? `$${metrics.volumeToday.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '…', sub: t('adminDashboard.cards.completedTx'), icon: Activity, color: 'text-accent-primary' },
    { label: t('pending') + ' ' + t('deposits'),    value: metrics?.pendingDeposits?.toString()    ?? '…', sub: t('adminDashboard.cards.awaitingReview'), icon: ShieldAlert, color: metrics?.pendingDeposits    ? 'text-orange-400' : 'text-emerald-500' },
    { label: t('pending') + ' ' + t('withdrawals'), value: metrics?.pendingWithdrawals?.toString() ?? '…', sub: t('adminDashboard.cards.awaitingReview'), icon: Server,      color: metrics?.pendingWithdrawals ? 'text-rose-400'   : 'text-emerald-500' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300 relative">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/6 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/4 blur-[140px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between relative">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-1.5 bg-gradient-to-b from-rose-500 to-rose-700 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.7)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-rose-400/90">Control Center</span>
          </div>
          <h2 className="font-serif text-4xl font-light italic tracking-tight text-text">{t('adminDashboard.tabs.overview')}</h2>
          <p className="text-sm text-text-dim font-mono flex items-center gap-2 mt-2 ml-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            {t('adminDashboard.sysStatus')} LIVE DATA
          </p>
        </div>
        <button onClick={fetchData} className="p-2.5 border border-border rounded-xl text-text-muted hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Metric cards — premium with LEFT gold accent bar + hover lift */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {metricCards.map((m, i) => (
          <div
            key={i}
            className="relative group p-6 pl-7 rounded-2xl glass-card border-white/[0.08] hover:border-gold/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            style={{ boxShadow: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 16px 40px -8px rgba(0,0,0,0.6)' }}
          >
            {/* LEFT gold accent bar — VISIBLE luxury signature */}
            <div className="absolute left-0 top-6 bottom-6 w-1 bg-gradient-to-b from-gold via-gold/60 to-transparent rounded-r-full shadow-[0_0_12px_rgba(212,175,55,0.5)] group-hover:shadow-[0_0_18px_rgba(212,175,55,0.8)] transition-all" />
            {/* Top hairline */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            {/* Hover gold glow */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ boxShadow: '0 0 32px rgba(212,175,55,0.12), inset 0 0 24px rgba(212,175,55,0.04)' }}
            />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-white/5 ${m.color} w-fit ring-1 ring-white/10`}>
                  <m.icon size={20} />
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-gold/50 group-hover:bg-gold group-hover:shadow-[0_0_10px_rgba(212,175,55,0.8)] transition-all" />
              </div>
              <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-[0.2em] mb-2">{m.label}</h4>
              <p className="text-4xl font-bold font-mono text-white mb-1 tracking-tight">{m.value}</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Live event stream */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="glass-card flex flex-col h-[420px]">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Zap size={16} className="text-rose-500" /> {t('adminDashboard.feed.title')}
              </h3>
              <span className="text-[10px] text-text-dim font-mono">{t('adminDashboard.feed.events', { count: events.length })}</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
              {events.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-text-dim">{t('adminDashboard.feed.noTx')}</p>
                </div>
              ) : events.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className={`shrink-0 p-1.5 rounded-lg ${ev.type === 'Deposit' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                    {ev.type === 'Deposit'
                      ? <ArrowDownRight size={12} className="text-emerald-400" />
                      : <ArrowUpRight   size={12} className="text-rose-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{ev.user_name || ev.user_email || t('adminDashboard.feed.unknown')}</p>
                    <p className="text-[10px] text-text-dim font-mono">{t(`${ev.type.toLowerCase()}s`) || ev.type} · ${Number(ev.amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {statusIcon(ev.status)}
                    <span className={`text-[10px] font-bold ${statusColor(ev.status)}`}>{t(`${ev.status.toLowerCase()}`) || ev.status}</span>
                  </div>
                  <span className="text-[9px] text-text-dim font-mono shrink-0 w-20 text-right">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 relative overflow-hidden min-h-[150px] flex flex-col justify-center">
            <Globe2 size={80} className="text-white/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="relative z-10 w-full">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest text-left mb-4">{t('adminDashboard.nodes.title')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['EU_WEST_1', 'US_EAST_2', 'AP_SOUTHEAST_1'].map(node => (
                  <div key={node} className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mb-1">{node}</p>
                    <p className="text-emerald-500 text-xs font-mono font-bold">STABLE</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: alerts + KYC summary */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="glass-card p-6 border-orange-500/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" /> {t('adminDashboard.alerts.title')}
            </h3>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-5 text-center border border-white/5 rounded-xl">
                  <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs text-text-dim">{t('adminDashboard.alerts.allClear')}</p>
                </div>
              ) : alerts.map((al, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-orange-500/20 bg-orange-500/5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                    <AlertTriangle size={13} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">{al.label}</p>
                    <p className="text-[10px] text-orange-400">{t(al.count === 1 ? 'adminDashboard.alerts.itemsNeedAttention_one' : 'adminDashboard.alerts.itemsNeedAttention_other', { count: al.count })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 border-blue-500/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Bell size={16} className="text-blue-500" /> {t('adminDashboard.cards.pendingKyc')}
            </h3>
            <div className="space-y-2">
              {[
                { label: t('adminDashboard.cards.pendingKyc'), value: metrics?.pendingKyc ?? '…', color: metrics?.pendingKyc ? 'text-orange-400' : 'text-emerald-400' },
                { label: t('adminDashboard.cards.totalUsers'), value: metrics?.totalUsers ?? '…', color: 'text-white' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-[10px] text-text-dim uppercase tracking-wider">{row.label}</span>
                  <span className={`text-sm font-bold font-mono ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
