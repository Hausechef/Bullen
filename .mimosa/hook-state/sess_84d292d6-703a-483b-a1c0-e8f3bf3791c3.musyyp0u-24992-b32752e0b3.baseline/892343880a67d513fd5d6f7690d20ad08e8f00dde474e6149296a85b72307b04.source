import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Activity, Headset } from 'lucide-react';
import { useTradingStore } from '../../stores/tradingStore';

export const ProTraderCard = () => (
  <div className="relative group overflow-hidden rounded-2xl p-0 bg-[#0A0A0E] border border-gold/20 mb-8 shadow-[0_8px_30px_rgba(212,175,55,0.15)] hover:shadow-[0_8px_40px_rgba(212,175,55,0.3)] transition-all cursor-pointer">
    <div className="w-full h-32 relative">
      <img src="/assets/elite_trader_ad.png" alt="Elite Trader" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0E] via-transparent to-transparent" />
    </div>
    <div className="relative z-10 p-5 -mt-6">
      <h4 className="text-sm font-bold text-gold mb-1 uppercase tracking-widest glow-text">Elite Trader</h4>
      <p className="text-[10px] text-white/60 mb-4 leading-relaxed font-mono">
        Unlock institutional tools, deep liquidity and exclusive rewards.
      </p>
      <button className="w-full py-2.5 bg-gradient-to-r from-gold/10 via-gold/20 to-gold/10 border border-gold/40 text-gold text-[10px] font-bold rounded-lg hover:bg-gold hover:text-black hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] active:scale-95 transition-all uppercase tracking-widest">
        Upgrade Now
      </button>
    </div>
  </div>
);

export const SentimentGauge = () => {
  const storeChanges = useTradingStore(s => s.priceChanges);
  
  const [simulatedSentiment, setSimulatedSentiment] = useState(65);
  const [simUp, setSimUp] = useState(12);
  const [simDown, setSimDown] = useState(5);
  const [simAvg, setSimAvg] = useState(1.24);
  const [analystsOnline, setAnalystsOnline] = useState(9);

  useEffect(() => {
    const iv = setInterval(() => {
      setSimulatedSentiment(prev => {
        const delta = (Math.random() - 0.5) * 8;
        return Math.max(15, Math.min(85, prev + delta));
      });
      setSimUp(Math.floor(Math.random() * 20) + 15);
      setSimDown(Math.floor(Math.random() * 15) + 5);
      setSimAvg((Math.random() * 4) - 1.5);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setAnalystsOnline(prev => Math.max(6, Math.min(14, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  const changeValues = Object.values(storeChanges);
  const hasLiveChanges = changeValues.length > 0;

  let sentiment = hasLiveChanges ? 50 : Math.round(simulatedSentiment);
  let upCount = hasLiveChanges ? 0 : simUp;
  let downCount = hasLiveChanges ? 0 : simDown;
  let avgChange = hasLiveChanges ? 0 : simAvg;

  if (hasLiveChanges) {
    upCount = changeValues.filter(c => c > 0).length;
    downCount = changeValues.filter(c => c < 0).length;
    avgChange = changeValues.reduce((sum, c) => sum + c, 0) / changeValues.length;
    sentiment = Math.round((upCount / changeValues.length) * 100);
    sentiment = Math.max(5, Math.min(95, sentiment));
  }

  const isBullish = sentiment >= 50;
  const rotation = Math.round((sentiment / 100) * 180);

  const gaugeColor = isBullish ? '#10b981' : '#ef4444';
  
  return (
    <div className="relative p-5 rounded-2xl bg-gradient-to-br from-[#121216] to-[#0A0A0E] border border-gold/15 shadow-[0_8px_30px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: gaugeColor }}
      />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-gold" />
          <span className="text-[11px] font-bold text-gold uppercase tracking-widest glow-text">Market Sentiment</span>
        </div>
        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(16,185,129,0.4)] border border-emerald-500/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
      </div>

      <div className="flex flex-col items-center relative mb-4">
        {/* Semi-circle gauge container */}
        <div className="w-40 h-20 relative overflow-hidden">
          {/* Background Arc */}
          <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-[10px] border-white/5" />
          {/* Active Arc */}
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: rotation - 180 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-0 left-0 w-40 h-40 rounded-full border-[10px] border-transparent origin-center"
            style={{ 
              borderTopColor: gaugeColor,
              borderRightColor: gaugeColor,
              filter: `drop-shadow(0 0 10px ${gaugeColor}80)`
            }}
          />
        </div>

        <div className="absolute bottom-0 flex flex-col items-center justify-end pb-1 w-full text-center">
          <motion.span
            key={sentiment}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="block text-4xl font-bold font-mono tracking-tight leading-none"
            style={{ color: gaugeColor, textShadow: `0 0 15px ${gaugeColor}60` }}
          >
            {sentiment}%
          </motion.span>
          <span className={`text-[10px] font-bold flex items-center gap-1 justify-center mt-2 uppercase tracking-widest ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isBullish ? <TrendingUp size={12} /> : <TrendingDown size={12} className="rotate-180" />}
            {isBullish ? 'Bullish' : 'Bearish'}
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-2 mt-5 relative z-10"
      >
        <div className="flex flex-col items-center justify-center rounded-xl bg-[#111115] border border-[#00e676]/30 py-2.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#00e676] mb-0.5">Up</p>
          <p className="text-[16px] font-bold font-mono text-[#00e676] leading-none">{upCount}</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-[#111115] border border-white/20 py-2.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-0.5">Avg</p>
          <p className={`text-[15px] font-bold font-mono leading-none ${avgChange >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
            {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-[#111115] border border-[#ff4444]/30 py-2.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#ff4444] mb-0.5">Down</p>
          <p className="text-[16px] font-bold font-mono text-[#ff4444] leading-none">{downCount}</p>
        </div>
      </motion.div>

      {/* Trading Desk — live analyst coverage */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex items-center justify-between mt-5 pt-4 border-t border-white/5 relative z-10"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-b from-[#1A1A20] to-[#0A0A0E] border border-gold/30 flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.15)] shrink-0">
            <Headset size={14} className="text-gold" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0A0A0E]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white leading-none font-mono">{analystsOnline} Analysts</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Trading Desk</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(16,185,129,0.4)] border border-emerald-500/20 whitespace-nowrap">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Online
        </span>
      </motion.div>
    </div>
  );
};
