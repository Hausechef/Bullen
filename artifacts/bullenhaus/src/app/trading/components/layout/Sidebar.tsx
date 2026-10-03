import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Repeat,
  Briefcase,
  Wallet,
  History,
  Trophy,
  Users,
  Users2,
  Bell,
  ShieldCheck,
  UserCircle,
  Settings,
  LifeBuoy,
  LogOut,
  Globe,
  Moon,
  GraduationCap,
  Terminal,
  X,
  ChevronRight,
  Rocket
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { ProTraderCard, SentimentGauge } from './SidebarWidgets';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarItemProps {
  icon: React.ElementType;
  /** 3D golden icon PNG (same art set as the trading admin panel), rendered instead of the lucide icon when set. */
  iconSrc?: string;
  label: string;
  active?: boolean;
  alert?: number;
  to?: string;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, iconSrc, label, active, alert, to, onClick }: SidebarItemProps) => {
  const content = (
    <motion.div
      whileHover={{ 
        y: -4, 
        scale: 1.02, 
        rotateX: 5,
        rotateY: -5,
        boxShadow: "0 15px 30px rgba(212, 175, 55, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.4), inset 0 -3px 6px rgba(0, 0, 0, 0.9)"
      }}
      whileTap={{ y: 2, scale: 0.98 }}
      onClick={onClick}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className={cn(
        "group flex items-center justify-between px-4 py-3.5 mb-3 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden",
        "bg-gradient-to-b from-[#24242A] via-[#1A1A20] to-[#0D0D12] shadow-[0_8px_16px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_-3px_6px_rgba(0,0,0,0.9)]",
        active
          ? "border border-gold/60 text-gold shadow-[0_10px_30px_rgba(212,175,55,0.3),inset_0_1px_3px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.8)]"
          : "border border-white/5 text-text-muted hover:text-white hover:border-gold/40"
      )}
    >
      {active && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-yellow-300 via-gold to-yellow-600 shadow-[0_0_15px_rgba(212,175,55,1)]" />
      )}
      
      <div className="flex items-center gap-3 relative z-10">
        <div className={cn(
          "w-7 h-7 rounded-lg bg-[#00000080] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] border overflow-hidden flex items-center justify-center shrink-0",
          active ? "border-gold/30" : "border-white/5 group-hover:border-gold/20 transition-colors"
        )}>
           {iconSrc ? (
             <img
               src={iconSrc}
               alt=""
               className={cn(
                 "w-full h-full object-cover scale-[1.35] transition-all duration-300",
                 active ? "drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]" : "opacity-80 group-hover:opacity-100"
               )}
             />
           ) : (
             <Icon
               size={16}
               className={cn(
                 "transition-all duration-300 shrink-0",
                 active
                   ? "text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                   : "text-[#D4AF37] opacity-80 group-hover:opacity-100 group-hover:text-[#FFD700] group-hover:drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]"
               )}
             />
           )}
        </div>
        <span className={cn(
           "font-bold text-xs tracking-wider uppercase",
           active ? "glow-text" : "group-hover:text-white transition-colors"
        )}>
           {label}
        </span>
      </div>
      {alert && (
        <span className="bg-gradient-to-r from-gold to-yellow-600 text-[10px] text-black px-2 py-0.5 rounded shadow-[0_0_8px_rgba(212,175,55,0.6)] font-bold min-w-[22px] text-center relative z-10">
          {alert}
        </span>
      )}
    </motion.div>
  );

  return to ? <Link to={to} className="block" onClick={onClick}>{content}</Link> : content;
};

