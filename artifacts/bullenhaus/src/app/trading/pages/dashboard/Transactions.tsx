import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PaymentDetailsDisplay } from '../../components/payment/PaymentDetailsDisplay';
import type { PaymentDetails } from '../../components/admin/PaymentDetailsForm';

export const Transactions = () => {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setRows(data || []);
    } catch {
      // silently keep previous rows
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    const iv = window.setInterval(loadTransactions, 8000);
    return () => window.clearInterval(iv);
  }, []);

  const filtered = rows.filter(r => {
    if (filter === 'Deposits'   && r.type !== 'Deposit')    return false;
    if (filter === 'Withdrawals' && r.type !== 'Withdrawal') return false;
    if (search && !`${r.id} ${r.type} ${r.method} ${r.status}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusColor = (s: string) => {
    if (s === 'Completed' || s === 'Approved') return 'bg-emerald-500/10 text-emerald-500';
    if (s === 'Pending')    return 'bg-orange-500/10 text-orange-500';
    if (s === 'Processing') return 'bg-blue-500/10 text-blue-500';
    if (s === 'Rejected')   return 'bg-rose-500/10 text-rose-500';
    return 'bg-slate-500/10 text-slate-500';
  };

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl font-light italic tracking-tight text-text">{t('transactions')}</h1>
          <button onClick={loadTransactions} className="p-2 border border-border rounded-xl text-text-muted hover:text-text transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-6">
          <div className="md:col-span-8 flex gap-2 bg-surface p-1 rounded-xl w-fit border border-border">
            {['All', 'Deposits', 'Withdrawals'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-gold text-black shadow-[0_2px_12px_rgba(212,175,55,0.3)]'
                    : 'text-text-muted hover:text-text hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="md:col-span-4 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-dark py-2 pl-9 text-xs w-full"
            />
          </div>
        </div>

        <div className="glass-card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold text-text-dim uppercase tracking-widest bg-surface/60">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment Details</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Ref</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
                        <ArrowDownLeft size={20} className="text-text-dim" />
                      </div>
                      <p className="text-sm font-medium text-text-muted">
                        {loading ? 'Loading...' : 'No transactions yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(tx => {
                const isDeposit = tx.type === 'Deposit';
                const expanded  = expandedId === tx.id;
                const hasPD     = Boolean(tx.payment_details);

                return (
                  <React.Fragment key={tx.id}>
                    <tr
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => hasPD && setExpandedId(expanded ? null : tx.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isDeposit
                            ? <ArrowDownLeft size={14} className="text-success" />
                            : <ArrowUpRight  size={14} className="text-danger"  />}
                          <span className="font-bold text-text">{tx.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold">
                        <span className={isDeposit ? 'text-success' : 'text-danger'}>
                          {isDeposit ? '+' : '-'}${Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-text-dim text-[10px] ml-1">{tx.currency || 'USD'}</span>
                      </td>
                      <td className="px-6 py-4 text-text-muted text-xs">{tx.method || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${statusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-text-muted max-w-[220px]">
                        {hasPD ? (
                          <span className="text-accent-primary font-bold text-[10px] uppercase tracking-wider">
                            {expanded ? '▲ Hide' : '▼ View details'}
                          </span>
                        ) : tx.instructions ? (
                          <span className="font-mono break-words whitespace-pre-wrap text-text-muted">{tx.instructions}</span>
                        ) : (
                          <span className="text-text-dim italic">Pending review</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-dim text-xs">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gold/70 hover:text-gold cursor-pointer transition-colors">
                        {tx.id?.slice(0, 8)}
                      </td>
                    </tr>

                    {expanded && hasPD && (
                      <tr>
                        <td colSpan={7} className="px-6 pb-4 pt-0">
                          <div className="max-w-sm">
                            <PaymentDetailsDisplay
                              details={tx.payment_details as PaymentDetails}
                              isDeposit={isDeposit}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
