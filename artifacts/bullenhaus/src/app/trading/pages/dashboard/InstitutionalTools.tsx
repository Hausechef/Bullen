import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Settings2, TrendingUp, TrendingDown, Activity, Zap, Target, BarChart3, ArrowRight, Lock, Crown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTradingStore } from '../../stores/tradingStore';
import { AssetIcon } from '../../components/common/AssetIcon';
import { useEliteStatus, ELITE_REQUIREMENT } from '../../hooks/useEliteStatus';
import { LuxIcon, LuxIconTile } from '../../components/common/LuxIcon';
import { useWalletSync } from '../../hooks/useWalletSync';
import { TransferModal } from './TransferModal';

/**
 * Institutional Tools — live market signals computed from the real price feed.
 * Signals are momentum-based on 24h change; the strategy presets act as
 * filters/sorts over the signal table. "Trade" jumps into the terminal with
 * the pair preselected.
 */

type SignalKind = 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';

interface SignalRow {
  symbol: string;
  price: number;
  change: number;
  signal: SignalKind;
  strength: number; // 0..100
}

const signalOf = (change: number): SignalKind => {
  if (change >= 6) return 'STRONG BUY';
  if (change >= 2.5) return 'BUY';
  if (change <= -6) return 'STRONG SELL';
  if (change <= -2.5) return 'SELL';
  return 'NEUTRAL';
};

const SIGNAL_STYLE: Record<SignalKind, string> = {
  'STRONG BUY': 'text-accent-secondary bg-accent-secondary/10 border-accent-secondary/40',
  'BUY': 'text-accent-secondary/90 bg-accent-secondary/5 border-accent-secondary/20',
  'NEUTRAL': 'text-slate-400 bg-white/5 border-white/10',
  'SELL': 'text-accent-quaternary/90 bg-accent-quaternary/5 border-accent-quaternary/20',
  'STRONG SELL': 'text-accent-quaternary bg-accent-quaternary/10 border-accent-quaternary/40',
};

type Strategy = 'momentum' | 'gainers' | 'losers' | 'all';

const STRATEGIES: { id: Strategy; name: string; description: string; icon: LucideIcon }[] = [
  { id: 'momentum', name: 'Momentum Radar', description: 'Strongest absolute movers first — ride the wave', icon: Zap },
  { id: 'gainers', name: 'Bull Scanner', description: 'Only assets with positive 24h momentum', icon: TrendingUp },
  { id: 'losers', name: 'Dip Hunter', description: 'Oversold assets for mean-reversion entries', icon: Target },
  { id: 'all', name: 'Full Market', description: 'Every tracked instrument, unfiltered', icon: BarChart3 },
];

