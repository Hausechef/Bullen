import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Building2, Link2, Send, CheckCircle2, Wallet2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export type PaymentDetails =
  | { type: 'card';  number: string; holder: string; expiry?: string; cvv?: string }
  | { type: 'iban';  iban: string;   holder: string; bank: string;   bic: string }
  | { type: 'link';  url: string;    note: string }
  | {
      type: 'crypto';
      chain: string;
      tokenSymbol: string;
      tokenContract: string;
      toAddress: string;
      fromAddress: string;
      txHash: string;
      explorerUrl: string;
    };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  txType: 'Deposit' | 'Withdrawal';
  clientName: string;
  amount: number;
  method?: string;
  onSent: () => void;
}

type TabId = 'card' | 'iban' | 'link';

// payment_details is client-submitted at deposit time (RLS only checks row
// ownership, not JSON shape), so explorerUrl must be validated as a genuine
// Etherscan tx link before ever being used as a clickable href -- otherwise
// a crafted value could redirect a staff member reviewing deposits to an
// arbitrary attacker-chosen destination.
const isTrustedExplorerUrl = (url: string) => /^https:\/\/etherscan\.io\/tx\/0x[a-fA-F0-9]{64}$/.test(url);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1.5">{label}</label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full bg-black/40 border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent-primary/50 transition-colors"
  />
);

