import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Shield, Zap, Medal, ChevronRight, Activity, TrendingUp, Award, Crown, CheckCircle2, Lock, Coins } from 'lucide-react';
import { LuxIcon } from '../../components/common/LuxIcon';
import { useUserStore } from '../../stores/userStore';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const LEVEL_XP = 100000;

interface GamificationStats {
  total_trades: number;
  margin_trades: number;
  spot_trades: number;
  closed_trades: number;
  winning_trades: number;
  has_stop_loss: boolean;
  has_limit_order: boolean;
  realized_pnl: number;
  balance: number;
}

interface LeaderboardRow {
  rank: number;
  display_name: string;
  role: string;
  xp: number;
  realized_pnl: number;
  trades: number;
  is_me: boolean;
}

export const Gamification: React.FC = () => {
  const { profile } = useUserStore();
  const { user } = useAuth();
  const displayName = profile?.display_name || profile?.full_name || profile?.username || user?.email || 'User';
  const roleName = profile?.role || 'LITE';

  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [leaderboardLimit, setLeaderboardLimit] = useState(10);
  const [loadingBoard, setLoadingBoard] = useState(false);

  useEffect(() => {
    supabase.rpc('get_my_gamification_stats').then(({ data, error }) => {
      if (error) { console.error('[rewards] stats:', error); return; }
      setStats(data as GamificationStats);
    });
  }, []);

  useEffect(() => {
    setLoadingBoard(true);
    supabase.rpc('get_gamification_leaderboard', { p_limit: leaderboardLimit }).then(({ data, error }) => {
      setLoadingBoard(false);
      if (error) { console.error('[rewards] leaderboard:', error); return; }
      setLeaderboard((data as LeaderboardRow[]) ?? []);
    });
  }, [leaderboardLimit]);

  const totalTrades = stats?.total_trades ?? 0;
  const winningTrades = stats?.winning_trades ?? 0;
  const closedTrades = stats?.closed_trades ?? 0;
  const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;
  const totalPnL = stats?.realized_pnl ?? 0;
  const isPnLPositive = totalPnL >= 0;

  const userXP = totalTrades * 100 + (totalPnL > 0 ? totalPnL / 10 : 0);

  const badges = [
    { id: 1, name: 'First Blood', description: 'Complete your first trade', icon: Zap, unlocked: totalTrades >= 1, color: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/30' },
    { id: 2, name: 'Profitable', description: 'Close a winning position', icon: TrendingUp, unlocked: winningTrades >= 1, color: 'text-accent-secondary', bg: 'bg-accent-secondary/10', border: 'border-accent-secondary/30' },
    { id: 3, name: 'Risk Manager', description: 'Protect a position with a Stop Loss', icon: Shield, unlocked: !!stats?.has_stop_loss, color: 'text-accent-quaternary', bg: 'bg-accent-quaternary/10', border: 'border-accent-quaternary/30' },
    { id: 4, name: 'Whale Apprentice', description: 'Grow your account over $50k', icon: Crown, unlocked: (stats?.balance ?? 0) >= 50000, color: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/30' },
    { id: 5, name: 'Active Trader', description: 'Execute 5 trades', icon: Award, unlocked: totalTrades >= 5, color: 'text-accent-secondary', bg: 'bg-accent-secondary/10', border: 'border-accent-secondary/30' },
    { id: 6, name: 'Target Reached', description: 'Place a Limit order', icon: Medal, unlocked: !!stats?.has_limit_order, color: 'text-accent-quaternary', bg: 'bg-accent-quaternary/10', border: 'border-accent-quaternary/30' },
    { id: 7, name: 'Spot Collector', description: 'Make a Spot trade', icon: Coins, unlocked: (stats?.spot_trades ?? 0) >= 1, color: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/30' },
    { id: 8, name: 'Marathon', description: 'Execute 25 trades', icon: Activity, unlocked: totalTrades >= 25, color: 'text-accent-secondary', bg: 'bg-accent-secondary/10', border: 'border-accent-secondary/30' },
    { id: 9, name: 'Rainmaker', description: 'Reach $1,000 realized profit', icon: Trophy, unlocked: totalPnL >= 1000, color: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/30' },
  ].map(b => b.unlocked ? b : { ...b, color: 'text-slate-500', bg: 'bg-white/5', border: 'border-white/10' });

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <LuxIcon icon={Trophy} size={28} />
            Trader Progression
          </h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
            Elite Status & Achievements
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Status & Progress */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="glass-card p-8 border-accent-primary/20 relative overflow-hidden holo-border">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-secondary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
              {/* Rank Insignia */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex flex-col items-center justify-center border-2 border-accent-primary/50 shadow-[0_0_30px_rgba(212,175,55,0.2)] group-hover:scale-105 transition-transform duration-500">
                  <Crown size={48} className="text-accent-primary drop-shadow-[0_0_15px_rgba(212,175,55,0.8)] mb-2" />
                  <span className="text-[10px] font-bold text-accent-primary/70 uppercase tracking-widest">Elite Tier</span>
                </div>
              </div>

              {/* Stats & Progress */}
              <div className="flex-1 w-full text-center md:text-left">
                <p className="text-[10px] font-bold text-accent-primary/70 uppercase tracking-[0.2em] mb-1">Current Status</p>
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-6">
                  <h3 className="text-4xl font-bold text-white tracking-tight uppercase">{roleName}</h3>
                  <span className="text-sm font-bold text-slate-400">Total XP: {Math.round(userXP).toLocaleString()}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Level Progress</span>
                    <span className="text-xs font-bold text-accent-primary glows-text">{Math.round(userXP).toLocaleString()} / {LEVEL_XP.toLocaleString()} XP</span>
                  </div>

                  <div className="h-3 w-full bg-[#111] rounded-full overflow-hidden border border-white/5 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (userXP / LEVEL_XP) * 100)}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="h-full relative shadow-[0_0_15px_rgba(212,175,55,0.8)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/50 via-accent-primary to-yellow-300" />
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
                    </motion.div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">KYC Status: {profile?.kyc_status || 'UNVERIFIED'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
               <div className="bg-[#111] border border-white/10 rounded-xl p-4 text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Trades</p>
                 <p className="text-xl font-bold text-white font-mono">{totalTrades}</p>
                 <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                   {stats ? `${stats.margin_trades} margin · ${stats.spot_trades} spot` : ''}
                 </p>
               </div>
               <div className="bg-[#111] border border-accent-secondary/20 rounded-xl p-4 text-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-accent-secondary/5" />
                 <p className="text-[10px] font-bold text-accent-secondary uppercase tracking-widest mb-1 relative z-10">Win Rate</p>
                 <p className="text-xl font-bold text-accent-secondary font-mono relative z-10 shadow-neon-emerald drop-shadow-md">{winRate.toFixed(1)}%</p>
               </div>
               <div className="bg-[#111] border border-white/10 rounded-xl p-4 text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Realized PNL</p>
                 <p className={`text-xl font-bold font-mono ${isPnLPositive ? 'text-accent-secondary' : 'text-orange-500'}`}>
                   {isPnLPositive ? '+' : ''}${totalPnL.toFixed(2)}
                 </p>
               </div>
               <div className="bg-[#111] border border-white/10 rounded-xl p-4 text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Badges</p>
                 <p className="text-xl font-bold text-white font-mono">{unlockedCount} / {badges.length}</p>
               </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Achievements & Badges</h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{unlockedCount} unlocked</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge, i) => {
                const Icon = badge.icon;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    key={badge.id}
                    className={`p-4 rounded-xl border relative overflow-hidden group ${badge.border} ${badge.unlocked ? 'bg-surface-bg' : 'bg-[#0a0a0a]'}`}
                  >
                    {!badge.unlocked && (
                      <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                        <Lock className="text-slate-400" size={24} />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-lg ${badge.bg} flex items-center justify-center mb-4 ${!badge.unlocked && 'opacity-50'}`}>
                      <Icon size={24} className={badge.color} />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-bold ${badge.unlocked ? 'text-white' : 'text-slate-400'}`}>{badge.name}</h4>
                      {badge.unlocked && <CheckCircle2 size={12} className={badge.color} />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{badge.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Leaderboard */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="glass-card p-6 flex flex-col h-full min-h-[500px]">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <LuxIcon icon={Activity} size={20} />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Global Ranking</h3>
               </div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Season 1</span>
             </div>

             <div className="space-y-4 flex-1">
               {leaderboard.length === 0 && !loadingBoard && (
                 <p className="text-xs text-slate-500 text-center py-8">No ranked traders yet. Make a trade to enter the ranking.</p>
               )}
               {leaderboard.map((row, i) => (
                 <motion.div
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: Math.min(i * 0.05, 0.5) }}
                   key={row.rank}
                   className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                     row.is_me
                     ? 'bg-accent-primary/10 border-accent-primary/30 shadow-neon-gold'
                     : 'bg-[#111] border-white/5 hover:border-white/20'
                   }`}
                 >
                   <div className="flex items-center gap-4 min-w-0 flex-1">
                     <span className={`text-sm font-bold font-mono w-6 text-center shrink-0 ${
                       row.rank === 1 ? 'text-accent-primary' :
                       row.rank === 2 ? 'text-slate-300' :
                       row.rank === 3 ? 'text-orange-400' : 'text-slate-600'
                     }`}>
                       #{row.rank}
                     </span>
                     <div className="min-w-0">
                       <p className={`text-sm font-bold truncate ${row.is_me ? 'text-accent-primary' : 'text-white'}`}>
                         {row.display_name} {row.is_me && '(You)'}
                       </p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{row.trades} trades</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-xs font-bold font-mono text-white mb-0.5">{Number(row.xp).toLocaleString()} XP</p>
                     <p className={`text-[10px] font-bold ${Number(row.realized_pnl) >= 0 ? 'text-accent-secondary' : 'text-orange-500'}`}>
                       {Number(row.realized_pnl) >= 0 ? '+' : ''}${Number(row.realized_pnl).toFixed(2)}
                     </p>
                   </div>
                 </motion.div>
               ))}
             </div>

             {leaderboard.length >= leaderboardLimit && leaderboardLimit < 100 && (
               <button
                 onClick={() => setLeaderboardLimit(l => Math.min(100, l + 10))}
                 disabled={loadingBoard}
                 className="w-full mt-6 py-3 border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all text-center uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 {loadingBoard ? 'Loading…' : <>Load More <ChevronRight size={12} /></>}
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
