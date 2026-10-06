import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../../stores/tradingStore';
import { useSpotStore } from '../../stores/spotStore';
import { AssetIcon } from '../common/AssetIcon';
import { useTradingContext } from '../../contexts/TradingContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

type HistoryEntry = {
  id: string;
  symbol: string;
  direction: string;
  price: number;
  size: number;
  leverage: number;
  pnl?: number;
  status: string;
  kind: 'position' | 'order';
  orderKind: string;
};

export const PositionsAndOrdersPanel = () => {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'spot' | 'history'>('positions');
  const [hideOtherSymbols, setHideOtherSymbols] = useState(false);

  const { currentPair } = useTradingContext();
  const positions = useTradingStore(s => s.positions);
  const orders = useTradingStore(s => s.orders);
  const cancelOrderAction = useTradingStore(s => s.cancelOrder);
  const closePositionAction = useTradingStore(s => s.closePosition);
  const prices = useTradingStore(s => s.prices);

  const spotHoldings = useSpotStore(s => s.holdings);
  const loadSpotHoldings = useSpotStore(s => s.loadHoldings);
  const executeSpotTrade = useSpotStore(s => s.executeTrade);
  const spotExecuting = useSpotStore(s => s.executing);

  useEffect(() => { loadSpotHoldings(); }, [loadSpotHoldings]);

  const visibleSpotHoldings = spotHoldings.filter(
    h => !hideOtherSymbols || `${h.symbol}USDT` === currentPair,
  );

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

  const filterBySymbol = (item: any) => !hideOtherSymbols || item.symbol === currentPair;

  const openPositions = positions.filter(p => p.status === 'open' && filterBySymbol(p));
  const pendingOrders = orders.filter(o => o.status === 'pending' && filterBySymbol(o));

  // Combined history: closed positions + filled/canceled orders
  const closedPositions: HistoryEntry[] = positions
    .filter(p => p.status === 'closed' && filterBySymbol(p))
    .map(p => ({
      id: p.id,
      symbol: p.symbol,
      direction: p.type,
      price: p.entryPrice,
      size: p.size,
      leverage: p.leverage,
      pnl: p.unrealizedPnL,
      status: 'closed',
      kind: 'position' as const,
      orderKind: 'Market',
    }));

  const nonPendingOrders: HistoryEntry[] = orders
    .filter(o => o.status !== 'pending' && filterBySymbol(o))
    .map(o => ({
      id: o.id,
      symbol: o.symbol,
      direction: o.positionType,
      price: o.price,
      size: o.size,
      leverage: o.leverage,
      pnl: undefined,
      status: o.status,
      kind: 'order' as const,
      orderKind: o.type,
    }));

  const orderHistory = [...closedPositions, ...nonPendingOrders].slice(-30).reverse();

  const handleClosePosition = (id: string, price: number) => {
    closePositionAction(id, price);
    supabase.from('positions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', id)
      .then(({ error }) => { if (error) console.error('[trade] close position sync:', error); });
    toast.success('Position closed successfully');
  };

  const handleCancelOrder = (id: string) => {
    cancelOrderAction(id);
    supabase.from('orders')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .then(({ error }) => { if (error) console.error('[trade] cancel order sync:', error); });
    toast.success('Order canceled successfully');
  };

  return (
    <div className="glass-card p-6 relative overflow-x-hidden flex-1 flex flex-col h-full min-h-[400px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-y-3 mb-6 relative z-10 border-b border-white/5 pb-2">
        <div className="flex space-x-6 overflow-x-auto custom-scrollbar whitespace-nowrap max-w-full">
          <button
            className={`text-sm font-bold tracking-wide transition-colors relative pb-2 ${activeTab === 'positions' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('positions')}
          >
            Open Positions ({openPositions.length})
            {activeTab === 'positions' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-primary shadow-neon-gold" />}
          </button>
          <button
            className={`text-sm font-bold tracking-wide transition-colors relative pb-2 ${activeTab === 'orders' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('orders')}
          >
            Pending Orders ({pendingOrders.length})
            {activeTab === 'orders' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-primary shadow-neon-gold" />}
          </button>
          <button
            className={`text-sm font-bold tracking-wide transition-colors relative pb-2 ${activeTab === 'spot' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('spot')}
          >
            Spot ({visibleSpotHoldings.length})
            {activeTab === 'spot' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-primary shadow-neon-gold" />}
          </button>
          <button
            className={`text-sm font-bold tracking-wide transition-colors relative pb-2 ${activeTab === 'history' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('history')}
          >
            Order History ({orderHistory.length})
            {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-primary shadow-neon-gold" />}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
               type="checkbox"
               checked={hideOtherSymbols}
               onChange={(e) => setHideOtherSymbols(e.target.checked)}
               className="peer sr-only"
            />
            <div className="w-4 h-4 rounded border border-white/20 bg-surface-bg flex items-center justify-center peer-checked:bg-accent-primary peer-checked:border-accent-primary transition-colors">
               <svg className="w-3 h-3 text-black opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
               </svg>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 group-hover:text-white transition-colors">Hide other symbols</span>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto relative z-10 flex-1 custom-scrollbar">
        {activeTab === 'positions' && (
          <table className="w-full relative" style={{ minWidth: '580px' }}>
            <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 sticky top-0 bg-surface-card z-20">
              <tr>
                <th className="text-left pb-4 pt-2">Market</th>
                <th className="text-left pb-4 pt-2">Side / Lev</th>
                <th className="text-left pb-4 pt-2">Size (USD)</th>
                <th className="text-left pb-4 pt-2">Entry / Mark</th>
                <th className="text-right pb-4 pt-2">P&L</th>
                <th className="text-right pb-4 pt-2 sticky right-0 bg-surface-card">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {openPositions.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">No open positions</td></tr>
              ) : (
                openPositions.map((pos) => {
                  const currentPrice = prices[pos.symbol] || pos.entryPrice;
                  const pnlPct = pos.margin > 0 ? (pos.unrealizedPnL / pos.margin) * 100 : 0;
                  const isPositive = pos.unrealizedPnL >= 0;
                  const notionalUSD = pos.size * pos.entryPrice;

                  return (
                    <tr key={pos.id} className="group hover:bg-white/5 transition-all duration-200">
                      <td className="py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <AssetIcon symbol={pos.symbol} size={32} />
                            <div>
                              <p className="font-bold text-white text-xs leading-none mb-1 group-hover:text-accent-primary transition-colors">{pos.symbol}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{pos.marginType}</p>
                            </div>
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <div className="flex flex-col text-xs font-bold">
                          <span className={pos.type === 'Long' ? 'text-accent-secondary' : 'text-accent-quaternary'}>{pos.type}</span>
                          <span className="text-[10px] text-slate-500">{pos.leverage}x</span>
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <p className="text-xs font-bold text-slate-300">{pos.size}</p>
                          <p className="text-[10px] font-mono text-accent-primary">${notionalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                            <p className="text-xs font-mono font-bold text-slate-400">{pos.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                            <p className="text-[10px] font-mono text-slate-500">{currentPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                        </div>
                      </td>
                      <td className="py-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                            <span className={`text-xs font-bold ${isPositive ? 'text-success drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]' : 'text-danger drop-shadow-[0_0_5px_rgba(255,61,0,0.3)]'}`}>
                               {isPositive ? '+' : ''}{pos.unrealizedPnL.toFixed(2)} USD
                            </span>
                            <span className={`text-[10px] font-bold ${isPositive ? 'text-success/60' : 'text-danger/60'}`}>
                               {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                            </span>
                        </div>
                      </td>
                      <td className="py-4 text-right whitespace-nowrap sticky right-0 bg-surface-card group-hover:bg-white/5">
                        <button
                          onClick={() => handleClosePosition(pos.id, currentPrice)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-accent-quaternary hover:text-white border border-white/10 rounded text-[10px] font-bold text-slate-400 transition-colors"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'spot' && (
          <table className="w-full relative" style={{ minWidth: '580px' }}>
            <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 sticky top-0 bg-surface-card z-20">
              <tr>
                <th className="text-left pb-4 pt-2">Asset</th>
                <th className="text-left pb-4 pt-2">Amount</th>
                <th className="text-left pb-4 pt-2">Avg Buy / Mark</th>
                <th className="text-right pb-4 pt-2">Value (USD)</th>
                <th className="text-right pb-4 pt-2">P&L</th>
                <th className="text-right pb-4 pt-2 sticky right-0 bg-surface-card">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {visibleSpotHoldings.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">No spot holdings. Switch the order panel to Spot mode to buy & hold crypto.</td></tr>
              ) : (
                visibleSpotHoldings.map((h) => {
                  const livePrice = prices[`${h.symbol}USDT`] ?? null;
                  const value = livePrice != null ? h.amount * livePrice : null;
                  const pnl = livePrice != null ? (livePrice - h.avgBuyPrice) * h.amount : null;
                  const pnlPct = livePrice != null && h.avgBuyPrice > 0
                    ? ((livePrice - h.avgBuyPrice) / h.avgBuyPrice) * 100
                    : null;
                  const isPositive = (pnl ?? 0) >= 0;

                  return (
                    <tr key={h.symbol} className="group hover:bg-white/5 transition-all duration-200">
                      <td className="py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <AssetIcon symbol={h.symbol} size={32} />
                            <div>
                              <p className="font-bold text-white text-xs leading-none mb-1 group-hover:text-accent-primary transition-colors">{h.symbol}</p>
                              <p className="text-[10px] text-slate-500 font-medium">Spot</p>
                            </div>
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <p className="text-xs font-mono font-bold text-slate-300">
                          {h.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                        </p>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                            <p className="text-xs font-mono font-bold text-slate-400">{h.avgBuyPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                            <p className="text-[10px] font-mono text-slate-500">{livePrice != null ? livePrice.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}</p>
                        </div>
                      </td>
                      <td className="py-4 text-right whitespace-nowrap">
                        <p className="text-xs font-mono font-bold text-white">
                          {value != null ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </p>
                      </td>
                      <td className="py-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                            <span className={`text-xs font-bold ${pnl == null ? 'text-slate-500' : isPositive ? 'text-success drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]' : 'text-danger drop-shadow-[0_0_5px_rgba(255,61,0,0.3)]'}`}>
                               {pnl != null ? `${isPositive ? '+' : ''}${pnl.toFixed(2)} USD` : '—'}
                            </span>
                            {pnlPct != null && (
                              <span className={`text-[10px] font-bold ${isPositive ? 'text-success/60' : 'text-danger/60'}`}>
                                 {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="py-4 text-right whitespace-nowrap sticky right-0 bg-surface-card group-hover:bg-white/5">
                        <button
                          onClick={() => handleSpotSell(h.symbol, h.amount)}
                          disabled={spotExecuting || livePrice == null}
                          className="px-3 py-1.5 bg-white/5 hover:bg-accent-quaternary hover:text-white border border-white/10 rounded text-[10px] font-bold text-slate-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Sell All
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'orders' && (
          <table className="w-full relative" style={{ minWidth: '560px' }}>
            <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 sticky top-0 bg-surface-card z-20">
              <tr>
                <th className="text-left pb-4 pt-2">Market</th>
                <th className="text-left pb-4 pt-2">Type</th>
                <th className="text-left pb-4 pt-2">Order Price</th>
                <th className="text-left pb-4 pt-2">Size (USD)</th>
                <th className="text-right pb-4 pt-2 sticky right-0 bg-surface-card">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {pendingOrders.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">No pending orders</td></tr>
              ) : (
                pendingOrders.map((order) => {
                  const notionalUSD = order.size * order.price;
                  return (
                    <tr key={order.id} className="group hover:bg-white/5 transition-all duration-200">
                      <td className="py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <AssetIcon symbol={order.symbol} size={32} />
                            <div>
                              <p className="font-bold text-white text-xs leading-none mb-1 group-hover:text-accent-primary transition-colors">{order.symbol}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{order.marginType}</p>
                            </div>
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                          <div className="text-xs font-bold transition-all flex flex-col">
                              <div>
                                  <span className={`${order.positionType === 'Long' ? 'text-accent-secondary' : 'text-accent-quaternary'} mr-2`}>{order.positionType}</span>
                                  <span className="text-slate-300">{order.type}</span>
                              </div>
                              <span className="text-[10px] text-slate-500">{order.leverage}x</span>
                          </div>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                          <span className="text-xs font-mono font-bold text-slate-400">{order.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{order.size}</span>
                          <span className="text-[10px] font-mono text-accent-primary">${notionalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                      </td>
                      <td className="py-4 text-right whitespace-nowrap sticky right-0 bg-surface-card group-hover:bg-white/5">
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-zinc-700 hover:text-white border border-white/10 rounded text-[10px] font-bold text-slate-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'history' && (
          <table className="w-full relative" style={{ minWidth: '620px' }}>
            <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 sticky top-0 bg-surface-card z-20">
              <tr>
                <th className="text-left pb-4 pt-2">Market</th>
                <th className="text-left pb-4 pt-2">Type</th>
                <th className="text-left pb-4 pt-2">Size (USD)</th>
                <th className="text-left pb-4 pt-2">Price</th>
                <th className="text-right pb-4 pt-2">P&L</th>
                <th className="text-right pb-4 pt-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {orderHistory.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">No recent order history</td></tr>
              ) : (
                orderHistory.map((entry) => {
                  const notionalUSD = entry.size * entry.price;
                  const isPnlPositive = (entry.pnl ?? 0) >= 0;
                  return (
                    <tr key={entry.id} className="group hover:bg-white/5 transition-all duration-200 opacity-80 hover:opacity-100">
                      <td className="py-4 whitespace-nowrap text-xs font-bold text-white">{entry.symbol}</td>
                      <td className="py-4 whitespace-nowrap text-xs text-slate-400">
                        <div className="flex flex-col">
                          <div>
                            <span className={`${entry.direction === 'Long' ? 'text-accent-secondary' : 'text-accent-quaternary'} mr-1`}>{entry.direction}</span>
                            <span>{entry.orderKind}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{entry.leverage}x</span>
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-300">{entry.size}</span>
                          <span className="text-[10px] font-mono text-accent-primary">${notionalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap text-xs font-mono text-slate-400">{entry.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                      <td className="py-4 whitespace-nowrap text-right">
                        {entry.pnl !== undefined ? (
                          <span className={`text-xs font-bold ${isPnlPositive ? 'text-success' : 'text-danger'}`}>
                            {isPnlPositive ? '+' : ''}{entry.pnl.toFixed(2)} USD
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-4 whitespace-nowrap text-right">
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
                           entry.status === 'filled' ? 'bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20' :
                           entry.status === 'closed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                           'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                           {entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
