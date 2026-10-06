import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CreditCard, Landmark, Loader2, ShieldCheck, AlertTriangle, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';

interface DepositConfig {
  enabled: boolean;
  companyName?: string;
  methods: { card: boolean; bankTransfer: boolean };
  currencies: string[];
  defaultCurrency: string | null;
  minimumDeposit: number | null;
  maximumDeposit: number | null;
}

type Method = 'CARD' | 'BANK_TRANSFER';

// Online deposit flow: BullenHaus creates the deposit server-side, TRAPAY hosts
// the checkout. This page collects amount/currency/method only — no gateway,
// key or callback details are ever provided by the client.
export const DepositPage = () => {
  const { t } = useTranslation('common');
  const { kycStatus } = useAuth();

  const [config, setConfig] = useState<DepositConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [method, setMethod] = useState<Method | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdCheckout, setCreatedCheckout] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/deposits/config');
        if (!res.ok) throw new Error('config_unavailable');
        const data = await res.json();
        if (!cancelled) {
          setConfig(data);
          if (data.defaultCurrency) setCurrency(data.defaultCurrency);
          if (data.methods?.card) setMethod('CARD');
          else if (data.methods?.bankTransfer) setMethod('BANK_TRANSFER');
        }
      } catch {
        if (!cancelled) setConfigError(t('deposit.configError', 'Payment configuration is currently unavailable.'));
      }
    })();
    return () => { cancelled = true; };
  }, [t]);

  const parsedAmount = Number(amount);
  const amountValid =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    (!config?.minimumDeposit || parsedAmount >= config.minimumDeposit) &&
    (!config?.maximumDeposit || parsedAmount <= config.maximumDeposit);

  const kycBlocked = kycStatus !== 'VERIFIED';

  const handleContinue = async () => {
    if (submitting || kycBlocked || !method || !amountValid || !currency) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/deposits', {
        method: 'POST',
        body: JSON.stringify({ amount: parsedAmount, currency, method }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || t('deposit.createFailed', 'Could not create the deposit. Please try again.'));
        return;
      }
      // Exactly one deposit created per successful submit — the button is
      // locked from here on; retrying never creates a second deposit.
      setCreatedCheckout(data.checkoutUrl);
      toast.info(t('deposit.redirecting', 'Redirecting to secure payment...'));
      window.location.assign(data.checkoutUrl);
    } catch {
      toast.error(t('deposit.createFailed', 'Could not create the deposit. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (configError) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto animate-in fade-in duration-300">
        <div className="glass-card p-8 flex flex-col items-center gap-4 text-center">
          <AlertTriangle size={28} className="text-warning" />
          <p className="text-sm text-text-muted">{configError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light italic tracking-tight text-text">
          {t('deposit.title', 'Deposit Funds')}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {t('deposit.subtitle', 'Fund your account via a secure online payment.')}
        </p>
      </div>

      {kycBlocked && (
        <div className="glass-card p-5 mb-6 flex items-start gap-3 border border-warning/20">
          <ShieldCheck size={18} className="text-warning mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold text-text">{t('deposit.kycRequired', 'KYC verification required')}</p>
            <p className="text-text-muted mt-0.5">
              {t('deposit.kycRequiredDesc', 'Your account must be verified before you can deposit.')}{' '}
              <Link to="/trade/kyc" className="text-accent-primary hover:underline">{t('deposit.goToKyc', 'Go to verification')}</Link>
            </p>
          </div>
        </div>
      )}

      <div className="glass-card p-6 lg:p-8 space-y-8">
        {/* Amount + currency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
              {t('deposit.amount', 'Amount')}
            </label>
            <input
              type="number"
              min={config?.minimumDeposit ?? undefined}
              max={config?.maximumDeposit ?? undefined}
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={config?.minimumDeposit ? String(config.minimumDeposit) : '0.00'}
              disabled={!config?.enabled || kycBlocked || Boolean(createdCheckout)}
              className="input-dark w-full mt-2"
            />
            {config?.minimumDeposit != null && config?.maximumDeposit != null && (
              <p className="text-[10px] text-text-dim mt-1.5">
                {t('deposit.limits', 'Min {{min}} — Max {{max}} {{currency}}', {
                  min: config.minimumDeposit.toLocaleString(),
                  max: config.maximumDeposit.toLocaleString(),
                  currency: currency || config.defaultCurrency || '',
                })}
              </p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
              {t('deposit.currency', 'Currency')}
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              disabled={!config?.enabled || kycBlocked || Boolean(createdCheckout)}
              className="input-dark w-full mt-2"
            >
              {(config?.currencies ?? []).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment methods — only those enabled for the company are shown */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
            {t('deposit.method', 'Payment Method')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {config?.methods?.card && (
              <button
                type="button"
                onClick={() => setMethod('CARD')}
                disabled={kycBlocked || Boolean(createdCheckout)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  method === 'CARD'
                    ? 'border-gold/60 bg-gold/5 shadow-[0_2px_16px_rgba(212,175,55,0.15)]'
                    : 'border-border hover:border-border-strong bg-surface'
                } ${kycBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className={method === 'CARD' ? 'text-gold' : 'text-text-dim'} />
                  <div>
                    <p className="font-bold text-sm text-text">{t('deposit.bankCard', 'Bank Card')}</p>
                    <p className="text-[10px] text-text-dim">Visa / Mastercard</p>
                  </div>
                </div>
              </button>
            )}
            {config?.methods?.bankTransfer && (
              <button
                type="button"
                onClick={() => setMethod('BANK_TRANSFER')}
                disabled={kycBlocked || Boolean(createdCheckout)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  method === 'BANK_TRANSFER'
                    ? 'border-gold/60 bg-gold/5 shadow-[0_2px_16px_rgba(212,175,55,0.15)]'
                    : 'border-border hover:border-border-strong bg-surface'
                } ${kycBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Landmark size={20} className={method === 'BANK_TRANSFER' ? 'text-gold' : 'text-text-dim'} />
                  <div>
                    <p className="font-bold text-sm text-text">{t('deposit.bankTransfer', 'Bank Transfer')}</p>
                    <p className="text-[10px] text-text-dim">{t('deposit.bankTransferDesc', 'Pay from your bank')}</p>
                  </div>
                </div>
              </button>
            )}
            {config && !config.enabled && (
              <div className="sm:col-span-2 p-4 rounded-xl border border-border bg-surface flex items-center gap-3 text-sm text-text-muted">
                <Wallet size={18} className="text-text-dim" />
                {t('deposit.unavailable', 'Online deposits are currently unavailable. You can submit a manual deposit request from your Portfolio.')}
              </div>
            )}
          </div>
        </div>

        {/* Continue / redirect states */}
        {createdCheckout ? (
          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-sm text-text-muted text-center">
              {t('deposit.redirectHint', 'If the secure payment page did not open, use the button below. This deposit is already created — do not submit again.')}
            </p>
            <a href={createdCheckout} className="btn-gold inline-flex items-center gap-2">
              {t('deposit.openPayment', 'Open secure payment page')}
            </a>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleContinue}
            disabled={submitting || kycBlocked || !method || !amountValid || !currency || !config?.enabled}
            className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> {t('deposit.creating', 'Creating secure payment...')}</>
              : t('deposit.continue', 'Continue')}
          </button>
        )}

        <p className="text-[10px] text-text-dim text-center">
          {t('deposit.secureNote', 'You will be redirected to a secure hosted payment page. BullenHaus never sees or stores your card details.')}
        </p>
      </div>
    </div>
  );
};
