import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: () => void;
  assetId?: string;
  assetName?: string;
  assetPrice?: number;
  sharesAmount?: number;
  templateUrl?: string; // e.g. '/contracts/bytedance-contract.html'
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  onSign,
  assetId,
  assetName,
  assetPrice,
  sharesAmount,
  templateUrl,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserEmail(user.email ?? '');
      supabase
        .from('users')
        .select('first_name, last_name, full_name')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          const name =
            [data?.first_name, data?.last_name].filter(Boolean).join(' ') ||
            (data as any)?.full_name ||
            user.email ||
            '';
          setUserName(name);
        });
    });
  }, [isOpen]);

  const today = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const totalAmount =
    assetPrice != null && sharesAmount != null && sharesAmount > 0
      ? Number(assetPrice) * sharesAmount
      : null;

  const fillIframeFields = useCallback(() => {
    const win = iframeRef.current?.contentWindow as
      | (Window & {
          set?: (k: string, v: string) => void;
          setContractPurchaseData?: (data: Record<string, unknown>) => void;
        })
      | null;
    if (!win) return;

    // Newer templates (Neuralink, Boring Company) expose a single data-object API
    if (typeof win.setContractPurchaseData === 'function') {
      win.setContractPurchaseData({
        quantity: sharesAmount != null && sharesAmount > 0 ? sharesAmount : '',
        price: assetPrice != null ? Number(assetPrice) : '',
        currency: 'USD',
        purchaseDate: new Date().toISOString().slice(0, 10),
        place: 'Online',
        buyer: {
          fullName: userName || '',
          email: userEmail || '',
        },
      });
      return;
    }

    // Older templates (ByteDance, Starlink) expose set(key, value)
    if (typeof win.set !== 'function') return;
    if (sharesAmount != null && sharesAmount > 0) win.set('quantity', String(sharesAmount));
    if (assetPrice != null) win.set('price', `$${Number(assetPrice).toFixed(2)}`);
    if (totalAmount != null) win.set('amount', `$${totalAmount.toFixed(2)}`);
    win.set('placeDate', `Online, ${today}`);
    if (userName) win.set('buyerName', userName);
    if (userEmail) win.set('email', userEmail);
  }, [sharesAmount, assetPrice, totalAmount, today, userName, userEmail]);

  // Re-fill after userName/userEmail loads (iframe may already be loaded)
  useEffect(() => {
    if (templateUrl && isOpen) fillIframeFields();
  }, [userName, userEmail, fillIframeFields, templateUrl, isOpen]);

  const handleSign = async () => {
    setSigning(true);
    try {
      const { error } = await supabase.rpc('sign_premarket_contract', {
        version: 'v1.0',
        asset_id: assetId && assetId !== 'hardcoded-nrlk' ? assetId : null,
      });
      if (error) throw error;
      toast.success('Contract signed successfully. You may now proceed with your purchase.');
      onSign();
      onClose();
    } catch (err) {
      console.error('Error signing contract:', err);
      toast.error('Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    if (templateUrl && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
      return;
    }
    // Generic print window for assets without a template
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    const priceStr = assetPrice != null ? `$${Number(assetPrice).toFixed(2)}` : '—';
    const totalStr = totalAmount != null ? `$${totalAmount.toFixed(2)}` : '—';
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Pre-Market Investment Agreement</title>
      <style>
        body{font-family:Georgia,'Times New Roman',serif;padding:60px;max-width:800px;margin:auto;color:#111;line-height:1.7}
        h1{font-size:20px;text-align:center;letter-spacing:4px;margin-bottom:4px}
        h2{font-size:14px;text-align:center;letter-spacing:2px;font-weight:normal;margin-bottom:32px}
        .meta{border:1px solid #ccc;padding:16px 24px;margin-bottom:32px;font-size:13px;line-height:2}
        .meta strong{display:inline-block;width:220px}
        h3{font-size:13px;letter-spacing:1px;margin-top:28px;margin-bottom:4px;text-transform:uppercase}
        p{font-size:13px;margin:0 0 8px}
        .footer{margin-top:48px;border-top:1px solid #ccc;padding-top:16px;font-size:11px;color:#555}
      </style>
    </head><body>
      <h1>BULLENHAUS TRADING PLATFORM</h1>
      <h2>PRE-MARKET INVESTMENT AGREEMENT — VERSION 1.0</h2>
      <div class="meta">
        <div><strong>Investor:</strong> ${userName || '—'}</div>
        <div><strong>Asset:</strong> ${assetName || '—'}</div>
        <div><strong>Anzahl Aktien:</strong> ${sharesAmount ?? '—'}</div>
        <div><strong>Preis pro Aktie:</strong> ${priceStr}</div>
        <div><strong>Betrag:</strong> ${totalStr}</div>
        <div><strong>Ort / Datum:</strong> Online, ${today}</div>
      </div>
      <h3>1. Investment Terms</h3>
      <p>The Investor agrees to acquire ${sharesAmount ?? '—'} pre-IPO shares of ${assetName || 'the specified asset'} at ${priceStr} per share (total: ${totalStr}) as displayed on the Bullenhaus Trading Platform at the time of signing.</p>
      <h3>2. Risk Disclosure</h3>
      <p>Pre-market investments carry elevated risk. Pre-IPO shares are illiquid and may be subject to lock-up periods. There is no guarantee the IPO will occur on any specific timeline or at any specific valuation.</p>
      <h3>3. Non-Transferability</h3>
      <p>Shares acquired under this Agreement may not be transferred, sold, pledged, or otherwise disposed of without prior written consent from Bullenhaus Trading Platform.</p>
      <h3>4. Price Fixation</h3>
      <p>The purchase price of ${priceStr} per share is fixed at signing time and is not subject to change after execution.</p>
      <h3>5. Platform Terms</h3>
      <p>This Agreement is governed by the Bullenhaus Platform Terms of Service and Privacy Policy.</p>
      <h3>6. Electronic Signature</h3>
      <p>By confirming acceptance on the Bullenhaus Platform, the Investor provides a valid electronic signature.</p>
      <div class="footer">Bullenhaus Trading Platform · Pre-Market Investment Agreement v1.0 · Online, ${today}</div>
    </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-white/10 rounded-xl w-full max-w-4xl flex flex-col h-[85vh] shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex flex-wrap justify-between items-center gap-2 bg-[#0a0a0b] rounded-t-xl">
          <h2 className="text-xl font-bold text-white tracking-wide">Premarket Investment Contract</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <Printer size={13} />
              Print / Save PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Contract body */}
        <div className="flex-1 overflow-hidden bg-slate-900/50">
          {templateUrl ? (
            <iframe
              ref={iframeRef}
              src={templateUrl}
              onLoad={fillIframeFields}
              className="w-full h-full border-0"
              title="Investment Contract"
            />
          ) : (
            <div className="h-full overflow-y-auto p-8 bg-[#0d0f14]">
              <div className="max-w-2xl mx-auto space-y-6 text-sm leading-relaxed">
                <div className="text-center space-y-1 pb-6 border-b border-white/10">
                  <p className="text-xs font-bold tracking-[0.3em] text-accent-primary uppercase">Bullenhaus Trading Platform</p>
                  <h3 className="text-lg font-bold text-white tracking-widest uppercase">Pre-Market Investment Agreement</h3>
                  <p className="text-xs text-slate-500 tracking-widest">Version 1.0</p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-5 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Investor</p>
                    <p className="text-white font-medium">{userName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Ort / Datum</p>
                    <p className="text-white font-medium">Online, {today}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Asset</p>
                    <p className="text-white font-medium">{assetName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Anzahl Aktien</p>
                    <p className="text-white font-medium">{sharesAmount ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Preis pro Aktie</p>
                    <p className="text-accent-primary font-mono font-bold text-base">
                      {assetPrice != null ? `$${Number(assetPrice).toFixed(2)}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Betrag</p>
                    <p className="text-accent-primary font-mono font-bold text-base">
                      {totalAmount != null ? `$${totalAmount.toFixed(2)}` : '—'}
                    </p>
                  </div>
                </div>

                {[
                  {
                    title: '1. Investment Terms',
                    text: `The Investor agrees to acquire ${sharesAmount ?? '—'} pre-IPO shares of ${assetName || 'the specified asset'} at ${assetPrice != null ? `$${Number(assetPrice).toFixed(2)}` : '—'} per share (total: ${totalAmount != null ? `$${totalAmount.toFixed(2)}` : '—'}) as displayed on the Bullenhaus Trading Platform at the time of signing.`,
                  },
                  {
                    title: '2. Risk Disclosure',
                    text: 'Pre-market investments carry elevated risk. Pre-IPO shares are illiquid and may be subject to lock-up periods. There is no guarantee the IPO will occur on any specific timeline or at any specific valuation.',
                  },
                  {
                    title: '3. Non-Transferability',
                    text: 'Shares acquired under this Agreement may not be transferred, sold, pledged, or otherwise disposed of without prior written consent from Bullenhaus Trading Platform.',
                  },
                  {
                    title: '4. Price Fixation',
                    text: `The purchase price of ${assetPrice != null ? `$${Number(assetPrice).toFixed(2)}` : '—'} per share is fixed at signing time and is not subject to change after execution.`,
                  },
                  {
                    title: '5. Platform Terms',
                    text: 'This Agreement is governed by the Bullenhaus Platform Terms of Service and Privacy Policy. By signing, the Investor confirms they have read and accepted all Platform terms.',
                  },
                  {
                    title: '6. Electronic Signature',
                    text: 'By confirming acceptance on the Bullenhaus Platform, the Investor provides a valid electronic signature and agrees to be legally bound by this Agreement.',
                  },
                ].map(({ title, text }) => (
                  <div key={title}>
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2">{title}</h4>
                    <p className="text-slate-400 leading-relaxed">{text}</p>
                  </div>
                ))}

                <div className="pt-4 border-t border-white/5 text-center">
                  <p className="text-xs text-slate-600">Bullenhaus Trading Platform · Pre-Market Investment Agreement v1.0 · Online, {today}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-[#0a0a0b] rounded-b-xl space-y-4">
          {assetPrice != null && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Anzahl Aktien</span>
                <span className="font-mono font-bold text-white text-sm">{sharesAmount ?? '—'}</span>
              </div>
              <div className="flex flex-col px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Preis pro Aktie</span>
                <span className="font-mono font-bold text-white text-sm">${Number(assetPrice).toFixed(2)}</span>
              </div>
              <div className="flex flex-col px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Betrag</span>
                <span className="font-mono font-bold text-accent-primary text-sm">
                  {totalAmount != null ? `$${totalAmount.toFixed(2)}` : '—'}
                </span>
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-black/50 text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
            />
            <span className="text-slate-300 font-medium">I Have Read and Accept the Contract</span>
          </label>

          <div className="flex justify-end gap-4 pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              disabled={!agreed || signing}
              onClick={handleSign}
              className="btn-primary px-8 py-2.5 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
            >
              {signing ? <span className="animate-pulse">Signing...</span> : 'Sign Contract'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
