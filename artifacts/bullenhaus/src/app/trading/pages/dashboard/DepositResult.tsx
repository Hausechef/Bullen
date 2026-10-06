import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, Loader2, Home, ListOrdered } from 'lucide-react';
import { apiFetch } from '../../lib/api';

type Variant = 'success' | 'pending' | 'failed';

interface DepositStatusResponse {
  deposit?: {
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    failureReason?: string | null;
  };
}

// Return page after the TRAPAY checkout redirect. UX ONLY — this page never
// credits a balance and never mutates the deposit; it polls the server status
// endpoint and renders what BullenHaus actually recorded.
export const DepositResult = ({ variant }: { variant: Variant }) => {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const depositId = searchParams.get('deposit');

  const [deposit, setDeposit] = useState<DepositStatusResponse['deposit'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (!depositId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: number | undefined;

    const poll = async (attempt: number) => {
      let latest: DepositStatusResponse['deposit'] | null = null;
      try {
        const res = await apiFetch(`/api/deposits/${depositId}`);
        const data: DepositStatusResponse = await res.json().catch(() => ({}));
        if (res.ok && data.deposit) {
          latest = data.deposit;
          if (!cancelled) setDeposit(data.deposit);
        }
      } catch {
        // keep rendering the static variant
      }
      if (cancelled) return;
      setLoading(false);
      setPolls(attempt);
      // While the payment is still being confirmed, keep polling briefly.
      const stillWaiting =
        variant !== 'failed' &&
        attempt < 10 &&
        (!latest || ['CREATED', 'PROVIDER_CREATE_PENDING', 'PENDING', 'PROCESSING'].includes(latest.status));
      if (stillWaiting) {
        timer = window.setTimeout(() => poll(attempt + 1), 4000);
      }
    };

    poll(1);
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, [depositId, variant]);

  const status = deposit?.status;
  const confirmedPaid = status === 'PAID';
  const serverFailed = status === 'FAILED' || status === 'CANCELLED';
  const stillProcessing = !confirmedPaid && !serverFailed;
  const beingFinalized = status === 'PROVIDER_CREATE_PENDING';

  const icon =
    variant === 'failed' || serverFailed ? (
      <XCircle size={40} className="text-danger" />
    ) : confirmedPaid ? (
      <CheckCircle2 size={40} className="text-success" />
    ) : loading || stillProcessing ? (
      variant === 'success' ? <Loader2 size={40} className="text-gold animate-spin" /> : <Clock size={40} className="text-gold" />
    ) : (
      <CheckCircle2 size={40} className="text-success" />
    );

  const title = confirmedPaid
    ? t('deposit.result.completed', 'Deposit completed')
    : serverFailed
      ? t('deposit.result.failed', 'Payment failed')
      : variant === 'failed'
        ? t('deposit.result.failed', 'Payment failed')
        : variant === 'success'
          ? t('deposit.result.received', 'Payment received. Waiting for confirmation.')
          : t('deposit.result.pending', 'Deposit pending');

  const description = confirmedPaid
    ? t('deposit.result.completedDesc', 'Your deposit has been credited to your account balance.')
    : serverFailed
      ? t('deposit.result.failedDesc', 'The payment was not completed and your balance was not changed.')
      : variant === 'failed'
        ? t('deposit.result.failedDesc', 'The payment was not completed and your balance was not changed.')
        : t('deposit.result.pendingDesc', 'The payment is being confirmed. Your balance will update automatically once confirmed — this page does not add funds itself.');

  return (
    <div className="p-4 lg:p-8 max-w-xl mx-auto animate-in fade-in duration-300">
      <div className="glass-card p-10 flex flex-col items-center text-center gap-4">
        {icon}
        <h1 className="font-serif text-2xl font-light italic tracking-tight text-text">{title}</h1>
        <p className="text-sm text-text-muted max-w-sm">{description}</p>

        {deposit && (
          <div className="mt-2 w-full max-w-xs rounded-xl border border-border bg-surface p-4 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-text-dim">{t('deposit.result.amount', 'Amount')}</span>
              <span className="font-mono font-bold text-text">
                {Number(deposit.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {deposit.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">{t('deposit.result.status', 'Status')}</span>
              <span className="font-mono font-bold text-gold">{deposit.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">{t('deposit.result.reference', 'Reference')}</span>
              <span className="font-mono text-text-muted">{deposit.orderId}</span>
            </div>
          </div>
        )}

        {beingFinalized && (
          <p className="text-[11px] text-text-dim">
            {t('deposit.result.finalizing', 'Your deposit attempt is being finalized with the payment provider. Do not submit a new deposit — contact support if this persists.')}
          </p>
        )}

        {stillProcessing && polls >= 10 && (
          <p className="text-[11px] text-text-dim">
            {t('deposit.result.checkLater', 'Confirmation is taking longer than usual. Check your deposit history in a few minutes.')}
          </p>
        )}

        <div className="flex flex-wrap gap-3 justify-center mt-4">
          <Link to="/trade/dashboard" className="btn-gold inline-flex items-center gap-2">
            <Home size={14} /> {t('deposit.result.toDashboard', 'Dashboard')}
          </Link>
          <Link
            to="/trade/transactions"
            className="px-5 py-2.5 rounded-xl border border-white/15 text-white hover:bg-white/5 inline-flex items-center gap-2 text-sm"
          >
            <ListOrdered size={14} /> {t('deposit.result.toHistory', 'Deposit history')}
          </Link>
        </div>
      </div>
    </div>
  );
};
