import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, PieChart, Activity, Wallet } from 'lucide-react';
import { useTradingStore } from '../../stores/tradingStore';
import { useTranslation } from 'react-i18next';
import { useWalletSync } from '../../hooks/useWalletSync';

interface Stat {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon?: React.ElementType;
  progress?: number;
}

// Premium stat card with LEFT gold accent bar + hover lift
const StatCard = ({ stat, i }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.1 }}
    className="relative group p-4 pl-5 rounded-2xl bg-gradient-to-br from-[#15151A] to-[#0E0E12] border border-white/[0.08] hover:border-gold/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    style={{ boxShadow: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 12px 32px -8px rgba(0,0,0,0.55)' }}
  >
    {/* LEFT gold accent bar — VISIBLE luxury signature */}
    <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-gold via-gold/60 to-transparent rounded-r-full shadow-[0_0_10px_rgba(212,175,55,0.5)] group-hover:shadow-[0_0_16px_rgba(212,175,55,0.8)] transition-all" />
    {/* Top hairline */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

    <div className="relative flex flex-col justify-between min-w-0 h-full">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-gold/10 border border-gold/15 ring-1 ring-gold/5">
          {stat.icon && <stat.icon size={16} className="text-gold" />}
        </div>
        <span className="text-[10px] font-bold text-text-dim uppercase tracking-[0.18em] leading-snug">{stat.label}</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-2xl font-bold font-mono text-white mb-1 break-words tracking-tight">{stat.value}</h3>
          <div className="flex items-center gap-1.5">
            {stat.trend === 'up' ? (
              <TrendingUp size={12} className="text-emerald-400" />
            ) : stat.trend === 'down' ? (
              <TrendingDown size={12} className="text-rose-400" />
            ) : null}
            <span className={`text-[10px] font-bold ${stat.trend === 'up' ? 'text-emerald-400' : stat.trend === 'down' ? 'text-rose-400' : 'text-text-muted'}`}>
              {stat.change}
            </span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

export const DashboardStats = () => {
  const { t } = useTranslation('common');
  useWalletSync();
  const wallet = useTradingStore(s => s.wallet);
  const positions = useTradingStore(s => s.positions);

  const stats = useMemo(() => {
    let totalUnrealizedPnL = 0;
    positions.forEach(p => {
      if (p.status === 'open') {
        totalUnrealizedPnL += p.unrealizedPnL;
      }
    });

    const equity = wallet.balance + totalUnrealizedPnL;

    return [
      {
        label: t('totalBalance', { defaultValue: 'Total Balance' }),
        value: `$ ${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: t('live', { defaultValue: 'Live' }),
        trend: 'up' as const,
        icon: Wallet
      },
      {
        label: t('equity', { defaultValue: 'Equity' }),
        value: `$ ${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: t('live', { defaultValue: 'Live' }),
        trend: 'up' as const,
        icon: PieChart
      },
      {
        label: t('unrealizedPnL', { defaultValue: 'Unrealized P&L' }),
        value: `$ ${totalUnrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: t('live', { defaultValue: 'Live' }),
        trend: totalUnrealizedPnL >= 0 ? 'up' as const : 'down' as const,
        icon: Activity
      },
      {
        label: t('realizedPnL', { defaultValue: 'Realized P&L' }),
        value: `$ ${wallet.realizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: t('live', { defaultValue: 'Live' }),
        trend: wallet.realizedPnL >= 0 ? 'up' as const : 'down' as const,
        icon: TrendingUp
      },
    ];
  }, [wallet, positions, t]);

  const marginRatio = wallet.balance > 0 ? (wallet.marginUsed / wallet.balance) * 100 : 0;
  const marginAvailable = Math.max(0, wallet.balance - wallet.marginUsed);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} stat={stat} i={i} />
      ))}

      {/* Margin Card with Circular Progress — premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative group p-4 pl-5 rounded-2xl bg-gradient-to-br from-[#15151A] to-[#0E0E12] border border-white/[0.08] hover:border-gold/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex items-center justify-between"
        style={{ boxShadow: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 12px 32px -8px rgba(0,0,0,0.55)' }}
      >
        {/* LEFT gold accent bar */}
        <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-gold via-gold/60 to-transparent rounded-r-full shadow-[0_0_10px_rgba(212,175,55,0.5)] group-hover:shadow-[0_0_16px_rgba(212,175,55,0.8)] transition-all" />
        {/* Top hairline */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

        <div className="relative flex flex-col h-full justify-between">
           <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-[0.18em]">{t('availableMargin', { defaultValue: 'Available Margin' })}</span>
           </div>
           <div>
              <h3 className="text-2xl font-bold font-mono text-white leading-none tracking-tight">$ {marginAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
           </div>
        </div>

        <div className="relative w-16 h-16">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              className="text-white/5 stroke-current"
              strokeWidth="3.5"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <motion.path
              initial={{ strokeDasharray: '0, 100' }}
              animate={{ strokeDasharray: `${Math.max(0, Math.min(100, marginRatio))}, 100` }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="text-gold stroke-current"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-[10px] font-bold text-gold">{marginRatio.toFixed(1)}%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
