import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, CheckCheck, ExternalLink, CreditCard, Building2, Link2, Wallet2 } from 'lucide-react';
import type { PaymentDetails } from '../admin/PaymentDetailsForm';

// payment_details is client-submitted at deposit time (RLS only checks row
// ownership, not JSON shape), so explorerUrl must be validated as a genuine
// Etherscan tx link before ever being used as a clickable href -- otherwise
// a crafted value could redirect a staff member reviewing deposits to an
// arbitrary attacker-chosen destination.
const isTrustedExplorerUrl = (url: string) => /^https:\/\/etherscan\.io\/tx\/0x[a-fA-F0-9]{64}$/.test(url);

const CopyField: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-white/5 last:border-0">
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-widest text-text-dim font-bold mb-0.5">{label}</p>
        <p className={`text-sm text-text break-all ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-text transition-all"
        title="Copy"
      >
        {copied ? <CheckCheck size={13} className="text-success" /> : <Copy size={13} />}
      </button>
    </div>
  );
};

export const PaymentDetailsDisplay: React.FC<{
  details: PaymentDetails;
  isDeposit: boolean;
}> = ({ details, isDeposit }) => {
  const accent = isDeposit ? 'text-accent-secondary' : 'text-orange-400';
  const accentBg = isDeposit ? 'bg-accent-secondary/10 border-accent-secondary/20' : 'bg-orange-500/10 border-orange-500/20';

  if (details.type === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full rounded-xl border ${accentBg} overflow-hidden`}
      >
        <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-white/5`}>
          <CreditCard size={14} className={accent} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${accent}`}>Credit Card Details</span>
        </div>
        <div className="px-4 py-1">
          <CopyField label="Card Number" value={details.number} mono />
          <CopyField label="Cardholder Name" value={details.holder} />
          <div className="grid grid-cols-2 gap-x-4">
            {details.expiry && <CopyField label="Expiry" value={details.expiry} mono />}
            {details.cvv && <CopyField label="CVV" value={details.cvv} mono />}
          </div>
        </div>
      </motion.div>
    );
  }

  if (details.type === 'iban') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full rounded-xl border ${accentBg} overflow-hidden`}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
          <Building2 size={14} className={accent} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${accent}`}>Bank Transfer Details</span>
        </div>
        <div className="px-4 py-1">
          <CopyField label="IBAN" value={details.iban} mono />
          <CopyField label="Account Holder" value={details.holder} />
          {details.bank && <CopyField label="Bank" value={details.bank} />}
          {details.bic && <CopyField label="BIC / SWIFT" value={details.bic} mono />}
        </div>
      </motion.div>
    );
  }

  if (details.type === 'link') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full rounded-xl border ${accentBg} overflow-hidden`}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
          <Link2 size={14} className={accent} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${accent}`}>Payment Link</span>
        </div>
        <div className="px-4 py-3 space-y-3">
          {details.note && (
            <p className="text-xs text-text-muted">{details.note}</p>
          )}
          <a
            href={details.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all ${
              isDeposit
                ? 'bg-accent-secondary text-black hover:brightness-110 shadow-neon-emerald'
                : 'bg-orange-500 text-black hover:brightness-110'
            }`}
          >
            <ExternalLink size={15} /> Open Payment Page
          </a>
          <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
            <span className="text-[10px] text-text-dim font-mono break-all flex-1">{details.url}</span>
            <CopyButton value={details.url} />
          </div>
        </div>
      </motion.div>
    );
  }

  if (details.type === 'crypto') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full rounded-xl border ${accentBg} overflow-hidden`}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
          <Wallet2 size={14} className={accent} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${accent}`}>
            {details.tokenSymbol} Deposit Submitted
          </span>
        </div>
        <div className="px-4 py-1">
          <CopyField label="Transaction Hash" value={details.txHash} mono />
          <CopyField label="From (your wallet)" value={details.fromAddress} mono />
          <CopyField label="To (platform wallet)" value={details.toAddress} mono />
        </div>
        <div className="px-4 pb-4 pt-2">
          {isTrustedExplorerUrl(details.explorerUrl) ? (
            <a
              href={details.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all ${
                isDeposit
                  ? 'bg-accent-secondary text-black hover:brightness-110 shadow-neon-emerald'
                  : 'bg-orange-500 text-black hover:brightness-110'
              }`}
            >
              <ExternalLink size={15} /> View on Block Explorer
            </a>
          ) : (
            <div
              title="Explorer link withheld: unrecognized format"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm bg-white/5 text-text-dim cursor-not-allowed"
            >
              <ExternalLink size={15} /> Explorer link unavailable
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
};

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="shrink-0 p-1.5 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-text transition-all"
    >
      {copied ? <CheckCheck size={12} className="text-success" /> : <Copy size={12} />}
    </button>
  );
};