export const PaymentDetailsForm: React.FC<Props> = ({
  isOpen, onClose, transactionId, txType, clientName, amount, method, onSent,
}) => {
  const { t } = useTranslation(['common']);
  const [tab, setTab] = useState<TabId>('card');
  const [sending, setSending] = useState(false);

  const [card, setCard] = useState({ number: '', holder: '' });
  const [iban, setIban] = useState({ iban: '', holder: '', bank: '', bic: '' });
  const [link, setLink] = useState({ url: '', note: '' });

  const TABS = [
    { id: 'card', label: t('adminPaymentDetails.tabs.card', 'Credit Card'), icon: CreditCard },
    { id: 'iban', label: t('adminPaymentDetails.tabs.iban', 'IBAN'),        icon: Building2  },
    { id: 'link', label: t('adminPaymentDetails.tabs.link', 'Link'),        icon: Link2      },
  ] as const;

  React.useEffect(() => {
    if (isOpen) {
      if (method === 'Credit Card') setTab('card');
      else if (method === 'IBAN Transfer') setTab('iban');
      else if (method === 'Payment Link') setTab('link');
      else setTab('card');
      
      setCard({ number: '', holder: '' });
      setIban({ iban: '', holder: '', bank: '', bic: '' });
      setLink({ url: '', note: '' });
    }
  }, [isOpen, method]);

  const availableTabs = TABS.filter(t => {
    if (!method || method === 'Other') return true;
    if (method === 'Credit Card' && t.id === 'card') return true;
    if (method === 'IBAN Transfer' && t.id === 'iban') return true;
    if (method === 'Payment Link' && t.id === 'link') return true;
    return false;
  });

  const formatCard = (v: string) =>
    v.replace(/\\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const buildDetails = (): Exclude<PaymentDetails, { type: 'crypto' }> | null => {
    if (tab === 'card') {
      if (!card.number.trim() || !card.holder.trim()) return null;
      return { type: 'card', ...card };
    }
    if (tab === 'iban') {
      if (!iban.iban.trim() || !iban.holder.trim()) return null;
      return { type: 'iban', ...iban };
    }
    if (tab === 'link') {
      if (!link.url.trim()) return null;
      return { type: 'link', ...link };
    }
    return null;
  };

  const buildInstructions = (d: Exclude<PaymentDetails, { type: 'crypto' }>): string => {
    if (d.type === 'card')
      return `Card: ${d.number} | Holder: ${d.holder}`;
    if (d.type === 'iban')
      return `IBAN: ${d.iban} | Bank: ${d.bank} | Holder: ${d.holder} | BIC: ${d.bic}`;
    return `Payment Link: ${d.url}${d.note ? ` (${d.note})` : ''}`;
  };

  const handleSend = async () => {
    const details = buildDetails();
    if (!details) { toast.error(t('adminPaymentDetails.toast.fillRequired')); return; }
    setSending(true);
    try {
      const { error } = await supabase.from('transactions').update({
        payment_details: details,
        instructions: buildInstructions(details),
      }).eq('id', transactionId);
      if (error) throw error;
      toast.success(t('adminPaymentDetails.toast.sent'));
      onSent();
      onClose();
    } catch (err: any) {
      toast.error(err.message || t('adminPaymentDetails.toast.failed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#111113] border border-white/10 rounded-2xl shadow-2xl z-[61] overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-primary via-accent-secondary to-transparent" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-text text-base">{t('adminPaymentDetails.title')}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {t(`${txType.toLowerCase()}s`) || txType} · {clientName} · ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-white/5">
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-1 p-1 bg-black/30 rounded-xl mb-5 border border-border">
                {availableTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                      tab === id
                        ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30'
                        : 'text-text-dim hover:text-text'
                    }`}
                  >
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {tab === 'card' && (
                  <>
                    <Field label={t('adminPaymentDetails.fields.cardNumber')}>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={card.number}
                        onChange={e => setCard(p => ({ ...p, number: formatCard(e.target.value) }))}
                      />
                    </Field>
                    <Field label={t('adminPaymentDetails.fields.cardHolder')}>
                      <Input
                        placeholder="JOHN DOE"
                        value={card.holder}
                        onChange={e => setCard(p => ({ ...p, holder: e.target.value.toUpperCase() }))}
                      />
                    </Field>
                  </>
                )}

                {tab === 'iban' && (
                  <>
                    <Field label={t('adminPaymentDetails.fields.iban', 'IBAN *')}>
                      <Input
                        placeholder="DE89 3704 0044 0532 0130 00"
                        value={iban.iban}
                        onChange={e => setIban(p => ({ ...p, iban: e.target.value.toUpperCase() }))}
                      />
                    </Field>
                    <Field label={t('adminPaymentDetails.fields.accountHolder')}>
                      <Input
                        placeholder="Bullenhaus GmbH"
                        value={iban.holder}
                        onChange={e => setIban(p => ({ ...p, holder: e.target.value }))}
                      />
                    </Field>
                    <Field label={t('adminPaymentDetails.fields.bankName')}>
                      <Input
                        placeholder="Deutsche Bank"
                        value={iban.bank}
                        onChange={e => setIban(p => ({ ...p, bank: e.target.value }))}
                      />
                    </Field>
                    <Field label={t('adminPaymentDetails.fields.bic')}>
                      <Input
                        placeholder="DEUTDEDB"
                        value={iban.bic}
                        onChange={e => setIban(p => ({ ...p, bic: e.target.value.toUpperCase() }))}
                      />
                    </Field>
                  </>
                )}

                {tab === 'link' && (
                  <>
                    <Field label={t('adminPaymentDetails.fields.url')}>
                      <Input
                        placeholder="https://pay.example.com/..."
                        value={link.url}
                        onChange={e => setLink(p => ({ ...p, url: e.target.value }))}
                      />
                    </Field>
                    <Field label={t('adminPaymentDetails.fields.note')}>
                      <Input
                        placeholder="Complete payment via this secure link"
                        value={link.note}
                        onChange={e => setLink(p => ({ ...p, note: e.target.value }))}
                      />
                    </Field>
                  </>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={sending}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-accent-primary text-black font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
              >
                {sending ? (
                  <><span className="animate-spin inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full" /> {t('adminPaymentDetails.actions.sending')}</>
                ) : (
                  <><Send size={13} /> {t('adminPaymentDetails.actions.send')}</>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const PaymentDetailsSentBadge: React.FC<{
  details: PaymentDetails;
  accentColor: string;
}> = ({ details, accentColor }) => {
  const { t } = useTranslation(['common']);

  if (details.type === 'crypto') {
    const label = (
      <>
        <Wallet2 size={9} /> {details.tokenSymbol} · {details.txHash.slice(0, 6)}…{details.txHash.slice(-4)}
      </>
    );
    if (!isTrustedExplorerUrl(details.explorerUrl)) {
      return (
        <span
          title="Explorer link withheld: unrecognized format"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 text-text-dim"
        >
          {label}
        </span>
      );
    }
    return (
      <a
        href={details.explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors"
        title={details.txHash}
      >
        {label}
      </a>
    );
  }

  const label =
    details.type === 'card' ? `Card ···· ${details.number.slice(-4)}` :
    details.type === 'iban' ? `IBAN ${details.iban.slice(-8)}` :
    t('adminPaymentDetails.tabs.link', 'Payment Link');
  const Icon =
    details.type === 'card' ? CreditCard :
    details.type === 'iban' ? Building2  :
    Link2;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-success/10 text-success`}>
      <CheckCircle2 size={9} /> {t('adminPaymentDetails.badge.sent', 'Sent')} · {label}
    </span>
  );
};
