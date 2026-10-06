import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Users2, Rocket, Settings2, Lock } from 'lucide-react';
import { useEliteStatus } from '../../hooks/useEliteStatus';
import { LuxIconTile } from '../common/LuxIcon';

const banners = [
  { icon: Users2, title: 'Refer & Earn', subtitle: 'Invite elites and earn up to 40% Commission', color: 'from-accent-primary shadow-neon-gold', to: '/trade/referrals', eliteOnly: false },
  { icon: Rocket, title: 'Elite Level Up', subtitle: 'Increase your rank and unlock exclusive vaults', color: 'from-accent-tertiary shadow-neon-blue', to: '/trade/gamification', eliteOnly: false },
  { icon: Settings2, title: 'Institutional Tools', subtitle: 'Access premium charts, signals and algorithms', color: 'from-slate-500 shadow-neon-white', to: '/trade/tools', eliteOnly: true }
];

export const UniverseBanners = () => {
  const navigate = useNavigate();
  const { isElite } = useEliteStatus();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {banners.map((banner, i) => (
        <motion.div
           key={banner.title}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: i * 0.1 + 0.5, duration: 0.4, ease: "easeOut" }}
           whileHover={{ y: -4, scale: 1.02 }}
           onClick={() => navigate(banner.to)}
           role="link"
           className={`glass-card p-6 glass-card-hover cursor-pointer group relative overflow-hidden holo-border`}
        >
          <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${banner.color.split(' ')[0]} to-transparent opacity-70 group-hover:opacity-100 transition-opacity`} />
          <div className="flex items-center gap-5 relative z-10">
             <div className="group-hover:scale-105 transition-transform duration-300">
                <LuxIconTile icon={banner.icon} size={56} iconSize={26} className="rounded-2xl" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-white mb-1.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all flex items-center gap-1.5">
                  {banner.title}
                  {banner.eliteOnly && !isElite && <Lock size={12} className="text-accent-primary shrink-0" />}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-[200px]">{banner.subtitle}</p>
             </div>
          </div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-500" />
        </motion.div>
      ))}
    </div>
  );
};
