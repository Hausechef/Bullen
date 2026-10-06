import React, { useEffect, useState } from 'react';
import { Upload, RefreshCw, Users, Send } from 'lucide-react';
import { TxStatus } from '../../stores/transactionStore';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { PaymentDetailsForm, PaymentDetailsSentBadge } from '../../components/admin/PaymentDetailsForm';
import type { PaymentDetails } from '../../components/admin/PaymentDetailsForm';
import { useTranslation } from 'react-i18next';

export const AdminWithdrawals = () => {
  const { t } = useTranslation(['common']);
  const [requests, setRequests]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [formOpen, setFormOpen]     = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const withdrawals = requests.filter(r => r.type === 'Withdrawal');

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
        // Atomic approve+debit via DB function — prevents double-debit under concurrent requests
        const { data: result, error: rpcErr } = await supabase.rpc('approve_withdrawal', {
          p_transaction_id: id,
        });
        if (rpcErr) throw rpcErr;

        const res = result as { ok: boolean; error?: string; amount?: number };
        if (!res.ok) {
          if (res.error === 'already_approved') {
            toast.info('Withdrawal already approved — balance unchanged');
          } else {
            throw new Error(res.error ?? 'Approval failed');
          }
          return;
        }

        toast.success(`Withdrawal approved — $${Number(res.amount ?? 0).toLocaleString()} debited from client`);
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
            <Upload className="text-warning" size={22} /> {t('adminTx.withdrawalsTitle')}
          </h2>
          <p className="text-sm text-text-muted mt-1">{t('adminTx.withdrawalsDesc')}</p>
        </div>
        <button onClick={fetchRequests} className="p-2 border border-border rounded-xl text-text-muted hover:text-text hover:border-border-strong transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

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
            {withdrawals.length === 0 ? (
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
            ) : withdrawals.map(req => (
              <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-text font-sans">{req.user_name || '—'}</p>
                  <p className="text-[10px] text-text-dim mt-0.5">{req.user_email || '—'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-text font-bold">\${Number(req.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
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
                      accentColor="text-warning"
                    />
                  ) : (
                    <button
                      onClick={() => openForm(req)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20 text-warning hover:bg-warning/20 font-bold text-[10px] uppercase tracking-wider transition-all"
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

      {selectedTx && (
        <PaymentDetailsForm
          isOpen={formOpen}
          onClose={() => { setFormOpen(false); setSelectedTx(null); }}
          transactionId={selectedTx.id}
          txType="Withdrawal"
          clientName={selectedTx.user_name || selectedTx.user_email || 'Client'}
          amount={Number(selectedTx.amount || 0)}
          method={selectedTx.method}
          onSent={fetchRequests}
        />
      )}
    </div>
  );
};
