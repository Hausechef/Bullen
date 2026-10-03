import React, { useEffect, useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const AdminTransactions = () => {
  const { t } = useTranslation(['common']);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        setRequests(data || []);
      } catch {
        // Table may not exist yet — show empty state
        setRequests([]);
      }
    };
    fetchTransactions();
  }, []);

  const allTxs = requests.map(req => ({
    id:     (req.id || '').toString().slice(0, 8),
    user:   req.user_name || req.userName || req.user_id || '—',
    type:   req.type || 'Unknown',
    amount: `$${Number(req.amount || 0).toLocaleString()}`,
    status: req.status || 'Pending',
    date:   new Date(req.created_at || req.date || Date.now()).toLocaleString(),
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return 'text-emerald-500';
      case 'Pending':
        return 'text-amber-500';
      case 'Processing':
        return 'text-blue-500';
      case 'Rejected':
        return 'text-rose-500';
      default:
        return 'text-text-dim';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return <CheckCircle2 size={14} className="text-emerald-500"/>;
      case 'Processing':
         return <Clock size={14} className="text-blue-500"/>;
      case 'Rejected':
         return <AlertCircle size={14} className="text-rose-500"/>;
      default:
        return <Clock size={14} className="text-amber-500"/>;
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-text">{t('adminTx.globalTitle')}</h2>
          <p className="text-sm text-text-dim mt-1">{t('adminTx.globalDesc')}</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            placeholder={t('adminTx.searchTx')}
            className="input-dark pl-10 pr-4 py-2 w-64"
          />
        </div>
      </div>
      
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] font-bold text-text-dim uppercase tracking-widest bg-surface/60">
              <th className="px-6 py-4">{t('adminTx.columns.txid')}</th>
              <th className="px-6 py-4">{t('adminTx.columns.user')}</th>
              <th className="px-6 py-4">{t('adminTx.columns.type')}</th>
              <th className="px-6 py-4">{t('adminTx.columns.amount')}</th>
              <th className="px-6 py-4">{t('adminTx.columns.status')}</th>
              <th className="px-6 py-4">{t('adminTx.columns.date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-xs text-text">
            {allTxs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-dim">
                  {t('adminTx.noRealTx')}
                </td>
              </tr>
            ) : allTxs.map((tx, idx) => (
              <tr key={tx.id + idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-text-dim">{tx.id}</td>
                <td className="px-6 py-4 font-sans font-bold text-white">{tx.user}</td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-2 ${tx.type === 'Deposit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {tx.type === 'Deposit' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    <span className="font-sans font-bold text-xs uppercase">{t(`${tx.type.toLowerCase()}s`) || tx.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-white font-bold">{tx.amount}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(tx.status)}
                    <span className={getStatusColor(tx.status)}>{t(`${tx.status.toLowerCase()}`) || tx.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-text-dim">{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