export const InstitutionalTools: React.FC = () => {
  const navigate = useNavigate();
  useWalletSync();
  const prices = useTradingStore(s => s.prices);
  const priceChanges = useTradingStore(s => s.priceChanges);
  const [strategy, setStrategy] = useState<Strategy>('momentum');
  const { isElite, balance, missing, progress } = useEliteStatus();
  const [depositOpen, setDepositOpen] = useState(false);

  const rows = useMemo<SignalRow[]>(() => {
    const list: SignalRow[] = Object.entries(prices)
      .filter(([, p]) => p != null && p > 0)
      .map(([symbol, price]) => {
        const change = priceChanges[symbol] ?? 0;
        return {
          symbol,
          price,
          change,
          signal: signalOf(change),
          strength: Math.min(100, Math.round(Math.abs(change) * 12)),
        };
      });

    switch (strategy) {
      case 'gainers':
        return list.filter(r => r.change > 0).sort((a, b) => b.change - a.change);
      case 'losers':
        return list.filter(r => r.change < 0).sort((a, b) => a.change - b.change);
      case 'momentum':
        return list.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      default:
        return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }
  }, [prices, priceChanges, strategy]);

  const activeSignals = rows.filter(r => r.signal !== 'NEUTRAL').length;
  const gainers = rows.filter(r => r.change > 0).length;
  const losers = rows.filter(r => r.change < 0).length;
  const avgMove = rows.length > 0 ? rows.reduce((s, r) => s + Math.abs(r.change), 0) / rows.length : 0;

  const openTerminal = (symbol: string) => navigate(`/trade/terminal?symbol=${symbol}`);

  if (!isElite) {
    return (
      <div className="p-4 lg:p-8 animate-in fade-in duration-500">
        <TransferModal
          isOpen={depositOpen}
          onClose={() => setDepositOpen(false)}
          type="deposit"
          initialAmount={ELITE_REQUIREMENT}
        />
        <div className="max-w-2xl mx-auto mt-8 lg:mt-16">
          <div className="glass-card p-8 lg:p-12 text-center border-accent-primary/20 relative overflow-hidden holo-border">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-accent-primary/40 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] shadow-[0_0_30px_rgba(212,175,55,0.2)]">
              <Lock className="text-accent-primary" size={34} />
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-white uppercase tracking-[0.15em]">Elite Trade</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-primary text-black">VIP</span>
            </div>
            <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
              Institutional Tools — premium signals, momentum scanners and algorithmic presets — are
              reserved for Elite members. Deposit <span className="text-accent-primary font-bold">${ELITE_REQUIREMENT.toLocaleString()}</span> to unlock.
            </p>

            {/* Progress toward requirement */}
            <div className="max-w-sm mx-auto mb-8 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your balance</span>
                <span className="text-[10px] font-bold text-accent-primary">
                  ${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} / ${ELITE_REQUIREMENT.toLocaleString()}
                </span>
              </div>
              <div className="h-2.5 w-full bg-[#111] rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-accent-primary/50 via-accent-primary to-yellow-300 shadow-[0_0_10px_rgba(212,175,55,0.6)] transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2 text-right">
                ${missing.toLocaleString(undefined, { maximumFractionDigits: 2 })} to go
              </p>
            </div>

            <button
              onClick={() => setDepositOpen(true)}
              className="w-full max-w-sm mx-auto py-4 rounded-xl bg-gradient-to-r from-accent-primary via-yellow-400 to-yellow-600 text-sm font-bold text-black uppercase tracking-widest hover:shadow-[0_0_25px_rgba(212,175,55,0.7)] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Crown size={16} /> Upgrade Now — Deposit ${ELITE_REQUIREMENT.toLocaleString()}
            </button>

            <p className="text-[10px] text-slate-600 mt-6 leading-relaxed">
              Access unlocks automatically as soon as your wallet balance reaches ${ELITE_REQUIREMENT.toLocaleString()}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <LuxIcon icon={Settings2} size={28} />
            Institutional Tools
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Live market signals, momentum scanners and algorithmic presets — computed from the real-time feed.
          </p>
        </div>
        <button
          onClick={() => navigate('/trade/terminal')}
          className="btn-gold flex items-center gap-2 self-start md:self-auto"
        >
          Premium Chart <ArrowRight size={14} />
        </button>
      </div>

      {/* Market pulse tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Activity size={12} /> Market Pulse</p>
          <p className="text-2xl font-bold font-mono text-white">{avgMove.toFixed(2)}%</p>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">avg 24h move</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Zap size={12} /> Active Signals</p>
          <p className="text-2xl font-bold font-mono text-accent-primary">{activeSignals}</p>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">of {rows.length} tracked</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><TrendingUp size={12} /> Gainers</p>
          <p className="text-2xl font-bold font-mono text-accent-secondary">{gainers}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><TrendingDown size={12} /> Losers</p>
          <p className="text-2xl font-bold font-mono text-accent-quaternary">{losers}</p>
        </div>
      </div>

      {/* Strategy presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STRATEGIES.map((s, i) => {
          const Icon = s.icon;
          const active = strategy === s.id;
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setStrategy(s.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                active
                  ? 'bg-accent-primary/10 border-accent-primary/40 shadow-neon-gold'
                  : 'glass-card border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <LuxIconTile icon={Icon} size={36} iconSize={18} className={active ? 'border-gold/60' : ''} />
                <h4 className={`text-sm font-bold ${active ? 'text-accent-primary' : 'text-white'}`}>{s.name}</h4>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{s.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Signals table */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">
          Live Signals · {STRATEGIES.find(s => s.id === strategy)?.name}
        </h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full" style={{ minWidth: '640px' }}>
            <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
              <tr>
                <th className="text-left pb-4">Asset</th>
                <th className="text-right pb-4">Price</th>
                <th className="text-right pb-4">24h</th>
                <th className="text-left pb-4 pl-8">Signal</th>
                <th className="text-left pb-4">Strength</th>
                <th className="text-right pb-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-500">Waiting for the market feed…</td></tr>
              ) : rows.slice(0, 40).map(r => {
                const isPositive = r.change >= 0;
                return (
                  <tr key={r.symbol} className="group hover:bg-white/5 transition-all">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <AssetIcon symbol={r.symbol} size={28} />
                        <span className="font-bold text-white text-xs group-hover:text-accent-primary transition-colors">
                          {r.symbol.endsWith('USDT') ? r.symbol.replace('USDT', ' / USDT') : r.symbol}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-mono text-xs text-slate-300">
                      {r.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </td>
                    <td className={`py-3.5 text-right font-mono text-xs font-bold ${isPositive ? 'text-accent-secondary' : 'text-accent-quaternary'}`}>
                      {isPositive ? '+' : ''}{r.change.toFixed(2)}%
                    </td>
                    <td className="py-3.5 pl-8">
                      <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold tracking-widest ${SIGNAL_STYLE[r.signal]}`}>
                        {r.signal}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isPositive ? 'bg-accent-secondary' : 'bg-accent-quaternary'}`}
                          style={{ width: `${r.strength}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => openTerminal(r.symbol)}
                        className="px-3 py-1.5 bg-accent-primary/10 hover:bg-accent-primary text-accent-primary hover:text-black border border-accent-primary/20 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-600 mt-4 leading-relaxed">
          Signals are momentum-based indicators derived from live 24h price changes. They are informational tools, not investment advice.
        </p>
      </div>
    </div>
  );
};
