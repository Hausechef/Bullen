import React, { useEffect, useMemo, useState } from 'react';
import { Wallet, TrendingUp, History, PieChart, Download, Upload, ShieldCheck, Activity, Wallet2 } from 'lucide-react';
import { LuxIcon } from '../../components/common/LuxIcon';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTradingStore } from '../../stores/tradingStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSpotStore } from '../../stores/spotStore';
import { AssetIcon } from '../../components/common/AssetIcon';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useWalletSync } from '../../hooks/useWalletSync';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

import { TransferModal } from './TransferModal';
import { CryptoDepositModal } from '../../components/dashboard/CryptoDepositModal';

export const Portfolio: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferType, setTransferType] = useState<'deposit' | 'withdraw'>('deposit');
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);
  const [serverRequests, setServerRequests] = useState<any[]>([]);
  useWalletSync();
  const wallet = useTradingStore(s => s.wallet);
  const requests = useTransactionStore(s => s.requests);
  const positions = useTradingStore(s => s.positions);
  const assets = useTradingStore(s => s.assets) || [];
  const prices = useTradingStore(s => s.prices);
  const spotHoldings = useSpotStore(s => s.holdings);
  const loadSpotHoldings = useSpotStore(s => s.loadHoldings);
  const executeSpotTrade = useSpotStore(s => s.executeTrade);
  const spotExecuting = useSpotStore(s => s.executing);

  useEffect(() => { loadSpotHoldings(); }, [loadSpotHoldings]);

  const handleSpotSell = async (symbol: string, amount: number) => {
    const price = prices[`${symbol}USDT`];
    if (!price) {
      toast.error('Live price not available');
      return;
    }
    const err = await executeSpotTrade(symbol, 'sell', amount, price);
    if (err) { toast.error(err); return; }
    toast.success(`Sold ${amount} ${symbol} for $${(amount * price).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  };

  const closedPositions = useMemo(() => {
    return positions.filter(p => p.status === 'closed').sort((a, b) => {
      const ta = new Date(a.closedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.closedAt || b.createdAt || 0).getTime();
      return ta - tb;
    });
  }, [positions]);

  const pnlData = useMemo(() => {
    let cumulative = 0;
    return closedPositions.map(p => {
      cumulative += p.unrealizedPnL;
      return {
        name: new Date(p.closedAt || p.createdAt || 0).toLocaleDateString(),
        pnl: cumulative
      };
    });
  }, [closedPositions]);

  const holdings = useMemo(() => {
    const list = wallet.balance > 0 ? [{
      name: 'USD',
      description: 'Account Wallet',
      balance: wallet.balance,
      value: wallet.balance,
      allocation: 0,
    }] : [];
    
    let totalValue = wallet.balance;

    // Group assets by symbol
    const groupedAssets: Record<string, { name: string, description: string, balance: number, value: number }> = {};
    
    assets.forEach(a => {
      const val = a.amount * a.currentPrice;
      totalValue += val;
      
      if (!groupedAssets[a.symbol]) {
        groupedAssets[a.symbol] = {
          name: a.symbol,
          description: a.name,
          balance: 0,
          value: 0
        };
      }
      groupedAssets[a.symbol].balance += a.amount;
      groupedAssets[a.symbol].value += val;
    });

    Object.values(groupedAssets).forEach(assetGroup => {
      list.push({
        ...assetGroup,
        allocation: 0
      });
    });

    if (totalValue > 0) {
      list.forEach(item => {
        item.allocation = Math.round((item.value / totalValue) * 100);
      });
    }

    return list;
  }, [wallet.balance, assets]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser?.id) return;
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(50);
        setServerRequests(data || []);
      } catch {
        setServerRequests([]);
      }
    };
    loadTransactions();
    const interval = window.setInterval(loadTransactions, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const requestSource = serverRequests.length > 0 ? serverRequests : requests;
  const transactions = [...requestSource]
    .sort((a,b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime())
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      type: r.type,
      method: r.method,
      instructions: r.instructions,
      asset: r.currency || r.asset,
      amount: r.type === 'Deposit' ? `+${Number(r.amount).toLocaleString()}` : `-${Number(r.amount).toLocaleString()}`,
      status: r.status,
      time: new Date(r.date || r.created_at).toLocaleDateString()
    }));

  const openTransferModal = (type: 'deposit' | 'withdraw') => {
    setTransferType(type);
    setTransferModalOpen(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 relative">
      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        type={transferType}
      />
      <CryptoDepositModal
        isOpen={cryptoModalOpen}
        onClose={() => setCryptoModalOpen(false)}
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <LuxIcon icon={Wallet} size={28} />
            Wallet & Portfolio
          </h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-accent-secondary" />
            Portfolio data from your account wallet
          </p>
        </div>
        <div className="flex gap-3 relative z-10">
          <button
            onClick={() => openTransferModal('deposit')}
            className="px-6 py-2.5 bg-accent-secondary/10 border border-accent-secondary/30 rounded-xl text-xs font-bold text-accent-secondary flex items-center gap-2 hover:bg-accent-secondary hover:text-black transition-all shadow-neon-emerald"
          >
            <Download size={14} /> Deposit
          </button>
          <button
            onClick={() => setCryptoModalOpen(true)}
            className="px-6 py-2.5 bg-accent-primary/10 border border-accent-primary/30 rounded-xl text-xs font-bold text-accent-primary flex items-center gap-2 hover:bg-accent-primary hover:text-black transition-all shadow-neon-gold"
          >
            <Wallet2 size={14} /> Deposit with Crypto
          </button>
          <button
            onClick={() => openTransferModal('withdraw')}
            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <Upload size={14} /> Withdraw
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Balances & Chart */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Balance */}
            <div className="glass-card p-6 border-accent-primary/20 md:col-span-2 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Estimated Balance</p>
               <div className="flex items-baseline gap-4 mb-4">
                  <h3 className="text-4xl font-bold text-text tracking-tight font-mono">${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
               </div>
               <div className="flex items-center gap-6 mt-6">
                  <div>
                     <p className="label-eyebrow mb-1">Available Margin</p>
                     <p className="text-text font-mono font-bold">${Math.max(0, wallet.balance - wallet.marginUsed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                     <p className="label-eyebrow mb-1">In Positions</p>
                     <p className="text-text font-mono font-bold">${wallet.marginUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
               </div>
               <div className="flex items-center gap-6 mt-6">
                  <div>
                     <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Available Margin</p>
                     <p className="text-white font-mono font-bold">${Math.max(0, wallet.balance - wallet.marginUsed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                     <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">In Positions</p>
                     <p className="text-white font-mono font-bold">${wallet.marginUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
               </div>
            </div>

            {/* PNL Today */}
            <div className="glass-card p-6 border-accent-secondary/20 flex flex-col justify-center">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Realized P&L</p>
               <h3 className="text-2xl font-bold text-accent-secondary drop-shadow-[0_0_8px_rgba(0,230,118,0.3)]">${wallet.realizedPnL.toLocaleString()}</h3>
               <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-slate-400">
                  <Activity size={12} className="text-accent-secondary" />
                  Live wallet data
               </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="glass-card p-6 holo-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Portfolio Performance</h3>
            </div>
              <div className="h-[300px] w-full rounded-xl border border-border bg-surface/40 flex flex-col items-center justify-center px-2 pt-4">
                {pnlData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pnlData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#ffffff33" fontSize={10} tickMargin={10} minTickGap={30} />
                      <YAxis stroke="#ffffff33" fontSize={10} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#D4AF37' }}
                      />
                      <Area type="monotone" dataKey="pnl" stroke="#D4AF37" fillOpacity={1} fill="url(#colorPnL)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
                      <Activity size={20} className="text-text-dim" />
                    </div>
                    <p className="text-sm font-medium text-text-muted">Portfolio history not available yet</p>
                    <p className="text-xs text-text-dim max-w-xs">
                      Performance history will appear once real trade records are available.
                    </p>
                  </div>
                )}
              </div>
          </div>

          {/* Spot Holdings */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Spot Holdings</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="text-left pb-4 font-bold">Asset</th>
                    <th className="text-right pb-4 font-bold">Amount</th>
                    <th className="text-right pb-4 font-bold">Avg Buy</th>
                    <th className="text-right pb-4 font-bold">Value (USD)</th>
                    <th className="text-right pb-4 font-bold">P&amp;L</th>
                    <th className="text-right pb-4 font-bold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {spotHoldings.length > 0 ? spotHoldings.map((h) => {
                    const livePrice = prices[`${h.symbol}USDT`] ?? null;
                    const value = livePrice != null ? h.amount * livePrice : null;
                    const pnl = livePrice != null ? (livePrice - h.avgBuyPrice) * h.amount : null;
                    const pnlPositive = (pnl ?? 0) >= 0;
                    return (
                      <tr key={h.symbol} className="group hover:bg-white/5 transition-all">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <AssetIcon symbol={h.symbol} size={32} />
                            <p className="font-bold text-text text-sm group-hover:text-gold transition-colors">{h.symbol}</p>
                          </div>
                        </td>
                        <td className="py-4 text-right font-mono text-sm text-text-muted">
                          {h.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                        </td>
                        <td className="py-4 text-right font-mono text-sm text-text-muted">
                          ${h.avgBuyPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </td>
                        <td className="py-4 text-right font-mono text-sm text-text font-bold">
                          {value != null ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className={`py-4 text-right font-mono text-xs font-bold ${pnl == null ? 'text-slate-500' : pnlPositive ? 'text-accent-secondary' : 'text-accent-quaternary'}`}>
                          {pnl != null ? `${pnlPositive ? '+' : ''}$${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleSpotSell(h.symbol, h.amount)}
                            disabled={spotExecuting || livePrice == null}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-accent-quaternary/10 text-accent-quaternary border border-accent-quaternary/30 hover:bg-accent-quaternary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Sell All
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                        No spot holdings yet. Switch the order panel to Spot mode to buy &amp; hold crypto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Holdings List */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Asset Holdings</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="text-left pb-4 font-bold">Asset</th>
                    <th className="text-right pb-4 font-bold">Balance</th>
                    <th className="text-right pb-4 font-bold">Value (USD)</th>
                    <th className="text-right pb-4 font-bold">Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {holdings.length > 0 ? holdings.map((asset) => (
                    <tr key={asset.name} className="group hover:bg-white/5 transition-all">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-gold text-xs">$</div>
                          <div>
                            <p className="font-bold text-text text-sm group-hover:text-gold transition-colors">{asset.name}</p>
                            <p className="text-[10px] text-text-dim">{asset.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right font-mono text-sm text-text-muted">{asset.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-4 text-right font-mono text-sm text-text font-bold">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-4 text-right text-xs text-gold font-bold">{asset.allocation}%</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-sm text-slate-500">
                        No balances found. Deposit funds to start trading.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Allocation Pie Chart */}
          <div className="glass-card p-6 text-center">
             <div className="flex items-center gap-3 mb-6">
               <LuxIcon icon={PieChart} size={20} />
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Allocation Matrix</h3>
             </div>
             
             <div className="h-[220px] w-full rounded-xl border border-white/5 bg-black/20 flex flex-col items-center justify-center px-4">
               {holdings.length > 0 ? (
                 <>
                   <span className="label-eyebrow">Total Value</span>
                   <span className="text-2xl font-bold text-text font-mono mt-2">${holdings.reduce((acc, h) => acc + h.value, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                   <span className="text-xs text-text-dim mt-2">USD + Assets</span>
                 </>
               ) : (
                 <>
                   <PieChart size={24} className="text-text-dim mb-2" />
                   <span className="text-sm font-medium text-text-muted">No allocation data</span>
                   <span className="text-xs text-text-dim mt-1">Add funds to see portfolio breakdown.</span>
                 </>
               )}
             </div>

             <div className="grid grid-cols-2 gap-3 mt-4">
               {holdings.map(asset => (
                 <div key={asset.name} className="flex justify-between items-center bg-surface p-2.5 rounded-lg border border-border">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_6px_rgba(212,175,55,0.5)]" />
                     <span className="text-xs font-bold text-text">{asset.name}</span>
                   </div>
                   <span className="text-xs font-mono text-gold">{asset.allocation}%</span>
                 </div>
               ))}
             </div>
          </div>

          {/* Transaction History */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <History className="text-accent-secondary" size={20} />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t('transactions')}</h3>
              </div>
              <button onClick={() => navigate('/trade/transactions')} className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors">View All</button>
            </div>

            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-4">No transactions</div>
              ) : transactions.map(tx => (
                <div key={tx.id} className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        tx.type === 'Deposit' ? 'bg-accent-secondary/10 text-accent-secondary' :
                        tx.type === 'Withdrawal' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-accent-primary/10 text-accent-primary'
                      }`}>
                        {tx.type === 'Deposit' ? <Upload size={14} /> : 
                         tx.type === 'Withdrawal' ? <Download size={14} /> : 
                         <TrendingUp size={14} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{tx.type} {tx.asset}</p>
                        <p className="text-[10px] text-slate-400">{tx.time} {tx.method ? ` - ${tx.method}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold font-mono ${
                        tx.amount.startsWith('+') ? 'text-accent-secondary' : 
                        tx.amount.startsWith('-') ? 'text-white' : 'text-accent-primary'
                      }`}>{tx.amount}</p>
                      <p className="text-[10px] text-slate-500">{tx.status}</p>
                    </div>
                  </div>
                  {tx.instructions && (
                    <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-300 bg-black/20 p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest block mb-1">Instructions</span>
                      {tx.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
