import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Wallet, Coins } from 'lucide-react';
import { useTradingStore } from '../../stores/tradingStore';
import { useSpotStore } from '../../stores/spotStore';
import { useAuth } from '../../contexts/AuthContext';
import { AssetIcon } from '../common/AssetIcon';

/**
 * Spot trading body rendered inside AdvancedOrderPanel when the user
 * switches the panel to Spot mode. No leverage, no liquidation — buy crypto
 * with wallet balance, hold it, sell it back.
 */

const baseOf = (pair: string): string => {
  const s = (pair || '').toUpperCase();
  return s.endsWith('USDT') ? s.slice(0, -4) : s;
};

export const SpotOrderContent: React.FC<{ currentPair: string }> = ({ currentPair }) => {
  const { kycStatus } = useAuth();
  const currentPrice = useTradingStore(s => s.prices[currentPair]) || null;
  const priceChangePercent24h = useTradingStore(s => s.priceChanges[currentPair]) || null;
  const wallet = useTradingStore(s => s.wallet);

  const holdings = useSpotStore(s => s.holdings);
  const executing = useSpotStore(s => s.executing);
  const executeTrade = useSpotStore(s => s.executeTrade);
  const loadHoldings = useSpotStore(s => s.loadHoldings);

  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amountStr, setAmountStr] = useState('');

  useEffect(() => { loadHoldings(); }, [loadHoldings]);

  const base = baseOf(currentPair);
  const holding = useMemo(() => holdings.find(h => h.symbol === base), [holdings, base]);
  const heldAmount = holding?.amount ?? 0;

  const isPositive = (priceChangePercent24h || 0) >= 0;
  const amount = parseFloat(amountStr) || 0;
  const total = currentPrice ? amount * currentPrice : 0;
  const availableBalance = Math.max(0, wallet.balance - wallet.marginUsed);

  const setMax = () => {
    if (side === 'buy') {
      if (currentPrice && availableBalance > 0) {
        setAmountStr((availableBalance / currentPrice).toFixed(8).replace(/\.?0+$/, ''));
      }
    } else if (heldAmount > 0) {
      setAmountStr(String(heldAmount));
    }
  };

  const handleExecute = async () => {
    if (kycStatus !== 'VERIFIED') {
      toast.error('KYC Verification required to trade');
      return;
    }
    if (!currentPrice) {
      toast.error('Price not loaded');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Invalid amount');
      return;
    }
    if (side === 'buy' && total > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }
    if (side === 'sell' && amount > heldAmount) {
      toast.error('Insufficient holding');
      return;
    }

    const err = await executeTrade(base, side, amount, currentPrice);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(
      side === 'buy'
        ? `Bought ${amount} ${base} for $${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        : `Sold ${amount} ${base} for $${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
    );
    setAmountStr('');
  };

  const canSubmit = !executing && amount > 0 && !!currentPrice &&
    (side === 'buy' ? total <= availableBalance : amount <= heldAmount);

  return (
    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative z-10 space-y-6">
      {/* Pair Display */}
      <div className="p-4 bg-[#111] border border-white/10 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AssetIcon symbol={currentPair} size={40} />
          <div>
            <div className="text-sm font-bold text-white">
              {base} / USDT
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Spot</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono font-bold text-white">
            {currentPrice ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
          </div>
          <div className={`text-[10px] font-bold flex items-center justify-end gap-1 ${isPositive ? 'text-accent-secondary' : 'text-accent-quaternary'}`}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {priceChangePercent24h ? (priceChangePercent24h > 0 ? '+' : '') + priceChangePercent24h.toFixed(2) + '%' : '---'}
          </div>
        </div>
      </div>

      {/* Buy / Sell side toggle */}
      <div className="flex bg-[#111] border border-white/10 rounded-xl p-1">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors uppercase tracking-widest ${side === 'buy' ? 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30' : 'text-slate-500 hover:text-white border border-transparent'}`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors uppercase tracking-widest ${side === 'sell' ? 'bg-accent-quaternary/20 text-accent-quaternary border border-accent-quaternary/30' : 'text-slate-500 hover:text-white border border-transparent'}`}
        >
          Sell
        </button>
      </div>

      {/* Amount */}
      <div>
        <div className="flex justify-between items-end mb-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Amount ({base})</label>
          <button onClick={setMax} className="text-[10px] font-bold text-accent-primary hover:text-accent-primary/80 uppercase tracking-widest">Max</button>
        </div>
        <input
          type="number"
          min="0"
          step="any"
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          placeholder="0.00"
          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-accent-primary/50 transition-colors"
        />
      </div>

      {/* Summary */}
      <div className="p-4 bg-[#111] border border-white/10 rounded-xl space-y-3 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500 flex items-center gap-1.5"><Wallet size={12} /> Available</span>
          <span className="text-white font-mono font-bold">
            ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 flex items-center gap-1.5"><Coins size={12} /> Holding</span>
          <span className="text-white font-mono font-bold">
            {heldAmount > 0 ? `${heldAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${base}` : '—'}
          </span>
        </div>
        {holding && (
          <div className="flex justify-between">
            <span className="text-slate-500">Avg Buy Price</span>
            <span className="text-white font-mono">${holding.avgBuyPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-white/5 pt-3">
          <span className="text-slate-500">Total</span>
          <span className="text-accent-primary font-mono font-bold">
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Execute */}
      <button
        onClick={handleExecute}
        disabled={!canSubmit}
        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          side === 'buy'
            ? 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/40 hover:bg-accent-secondary/30'
            : 'bg-accent-quaternary/20 text-accent-quaternary border border-accent-quaternary/40 hover:bg-accent-quaternary/30'
        }`}
      >
        {executing ? '...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${base}`}
      </button>

      <p className="text-[10px] text-slate-600 text-center leading-relaxed">
        Spot trades execute instantly at the current market price. No leverage is applied.
      </p>
    </div>
  );
};
