import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, Search, Filter, ShieldCheck, ArrowUpRight, Activity, Crown } from 'lucide-react';
import { useTradingStore } from '../../stores/tradingStore';
import { useTradingContext } from '../../contexts/TradingContext';
import { AssetIcon } from '../common/AssetIcon';
import { useEliteStatus } from '../../hooks/useEliteStatus';
import { ELITE_REQUIREMENT } from '../../hooks/useEliteStatus';
import { TransferModal } from '../../pages/dashboard/TransferModal';

export const Watchlist = () => {
  const { setCurrentPair } = useTradingContext();
  const prices = useTradingStore(s => s.prices);
  const priceChanges = useTradingStore(s => s.priceChanges);

  const defaultSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'EURUSD', 'GBPUSD', 'XAUUSD'];
  
  const items = defaultSymbols.map(sym => {
    // Determine the store key (crypto is lowercase from Binance, forex is whatever ForexStore provides)
    const storeKey = sym.endsWith('USDT') ? sym.toLowerCase() : sym;
    const p = prices[storeKey] || prices[sym]; // fallback just in case
    const c = priceChanges[storeKey] || priceChanges[sym];
    const isCrypto = sym.endsWith('USDT');
    // Format presentation symbol
    const displaySym = isCrypto ? sym.replace('USDT', ' / USDT') : `${sym?.substring(0,3)} / ${sym?.substring(3)}`;
    
    return {
      id: sym,
      symbol: displaySym,
      price: p != null ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: isCrypto ? 2 : 4 }) : '.',
      change: c != null ? `${c > 0 ? '+' : ''}${c.toFixed(2)}%` : '.',
      trend: c && c >= 0 ? 'up' : 'down'
    };
  });

  return (
    <div className="glass-card p-6 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white tracking-wide">Watchlist</h3>
        <div className="flex gap-2">
           <button className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors"><Search size={14}/></button>
           <button className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors"><Filter size={14}/></button>
        </div>
      </div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest grid grid-cols-12 mb-4 px-2">
         <span className="col-span-6">Symbol</span>
         <span className="col-span-3 text-right">Price</span>
         <span className="col-span-3 text-right">Change</span>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <motion.div 
            key={item.id}
            onClick={() => setCurrentPair(item.id)}
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }}
            className="grid grid-cols-12 items-center px-2 py-3 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5"
          >
            <div className="col-span-6 flex items-center gap-3 min-w-0">
               <AssetIcon symbol={item.id} size={32} />
               <span className="text-xs font-bold text-slate-200 truncate">{item.symbol}</span>
            </div>
            <span className="col-span-3 text-right text-xs font-mono text-slate-300 truncate">{item.price}</span>
            <span className={`col-span-3 text-right text-xs font-bold ${item.trend === 'up' ? 'text-accent-secondary' : 'text-accent-quaternary'}`}>
               {item.change}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const MarketMovers = () => {
  const tabs = ['Top Gainers', 'Top Losers', 'Top Volume'];
  const prices = useTradingStore(s => s.prices);
  const priceChanges = useTradingStore(s => s.priceChanges);

  // Compute movers dynamically
  const moversList = Object.entries(priceChanges).map(([symbol, change]) => {
    const isCrypto = symbol.toLowerCase().endsWith('usdt');
    const upperSym = symbol.toUpperCase();
    const displaySym = isCrypto ? upperSym.replace('USDT', ' / USDT') : `${upperSym?.substring(0,3)} / ${upperSym?.substring(3)}`;
    const currPrice = prices[symbol];
    
    return {
      symbol: displaySym,
      rawSymbol: symbol,
      priceStr: currPrice != null ? currPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: isCrypto ? 2 : 4 }) : '.',
      changeStr: change != null ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : '.',
      changeVal: change,
      trend: change >= 0 ? 'up' : 'down'
    };
  }).sort((a, b) => b.changeVal - a.changeVal).slice(0, 4);

  // Fallback if no prices exist yet
  const movers = moversList.length > 0 ? moversList : [
    { rawSymbol: 'SOLUSDT', symbol: 'SOL / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
    { rawSymbol: 'ADAUSDT', symbol: 'ADA / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
    { rawSymbol: 'AVAXUSDT', symbol: 'AVAX / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
    { rawSymbol: 'LINKUSDT', symbol: 'LINK / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
  ];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-sm font-bold text-white tracking-wide">Market Movers</h3>
         <select className="bg-transparent text-[10px] font-bold text-slate-500 outline-none">
            <option>24h</option>
         </select>
      </div>
      <div className="flex p-1 bg-[#111] rounded-xl mb-6">
         {tabs.map((tab, i) => (
           <button key={tab} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${i === 0 ? 'bg-accent-primary/20 text-accent-primary' : 'text-slate-500 hover:text-white'}`}>
              {tab}
           </button>
         ))}
      </div>
      <div className="space-y-4">
        {movers.map((mover) => (
          <div key={mover.rawSymbol} className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-all">
             <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${mover.trend === 'up' ? 'bg-accent-secondary shadow-neon-emerald' : 'bg-accent-quaternary shadow-neon-rose'} group-hover:scale-150 transition-transform`} />
                <span className="text-xs font-bold text-slate-200 group-hover:text-accent-primary transition-colors">{mover.symbol}</span>
             </div>
             <div className="text-right">
                <p className="text-xs font-bold text-white">{mover.priceStr}</p>
                <p className={`text-[10px] font-bold ${mover.trend === 'up' ? 'text-accent-secondary' : 'text-accent-quaternary'}`}>{mover.changeStr}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RecentActivity = () => {
  const activities: Array<{ label: string; time: string; value: string; color: string }> = [];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-sm font-bold text-white tracking-wide">Recent Activity</h3>
         <button className="text-[10px] font-bold text-accent-primary hover:underline">View All</button>
      </div>
      <div className="space-y-6">
        {activities.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-6">No recent account activity.</div>
        ) : activities.map((act, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
               <Clock size={14} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-white mb-0.5 truncate">{act.label}</p>
               <p className="text-[10px] font-bold text-slate-500">{act.time}</p>
            </div>
            <span className={`text-[10px] font-bold ${act.color}`}>{act.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MarketSentimentWidget = () => {
  const [sentiment, setSentiment] = React.useState(39); // 0 = Bearish, 100 = Bullish

  // Simulate a live feel by slightly fluctuating sentiment every few seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSentiment(prev => {
        // Random walk
        let next = prev + (Math.random() * 10 - 5);
        if (next < 5) next = 5;
        if (next > 95) next = 95;
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isBearish = sentiment < 50;
  const glowColor = isBearish ? '#FB7185' : '#10B981';
  // Map sentiment (0-100) to rotation (-90 to 90 degrees) for the needle
  const needleRotation = (sentiment / 100) * 180 - 90;
  // Arc geometry: semicircle from (30,120) to (190,120), radius 80, centered at (110,120)
  const CX = 110, CY = 120, R = 80;
  const arcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      className="glass-card p-6 border-accent-primary/20 relative overflow-hidden transition-colors duration-1000 holo-border"
    >
      {/* Ambient breathing glow, color-locked to sentiment */}
      <motion.div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ backgroundColor: glowColor, transition: 'background-color 1s ease' }}
      />

      <div className="flex items-center justify-between mb-2 relative z-10">
        <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Market Sentiment</h3>
        <span
          className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ color: glowColor, backgroundColor: `${glowColor}1A`, transition: 'color 1s ease, background-color 1s ease' }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: glowColor }} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: glowColor }} />
          </span>
          Live
        </span>
      </div>

      <div className="relative flex flex-col items-center justify-center pt-4 pb-2 z-10">
        {/* 3D instrument bezel: layered dark rings simulating a brushed-metal dial housing */}
        <div className="relative w-[220px] h-[132px] overflow-hidden">
          <div
            className="absolute top-0 left-0 w-[220px] h-[220px] rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #26262e 0%, #101014 55%, #050506 100%)',
              boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.08), inset 0 -6px 16px rgba(0,0,0,0.9), 0 8px 24px rgba(0,0,0,0.6)',
            }}
          />
          <div
            className="absolute top-[10px] left-[10px] w-[200px] h-[200px] rounded-full"
            style={{
              background: 'radial-gradient(circle at 50% 15%, #0d0d10 0%, #08080a 70%)',
              boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.95)',
            }}
          />

          <svg width="220" height="132" viewBox="0 0 220 132" className="relative z-10 overflow-visible">
            <defs>
              <linearGradient id="sentimentTrackGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="50%" stopColor="#F5E1A4" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
              <filter id="sentimentGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="hubGrad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#F5E1A4" />
                <stop offset="55%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#8a6d1f" />
              </radialGradient>
            </defs>

            {/* Recessed track groove */}
            <path d={arcPath} fill="none" stroke="#000000" strokeWidth="15" strokeLinecap="round" opacity="0.6" />
            {/* Gradient arc, always fully visible for a rich "alive" instrument look */}
            <path d={arcPath} fill="none" stroke="url(#sentimentTrackGrad)" strokeWidth="10" strokeLinecap="round" opacity="0.85" filter="url(#sentimentGlow)" />
            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map((tick) => {
              const angle = (tick / 100) * 180;
              const rad = (angle * Math.PI) / 180;
              const x1 = CX - Math.cos(rad) * (R - 12);
              const y1 = CY - Math.sin(rad) * (R - 12);
              const x2 = CX - Math.cos(rad) * (R - 4);
              const y2 = CY - Math.sin(rad) * (R - 4);
              return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" />;
            })}

            {/* Needle, spring-animated, pivoted at the dial center */}
            <motion.g
              animate={{ rotate: needleRotation }}
              transition={{ type: 'spring', stiffness: 40, damping: 15 }}
              style={{ originX: `${CX}px`, originY: `${CY}px`, transformBox: 'view-box' }}
            >
              <polygon points={`${CX - 3},${CY} ${CX + 3},${CY} ${CX},${CY - R + 16}`} fill="url(#hubGrad)" filter="url(#sentimentGlow)" />
              <circle cx={CX} cy={CY - R + 16} r="2.5" fill="#FFFDF5" />
            </motion.g>

            {/* Center hub dome */}
            <circle cx={CX} cy={CY} r="9" fill="url(#hubGrad)" stroke="#050506" strokeWidth="2" />
            <circle cx={CX - 2.5} cy={CY - 2.5} r="2.5" fill="#FFFDF5" opacity="0.7" />
          </svg>
        </div>

        <div className="flex flex-col items-center -mt-1">
          <motion.h2
            key={Math.round(sentiment)}
            initial={{ scale: 1.1, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold tracking-tighter"
            style={{ color: glowColor, textShadow: `0 0 18px ${glowColor}80`, transition: 'color 1s ease' }}
          >
            {Math.round(sentiment)}%
          </motion.h2>
          <div className="flex items-center gap-1.5 mt-1">
            <TrendingDown
              size={14}
              className={isBearish ? undefined : 'rotate-180'}
              style={{ color: glowColor, transition: 'color 1s ease' }}
            />
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: glowColor, transition: 'color 1s ease' }}
            >
              {isBearish ? 'Bearish' : 'Bullish'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const EliteTraderWidget = () => {
  const navigate = useNavigate();
  const { isElite } = useEliteStatus();
  const [depositOpen, setDepositOpen] = useState(false);

  return (
    <>
      <TransferModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        type="deposit"
        initialAmount={ELITE_REQUIREMENT}
      />
      <motion.div
        whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
        style={{ perspective: 1000 }}
        className="glass-card p-0 border-accent-primary/30 relative overflow-hidden holo-border cursor-pointer group h-64"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000aa] to-transparent z-10 pointer-events-none" />
        <img
          src="/elite-trade-ad.png"
          alt="BullenHaus Elite Trade"
          className="w-full h-full object-cover transform group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 absolute inset-0"
        />

        <div className="relative z-20 flex flex-col justify-end h-full p-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
             <h3 className="text-xl font-bold text-white uppercase tracking-[0.1em] drop-shadow-lg">Elite Trade</h3>
             <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-primary text-black shadow-[0_0_15px_rgba(212,175,55,0.8)]">VIP</div>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-medium mb-3 drop-shadow-md">
            Institutional intelligence. Exclusive vaults. <span className="text-gold font-bold">0% maker fees.</span>
          </p>

          {isElite ? (
            <button
              onClick={() => navigate('/trade/tools')}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-accent-secondary/90 to-emerald-500 text-[11px] font-bold text-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,230,118,0.6)] transition-all duration-300 flex items-center justify-center gap-1.5"
            >
              <Crown size={13} /> Elite Active — Open Tools
            </button>
          ) : (
            <button
              onClick={() => setDepositOpen(true)}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-accent-primary via-yellow-400 to-yellow-600 text-[11px] font-bold text-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(212,175,55,0.8)] transition-all duration-300"
            >
              Upgrade Now — Deposit ${ELITE_REQUIREMENT.toLocaleString()}
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
};