export const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, role } = useAuth();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-full border-r border-gold/15 bg-gradient-to-b from-[#0C0C10] via-[#0A0A0E] to-[#060608] flex flex-col p-4 relative overflow-hidden shadow-[10px_0_50px_rgba(0,0,0,0.6)]">
      {/* Ambient gold glow at top */}
      <div
        className="absolute top-0 left-0 right-0 h-56 pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.22) 0%, transparent 70%)',
        }}
      />
      {/* Visible gold accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="flex flex-col items-center gap-2 mb-8 pr-4 relative min-h-[100px] justify-center">
        {onClose && (
           <button onClick={onClose} className="absolute right-0 top-0 md:hidden p-2 text-text-muted hover:text-text z-10">
              <X size={20} />
           </button>
        )}
        <img
          src="/logo.png"
          alt="Bullenhaus Logo"
          className="w-full max-w-[200px] h-auto object-contain mt-2 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fallback = document.getElementById('logo-fallback');
            if(fallback) fallback.style.display = 'flex';
          }}
        />
        <div id="logo-fallback" className="hidden flex-col items-center">
          <div className="text-center mt-2">
            <p className="font-serif text-xl font-bold tracking-[0.2em]">
              <span className="gold-gradient-text">BULLEN</span>
              <span className="text-text">HAUS</span>
            </p>
            <p className="text-[8px] font-bold text-gold/70 tracking-[0.35em] uppercase mt-1">Trade · Invest · Grow</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto custom-scrollbar pr-2">
        <SidebarItem icon={LayoutDashboard} iconSrc="/assets/icons/dashboard.png" label={t('dashboard')} to="/trade/dashboard" active={currentPath === '/trade/dashboard'} onClick={onClose} />
        <SidebarItem icon={BarChart3} iconSrc="/assets/icons/admin_logo.png" label={t('markets')} to="/trade/markets" active={currentPath === '/trade/markets'} onClick={onClose} />
        <SidebarItem icon={Repeat} iconSrc="/assets/icons/trade.png" label={t('trade')} to="/trade/terminal" active={currentPath === '/trade/terminal'} onClick={onClose} />
        <SidebarItem icon={Rocket} iconSrc="/assets/icons/trade.png" label={t('pre_market', { defaultValue: 'Pre-Market' })} to="/trade/pre-market" active={currentPath === '/trade/pre-market'} onClick={onClose} />
        <SidebarItem icon={Briefcase} iconSrc="/assets/icons/wallet.png" label={t('portfolio')} to="/trade/portfolio" active={currentPath === '/trade/portfolio'} onClick={onClose} />
        <SidebarItem icon={History} iconSrc="/assets/icons/wallet.png" label={t('transactions')} to="/trade/transactions" active={currentPath === '/trade/transactions'} onClick={onClose} />

        <div className="pt-4 pb-2 px-4 label-eyebrow">{t('growth', { defaultValue: 'Growth' })}</div>
        <SidebarItem icon={Trophy} iconSrc="/assets/icons/role_badge.png" label={t('rewards')} to="/trade/gamification" active={currentPath === '/trade/gamification'} onClick={onClose} />
        <SidebarItem icon={Users2} iconSrc="/assets/icons/users.png" label={t('referrals')} to="/trade/referrals" active={currentPath === '/trade/referrals'} onClick={onClose} />
        <SidebarItem icon={Bell} iconSrc="/assets/icons/chatbot.png" label={t('notifications')} to="/trade/notifications" active={currentPath === '/trade/notifications'} onClick={onClose} />

        <div className="pt-4 pb-2 px-4 label-eyebrow">{t('account', { defaultValue: 'Account' })}</div>
        <SidebarItem icon={ShieldCheck} iconSrc="/assets/icons/shield.png" label={t('kyc')} to="/trade/kyc" active={currentPath === '/trade/kyc'} onClick={onClose} />
        <SidebarItem icon={Settings} iconSrc="/assets/icons/settings.png" label={t('settings')} to="/trade/settings" active={currentPath === '/trade/settings'} onClick={onClose} />
        <SidebarItem icon={LifeBuoy} iconSrc="/assets/icons/chatbot.png" label={t('help')} to="/trade/support" active={currentPath === '/trade/support'} onClick={onClose} />

        {(role === 'admin' || role === 'trade_admin') && (
          <>
            <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-danger uppercase tracking-widest">System</div>
            <SidebarItem icon={Terminal} iconSrc="/assets/icons/admin_logo.png" label={t('admin')} to="/admin/dashboard" active={currentPath.startsWith('/admin')} onClick={onClose} />
          </>
        )}

        <div className="pt-6">
          
          
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-center justify-between px-2 mb-6">
          <div
            onClick={() => {
              const nextLang = i18n.language === 'en' ? 'de' : 'en';
              i18n.changeLanguage(nextLang);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border cursor-pointer hover:border-gold/30 transition-all"
          >
             <Globe size={14} className="text-text-muted" />
             <span className="text-[10px] font-bold text-text uppercase">{i18n.language}</span>
             <ChevronRight size={10} className="rotate-90 text-text-dim" />
          </div>
        </div>

        <div onClick={handleLogout} className="flex items-center justify-between px-2 text-text-muted hover:text-text cursor-pointer transition-colors group">
          <div className="flex items-center gap-2">
            <LogOut size={16} className="group-hover:text-danger transition-colors" />
            <span className="text-xs font-medium">{t('logout')}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

