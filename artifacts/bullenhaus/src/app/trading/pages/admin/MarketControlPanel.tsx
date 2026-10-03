import React, { useState } from 'react';
import { useForexStore, ForexTrend } from '../../stores/forexStore';
import { useTradingStore } from '../../stores/tradingStore';
import { Activity, Play, Pause, Zap, BarChart2, Hash, Edit3, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { ASSETS } from '../../components/dashboard/AssetSelector';
import { AssetIcon } from '../../components/common/AssetIcon';
import { useTranslation } from 'react-i18next';

// Dynamic slider ranges per symbol type
function volRange(symbol: string) {
  if (symbol.startsWith('XA') || symbol.startsWith('XP'))
    return { min: 0.01, max: 5.0, step: 0.01 };
  if (symbol.includes('JPY'))
    return { min: 0.001, max: 0.15, step: 0.001 };
  if (['USDTRY','EURTRY','GBPTRY','USDMXN','USDZAR','USDSEK','USDNOK','USDDKK','USDPLN','USDCNH'].includes(symbol))
    return { min: 0.001, max: 0.05, step: 0.001 };
  return { min: 0.00001, max: 0.001, step: 0.00001 };
}

function spreadRange(symbol: string) {
  if (symbol.startsWith('XA') || symbol.startsWith('XP'))
    return { min: 0, max: 2.0, step: 0.01 };
  if (symbol.includes('JPY'))
    return { min: 0, max: 0.05, step: 0.001 };
  if (['USDTRY','EURTRY','GBPTRY','USDMXN','USDZAR'].includes(symbol))
    return { min: 0, max: 0.05, step: 0.001 };
  return { min: 0, max: 0.01, step: 0.00001 };
}

function fmtPrice(symbol: string, price: number) {
  if (symbol.startsWith('XA') || symbol.startsWith('XP')) return price.toFixed(2);
  if (symbol.includes('JPY')) return price.toFixed(3);
  if (['USDTRY','EURTRY','GBPTRY','USDMXN','USDZAR','USDSEK','USDNOK','USDDKK','USDPLN','USDCNH'].includes(symbol))
    return price.toFixed(3);
  return price.toFixed(5);
}

export const MarketControlPanel = () => {
  const { t } = useTranslation(['common']);
  const {
    pairs,
    pinPrice,
    setVolatility,
    setSpread,
    setTrend,
    togglePause,
    resetMarket,
  } = useForexStore();
  const { priceOverrides, setPriceOverride, prices } = useTradingStore();

  const [globalSymbol, setGlobalSymbol] = useState('');
  const [globalPrice, setGlobalPrice] = useState('');
  const [pairPrices, setPairPrices] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'Crypto' | 'Forex' | 'Metals'>('Crypto');

  const allSymbols = [...ASSETS[activeTab]].sort();

  // Global override (any symbol including crypto)
  const handleSetGlobalOverride = async () => {
    if (!globalSymbol.trim()) {
      toast.error(t('adminMarket.toast.symbolReq'));
      return;
    }
    const sym = globalSymbol.trim().toUpperCase();
    try {
      if (!globalPrice) {
        setPriceOverride(sym, null);
        await supabase.from('price_overrides').delete().eq('symbol', sym);
        toast.success(t('adminMarket.toast.removed', { symbol: sym }));
      } else {
        const price = parseFloat(globalPrice);
        setPriceOverride(sym, price);
        if (pairs[sym]) {
          pinPrice(sym, price);
        }
        await supabase.from('price_overrides').upsert({ symbol: sym, price }, { onConflict: 'symbol' });
        toast.success(t('adminMarket.toast.overrideSet', { sym, price: globalPrice }));
      }
      setGlobalSymbol('');
      setGlobalPrice('');
    } catch {
      toast.error(t('adminMarket.toast.overrideFail', { sym }));
    }
  };

  return (
    <div className="col-span-12 glass-card p-6 border-white/5 space-y-8 animate-in fade-in">

      {/* ── Global Override ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Zap size={18} className="text-accent-secondary" /> {t('adminMarket.engine.global.title')}
        </h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 bg-white/5 rounded border border-white/10">
          {t('adminMarket.engine.global.adminTool')}
        </span>
      </div>

      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
            {t('adminMarket.engine.global.symbolLabel')}
          </label>
          <input
            type="text"
            value={globalSymbol}
            onChange={(e) => setGlobalSymbol(e.target.value)}
            placeholder="BTCUSDT"
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-accent-primary uppercase"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
            {t('adminMarket.engine.global.priceLabel')}
          </label>
          <input
            type="number"
            step="any"
            value={globalPrice}
            onChange={(e) => setGlobalPrice(e.target.value)}
            placeholder="e.g. 150000"
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-accent-primary"
          />
        </div>
        <button
          onClick={handleSetGlobalOverride}
          className="px-6 py-2 h-[38px] bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary font-bold rounded-lg text-xs transition-colors flex items-center gap-2"
        >
          <Lock size={14} /> {t('adminMarket.engine.global.fixBtn')}
        </button>
      </div>

      {/* Active overrides badge list */}
      {Object.keys(priceOverrides).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(priceOverrides).map(([sym, pr]) => (
            <div
              key={sym}
              className="flex items-center gap-2 bg-accent-primary/10 border border-accent-primary/20 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-accent-primary"
            >
              <Lock size={10} />
              <span className="uppercase">{sym}</span> = {pr}
              <button
                onClick={async () => {
                  try {
                    setPriceOverride(sym, null);
                    if (pairs[sym]?.isPaused) togglePause(sym);
                    await supabase.from('price_overrides').delete().in('symbol', [
                      sym,
                      `${sym}_trend`,
                      `${sym}_volatility`,
                      `${sym}_spread`,
                      `${sym}_isPaused`
                    ]);
                    toast.success(t('adminMarket.toast.removed', { symbol: sym }));
                  } catch {
                    toast.error(t('adminMarket.toast.removeFail', { sym }));
                  }
                }}
                className="ml-1 hover:text-white transition-colors"
                title={t('adminMarket.engine.cards.unfix')}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <hr className="border-white/5" />

      {/* ── Crypto, Forex & Metals Simulation Engine ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Zap size={18} className="text-slate-400" /> {t('adminMarket.engine.title')}
        </h3>
        <span className="text-[9px] text-slate-500 uppercase tracking-widest">
          <Lock size={9} className="inline mr-1" />{t('adminMarket.engine.freezeNotice')}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {(['Crypto', 'Forex', 'Metals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/30'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
              }`}
            >
              {t(`adminMarket.engine.tabs.${tab.toLowerCase()}`)}
            </button>
          ))}
        </div>
  
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {allSymbols.map(sym => {
          const pair = pairs[sym] || {
            symbol: sym,
            price: prices[sym] || 1.0,
            basePrice: prices[sym] || 1.0,
            change24h: 0,
            volatility: (prices[sym] || 1.0) * 0.0001,
            spread: (prices[sym] || 1.0) * 0.0001,
            trend: 'sideways' as ForexTrend,
            isPaused: false
          };
          
          const ensureInit = () => {
            if (!pairs[sym]) {
              useForexStore.getState().pinPrice(sym, prices[sym] || 1.0);
              useForexStore.getState().setPaused(sym, false);
            }
          };

          const isPinned = priceOverrides[sym] !== undefined;
          const vRange = volRange(sym);
          const sRange = spreadRange(sym);

          return (
            <div
              key={sym}
              className={`p-5 rounded-2xl border transition-all ${
                isPinned
                  ? 'bg-accent-primary/5 border-accent-primary/30'
                  : pair.isPaused
                  ? 'bg-black/40 border-white/5 grayscale'
                  : 'glass-card-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AssetIcon symbol={pair.symbol} size={24} />
                    <h4 className="text-xl font-bold text-white tracking-tight">
                      {pair.symbol?.substring(0, 3)} / {pair.symbol?.substring(3)}
                    </h4>
                    {isPinned && (
                      <span className="text-[9px] font-bold text-accent-primary bg-accent-primary/10 border border-accent-primary/30 px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                        <Lock size={8} /> {t('adminMarket.engine.cards.fixedBadge')}
                      </span>
                    )}
                  </div>
                  <p className={`text-2xl font-mono font-bold leading-none ${
                    pair.change24h >= 0
                      ? 'text-accent-secondary drop-shadow-[0_0_8px_rgba(0,230,118,0.3)]'
                      : 'text-accent-quaternary drop-shadow-[0_0_8px_rgba(255,61,0,0.3)]'
                  }`}>
                    {fmtPrice(pair.symbol, pair.price)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (window.confirm(t('adminMarket.toast.confirmReset'))) {
                          try {
                            resetMarket(pair.symbol);
                            setPriceOverride(pair.symbol, null);
                            // Delete all overrides for this symbol from Supabase!
                            await supabase.from('price_overrides').delete().in('symbol', [
                              pair.symbol,
                              `${pair.symbol}_trend`,
                              `${pair.symbol}_volatility`,
                              `${pair.symbol}_spread`,
                              `${pair.symbol}_isPaused`
                            ]);
                            toast.success(t('adminMarket.toast.resetOk', { sym: pair.symbol }));
                          } catch {
                            toast.error(t('adminMarket.toast.resetFail'));
                          }
                        }
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all shadow-lg text-[10px] font-bold uppercase tracking-widest"
                      title={t('adminMarket.engine.cards.reset')}
                    >
                      {t('adminMarket.engine.cards.resetBtn')}
                    </button>
                    <button
                      onClick={async () => {
                        ensureInit();
                        const nextPaused = !pair.isPaused;
                        togglePause(pair.symbol);
                        try {
                          await supabase.from('price_overrides').upsert({ symbol: `${pair.symbol}_isPaused`, price: nextPaused ? 1 : 0 }, { onConflict: 'symbol' });
                          toast.success(`${pair.symbol} ${nextPaused ? 'paused' : 'resumed'}`);
                        } catch {
                          toast.error(t('adminMarket.toast.pauseFail'));
                        }
                      }}
                      className={`p-2 rounded-lg text-white transition-all shadow-lg ${
                        pair.isPaused ? 'bg-orange-500 hover:bg-orange-400' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                      title={pair.isPaused ? t('adminMarket.engine.cards.resumeFeed') : t('adminMarket.engine.cards.pauseFeed')}
                    >
                      {pair.isPaused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Manual Price Pin */}
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Hash size={12} /> {t('adminMarket.engine.cards.fixPriceLabel')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder={t('adminMarket.engine.cards.pricePlaceholder', { price: fmtPrice(pair.symbol, pair.price) })}
                      value={pairPrices[pair.symbol] || ''}
                      onChange={(e) => setPairPrices(prev => ({ ...prev, [pair.symbol]: e.target.value }))}
                      className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-accent-primary"
                    />
                    <button
                      onClick={async () => {
                        ensureInit();
                        const val = pairPrices[pair.symbol];
                        if (!val) { toast.error(t('adminMarket.toast.invalidPrice')); return; }
                        try {
                          const price = parseFloat(val);
                          pinPrice(pair.symbol, price);
                          setPriceOverride(pair.symbol, price);
                          await supabase.from('price_overrides').upsert({ symbol: pair.symbol, price }, { onConflict: 'symbol' });
                          toast.success(t('adminMarket.toast.fixedOk', { sym: pair.symbol, price: fmtPrice(pair.symbol, price) }));
                          setPairPrices(prev => ({ ...prev, [pair.symbol]: '' }));
                        } catch {
                          toast.error(t('adminMarket.toast.fixedFail', { sym: pair.symbol }));
                        }
                      }}
                      className="px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <Lock size={12} /> {t('adminMarket.engine.cards.fix')}
                    </button>
                    {isPinned && (
                      <button
                        onClick={async () => {
                          try {
                            setPriceOverride(pair.symbol, null);
                            if (pair.isPaused) togglePause(pair.symbol);
                            await supabase.from('price_overrides').delete().in('symbol', [
                              pair.symbol,
                              `${pair.symbol}_trend`,
                              `${pair.symbol}_volatility`,
                              `${pair.symbol}_spread`,
                              `${pair.symbol}_isPaused`
                            ]);
                            toast.success(t('adminMarket.toast.unfixedOk', { sym: pair.symbol }));
                          } catch {
                            toast.error(t('adminMarket.toast.unfixedFail', { sym: pair.symbol }));
                          }
                        }}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-300 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <Unlock size={12} /> {t('adminMarket.engine.cards.unfix')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Volatility & Spread */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Activity size={12} /> {t('adminMarket.engine.cards.volatility')}
                    </label>
                    <input
                      type="range"
                      min={vRange.min}
                      max={vRange.max}
                      step={vRange.step}
                      value={Math.min(pair.volatility, vRange.max)}
                      onChange={(e) => { ensureInit(); setVolatility(pair.symbol, parseFloat(e.target.value)); }}
                      onMouseUp={async (e) => {
                        try {
                          const val = parseFloat((e.target as HTMLInputElement).value);
                          await supabase.from('price_overrides').upsert({ symbol: `${pair.symbol}_volatility`, price: val }, { onConflict: 'symbol' });
                        } catch {
                          toast.error(t('adminMarket.toast.volFailed'));
                        }
                      }}
                      onTouchEnd={async (e) => {
                        try {
                          const val = parseFloat((e.target as HTMLInputElement).value);
                          await supabase.from('price_overrides').upsert({ symbol: `${pair.symbol}_volatility`, price: val }, { onConflict: 'symbol' });
                        } catch {
                          toast.error(t('adminMarket.toast.volFailed'));
                        }
                      }}
                      className="w-full accent-white"
                      disabled={isPinned}
                    />
                    <div className="text-right text-[10px] text-slate-400 font-mono mt-1">
                      {pair.volatility % 1 === 0 ? pair.volatility.toFixed(0) : pair.volatility.toPrecision(4)}
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <BarChart2 size={12} /> {t('adminMarket.engine.cards.spread')}
                    </label>
                    <input
                      type="range"
                      min={sRange.min}
                      max={sRange.max}
                      step={sRange.step}
                      value={Math.min(pair.spread, sRange.max)}
                      onChange={(e) => { ensureInit(); setSpread(pair.symbol, parseFloat(e.target.value)); }}
                      onMouseUp={async (e) => {
                        try {
                          const val = parseFloat((e.target as HTMLInputElement).value);
                          await supabase.from('price_overrides').upsert({ symbol: `${pair.symbol}_spread`, price: val }, { onConflict: 'symbol' });
                        } catch {
                          toast.error(t('adminMarket.toast.spreadFailed'));
                        }
                      }}
                      onTouchEnd={async (e) => {
                        try {
                          const val = parseFloat((e.target as HTMLInputElement).value);
                          await supabase.from('price_overrides').upsert({ symbol: `${pair.symbol}_spread`, price: val }, { onConflict: 'symbol' });
                        } catch {
                          toast.error(t('adminMarket.toast.spreadFailed'));
                        }
                      }}
                      className="w-full accent-white"
                      disabled={isPinned}
                    />
                    <div className="text-right text-[10px] text-slate-400 font-mono mt-1">
                      {pair.spread % 1 === 0 ? pair.spread.toFixed(0) : pair.spread.toPrecision(4)}
                    </div>
                  </div>
                </div>

                {/* Scenarios */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    {t('adminMarket.engine.cards.scenarios')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'bull', label: t('adminMarket.engine.scenarios.bull'), col: 'text-accent-secondary border-accent-secondary/50 hover:bg-accent-secondary/10' },
                      { id: 'bear', label: t('adminMarket.engine.scenarios.bear'), col: 'text-rose-500 border-rose-500/50 hover:bg-rose-500/10' },
                      { id: 'sideways', label: t('adminMarket.engine.scenarios.sideways'), col: 'text-slate-400 border-slate-600 hover:bg-white/10' },
                      { id: 'crash', label: t('adminMarket.engine.scenarios.crash'), col: 'text-orange-500 border-orange-500/50 hover:bg-orange-500/10 font-black tracking-widest animate-pulse' },
                      { id: 'news', label: t('adminMarket.engine.scenarios.news'), col: 'text-accent-primary border-accent-primary/50 hover:bg-accent-primary/10' },
                    ].map(tItem => (
                      <button
                        key={tItem.id}
                        disabled={isPinned}
                        onClick={async () => {
                          ensureInit();
                          if (tItem.id === 'crash') {
                            if (!window.confirm(t('adminMarket.engine.cards.confirmCrash', { sym: pair.symbol }))) return;
                          }
                          try {
                            const trendVal = tItem.id as ForexTrend;
                            setTrend(pair.symbol, trendVal);
                            const trendCode = trendVal === 'bull' ? 1 : trendVal === 'bear' ? 2 : trendVal === 'sideways' ? 3 : trendVal === 'crash' ? 4 : 5;
                            await supabase.from('price_overrides').upsert({ symbol: `${pair.symbol}_trend`, price: trendCode }, { onConflict: 'symbol' });
                            toast.success(`${pair.symbol} → ${tItem.label}`);
                          } catch {
                            toast.error(t('adminMarket.toast.trendFailed'));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                          pair.trend === tItem.id
                            ? tItem.col.replace('hover:bg', 'bg').replace('/10', '/30')
                            : `bg-transparent ${tItem.col}`
                        }`}
                      >
                        {tItem.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
