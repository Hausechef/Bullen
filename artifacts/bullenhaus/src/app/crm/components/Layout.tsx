import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../../lib/supabase/browserClient";
import {
  Building2,
  LayoutDashboard,
  Users,
  PhoneCall,
  Phone,
  Sparkles,
  Settings,
  ShieldCheck,
  TrendingUp,
  FileText,
  LogOut,
  Menu,
  X,
  BellRing,
  Megaphone,
  Database,
  Shield,
  Brain,
  Columns3,
  CheckSquare,
  LifeBuoy,
  MessageSquare,
  BookOpen,
  Zap,
  ShieldCheck as ShieldCheckIcon,
  HeartHandshake,
} from "lucide-react";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "../lib/i18n";
import { TeamChat } from "./TeamChat";

const iconMap: Record<string, string> = {
  'navDirectorDashboard': '/assets/icons/dashboard.png',
  'navManagerDashboard': '/assets/icons/dashboard.png',
  'navAdminPanel': '/assets/icons/settings.png',
  'Kanban Board': '/assets/icons/trade.png',
  'navLeads': '/assets/icons/users.png',
  'Tasks': '/assets/icons/dashboard.png',
  'navClients': '/assets/icons/users.png',
  'navVipClients': '/assets/icons/users.png',
  'Support Tickets': '/assets/icons/shield.png',
  'Messages': '/assets/icons/users.png',
  'Sales Scripts': '/assets/icons/settings.png',
  'KYC Review': '/assets/icons/shield.png',
  'Workflow Rules': '/assets/icons/settings.png',
  'Call History': '/assets/icons/users.png',
  'Telephony': '/assets/icons/users.png',
  'AI Core Insights': '/assets/icons/dashboard.png',
  'navTeamPipeline': '/assets/icons/users.png',
  'navAgentWorkspace': '/assets/icons/dashboard.png',
  'My Clients': '/assets/icons/users.png',
  'Recovery': '/assets/icons/shield.png',
};

const getNavForRole = (role: string, t: (key: string) => string) => {
  switch (role) {
    case 'director':
      return [
        { name: t('navDirectorDashboard'), href: '/crm/dashboard',   icon: LayoutDashboard },
        { name: 'Kanban Board',           href: '/crm/kanban',      icon: Columns3 },
        { name: t('navLeads'),             href: '/crm/workspace',   icon: Megaphone },
        { name: 'Recovery',                href: '/crm/recovery',    icon: HeartHandshake },
        { name: 'Tasks',                   href: '/crm/tasks',       icon: CheckSquare },
        { name: t('navClients'),           href: '/crm/clients',     icon: Users },
        { name: t('navVipClients'),        href: '/crm/vip',         icon: Sparkles },
        { name: 'Support Tickets',         href: '/crm/tickets',     icon: LifeBuoy },
        { name: 'Messages',                href: '/crm/messages',    icon: MessageSquare },
        { name: 'Sales Scripts',           href: '/crm/scripts',     icon: BookOpen },
        { name: 'KYC Review',              href: '/crm/kyc-review',  icon: ShieldCheckIcon },
        { name: 'Workflow Rules',          href: '/crm/workflows',   icon: Zap },
        { name: t('navManagerDashboard'),  href: '/crm/manager',     icon: TrendingUp },
        { name: 'Call History',            href: '/crm/calls',       icon: PhoneCall },
        { name: 'Telephony',               href: '/crm/telephony',   icon: Phone },
        { name: 'AI Core Insights',        href: '/crm/ai-insights', icon: Brain },
      ];
    case 'super-admin':
    case 'superadmin':
    case 'admin':
    case 'crm_admin':
      return [
        { name: t('navAdminPanel'),        href: '/crm/admin',       icon: Settings },
        { name: 'Kanban Board',           href: '/crm/kanban',      icon: Columns3 },
        { name: t('navLeads'),             href: '/crm/workspace',   icon: Megaphone },
        { name: 'Recovery',                href: '/crm/recovery',    icon: HeartHandshake },
        { name: 'Tasks',                   href: '/crm/tasks',       icon: CheckSquare },
        { name: t('navDirectorDashboard'), href: '/crm/dashboard',   icon: LayoutDashboard },
        { name: t('navClients'),           href: '/crm/clients',     icon: Users },
        { name: t('navVipClients'),        href: '/crm/vip',         icon: Sparkles },
        { name: 'Support Tickets',         href: '/crm/tickets',     icon: LifeBuoy },
        { name: 'Messages',                href: '/crm/messages',    icon: MessageSquare },
        { name: 'Sales Scripts',           href: '/crm/scripts',     icon: BookOpen },
        { name: 'KYC Review',              href: '/crm/kyc-review',  icon: ShieldCheckIcon },
        { name: 'Workflow Rules',          href: '/crm/workflows',   icon: Zap },
        { name: t('navManagerDashboard'),  href: '/crm/manager',     icon: TrendingUp },
        { name: 'Call History',            href: '/crm/calls',       icon: PhoneCall },
        { name: 'Telephony',               href: '/crm/telephony',   icon: Phone },
        { name: 'AI Core Insights',        href: '/crm/ai-insights', icon: Brain },
      ];
    case 'manager':
      return [
        { name: t('navManagerDashboard'), href: '/crm/manager',     icon: LayoutDashboard },
        { name: 'Kanban Board',           href: '/crm/kanban',      icon: Columns3 },
        { name: t('navLeads'),             href: '/crm/workspace',   icon: Megaphone },
        { name: 'Recovery',                href: '/crm/recovery',    icon: HeartHandshake },
        { name: 'Tasks',                   href: '/crm/tasks',       icon: CheckSquare },
        { name: t('navTeamPipeline'),     href: '/crm/workspace',   icon: Users },
        { name: t('navClients'),          href: '/crm/clients',     icon: ShieldCheck },
        { name: 'Support Tickets',         href: '/crm/tickets',     icon: LifeBuoy },
        { name: 'Messages',                href: '/crm/messages',    icon: MessageSquare },
        { name: 'Sales Scripts',           href: '/crm/scripts',     icon: BookOpen },
        { name: 'KYC Review',              href: '/crm/kyc-review',  icon: ShieldCheckIcon },
        { name: 'Workflow Rules',          href: '/crm/workflows',   icon: Zap },
        { name: t('navDirectorDashboard'),href: '/crm/dashboard',   icon: TrendingUp },
        { name: 'Call History',           href: '/crm/calls',       icon: PhoneCall },
        { name: 'AI Core Insights',       href: '/crm/ai-insights', icon: Brain },
      ];
    case 'agent':
      return [
        { name: t('navAgentWorkspace'),   href: '/crm/workspace',   icon: LayoutDashboard },
        { name: 'Kanban Board',           href: '/crm/kanban',      icon: Columns3 },
        { name: 'My Clients',             href: '/crm/my-clients',  icon: Users },
        { name: 'Recovery',                href: '/crm/recovery',   icon: HeartHandshake },
        { name: 'Tasks',                   href: '/crm/tasks',      icon: CheckSquare },
        { name: 'Support Tickets',         href: '/crm/tickets',    icon: LifeBuoy },
        { name: 'Messages',                href: '/crm/messages',   icon: MessageSquare },
        { name: 'Sales Scripts',           href: '/crm/scripts',    icon: BookOpen },
      ];
    default:
      return [
        { name: t('navDirectorDashboard'), href: '/crm/dashboard', icon: LayoutDashboard },
      ];
  }
}

export function Layout({ children, role, onLogout }: { children: ReactNode, role: string, onLogout: () => void }) {
  const { t, locale, toggleLocale } = useI18n();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigation = getNavForRole(role, t);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Ping last_seen_at so managers can see real online status
  useEffect(() => {
    const ping = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', user.id);
      }
    };
    ping();
    const iv = setInterval(ping, 2 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const SidebarContent = () => (
    <>
      <div className="flex h-24 items-center px-8 shrink-0 justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Bullenhaus Logo"
            className="h-16 w-auto object-contain drop-shadow-[0_0_16px_rgba(212,175,55,0.35)]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              document.getElementById('crm-logo-fallback')!.style.display = 'flex';
            }}
          />
          <div id="crm-logo-fallback" className="hidden items-center gap-3">
            <div className="h-8 w-1 bg-aura-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]"></div>
            <span className="text-xs font-bold tracking-[0.3em] text-aura-gold">BULLENHAUS</span>
          </div>
        </div>
        <button className="md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <X className="w-5 h-5 text-aura-platinum/50" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-6 relative z-10 custom-scrollbar">
        <div>
          <div className="mb-2 px-4 text-[10px] font-bold tracking-widest text-aura-platinum/30 uppercase">{t('commandCenter')}</div>
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              const customIconSrc = iconMap[item.name];
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-300 outline-none focus:outline-none overflow-hidden cursor-pointer",
                    "bg-gradient-to-b from-[#1A1A1E] via-[#101014] to-[#08080C] shadow-[0_4px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.6)]",
                    isActive 
                      ? "border border-aura-gold/40 text-aura-gold shadow-[0_6px_16px_rgba(212,175,55,0.15),inset_0_1px_2px_rgba(255,255,255,0.1),inset_0_-1px_3px_rgba(0,0,0,0.6)]" 
                      : "border border-white/5 text-aura-platinum/50 hover:bg-white/5 hover:text-aura-platinum hover:border-aura-gold/20 hover:shadow-[0_6px_12px_rgba(212,175,55,0.1),inset_0_1px_2px_rgba(255,255,255,0.1),inset_0_-1px_3px_rgba(0,0,0,0.6)]"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-aura-gold via-yellow-400 to-aura-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                  )}
                  <div className={clsx(
                    "p-1 rounded-lg glass-card shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] border relative z-10 shrink-0",
                    isActive ? "border-aura-gold/30" : "border-white/5 group-hover:border-aura-gold/20 transition-colors"
                  )}>
                    {customIconSrc ? (
                      <img 
                        src={customIconSrc} 
                        alt={item.name} 
                        className={clsx(
                          "w-4 h-4 object-contain transition-all duration-300",
                          isActive ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.8)] filter brightness-110" : "opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_6px_rgba(212,175,55,0.5)] filter grayscale-[0.3]"
                        )}
                      />
                    ) : (
                      <Icon className={clsx("w-3.5 h-3.5 transition-all duration-300", isActive ? "text-aura-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" : "text-aura-platinum/50 group-hover:text-aura-gold group-hover:drop-shadow-[0_0_6px_rgba(212,175,55,0.5)]")} />
                    )}
                  </div>
                  <span className={clsx(
                    "font-bold text-[10px] tracking-wider uppercase relative z-10 flex-1",
                    isActive ? "glow-text text-yellow-200" : "group-hover:text-white transition-colors"
                  )}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Zone switcher — admin only */}
        {role === 'admin' && (
          <div>
            <div className="mb-2 px-4 text-[10px] font-bold tracking-widest text-aura-platinum/30 uppercase">Switch Zone</div>
            <Link
              to="/trade/dashboard"
              className="flex items-center gap-4 px-4 py-3 rounded text-sm transition-colors text-sky-400/60 hover:bg-sky-500/10 hover:text-sky-400 border-l-2 border-transparent outline-none focus:outline-none"
            >
              <Database className="w-4 h-4" />
              Trade Platform
            </Link>
            <Link
              to="/admin"
              className="flex items-center gap-4 px-4 py-3 rounded text-sm transition-colors text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400 border-l-2 border-transparent outline-none focus:outline-none"
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </Link>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 glass-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded overflow-hidden flex items-center justify-center border border-aura-gold/20 shadow-[0_0_10px_rgba(212,175,55,0.2)] glass-card p-1">
            <img src="/assets/icons/role_badge.png" alt="Role Badge" className="w-full h-full object-contain filter brightness-110 drop-shadow-[0_0_4px_rgba(212,175,55,0.6)]" />
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase">{role}</div>
            <div className="text-[9px] uppercase tracking-widest text-aura-gold">{t('auraAccount')}</div>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 text-aura-platinum/30 hover:text-aura-ruby transition-colors relative group">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-aura-black text-aura-platinum flex font-sans selection:bg-aura-gold/30">
      {/* Desktop Sidebar — premium with ambient gold glow + visible gold border */}
      <div className="w-72 bg-gradient-to-b from-[#0C0C10] via-[#0A0A0E] to-[#060608] border-r border-gold/15 flex-col shrink-0 relative overflow-hidden hidden md:flex shadow-[10px_0_50px_rgba(0,0,0,0.6)]">
        {/* Ambient gold glow at top */}
        <div
          className="absolute top-0 left-0 right-0 h-56 pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.22) 0%, transparent 70%)',
          }}
        />
        {/* Visible gold accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#0C0C10] via-[#0A0A0E] to-[#060608] border-r border-gold/15 flex flex-col md:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden glass-card">
        {/* Global Command/Alert Bar — premium with bottom gold hairline */}
        <div className="relative h-9 glass-card-b border-gold/10 flex items-center justify-between px-6 shrink-0 z-30 overflow-hidden">
          {/* Bottom gold hairline */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
          <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest font-mono text-aura-platinum/40">
             <span className="flex items-center gap-1.5">
               <span className="relative flex h-1.5 w-1.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aura-emerald opacity-75" />
                 <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-aura-emerald shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
               </span>
               {t('systemStatusOnline')}
             </span>
             <span className="hidden sm:inline opacity-40">|</span>
             <span className="hidden sm:inline">LATENCY: 12MS</span>
             <span className="hidden md:inline opacity-40">|</span>
             <span className="hidden md:inline">{t('tradingEngineConnected')}</span>
          </div>
          <div className="text-[9px] uppercase tracking-widest font-mono text-aura-platinum/40 flex items-center gap-3">
             <span className="flex items-center gap-1.5">
               <ShieldCheck className="w-2.5 h-2.5 text-aura-gold/60" />
               {t('secureSessionActive')}
             </span>
          </div>
        </div>

        {/* Header — premium with bottom gold hairline */}
        <header className="relative h-16 md:h-20 border-b border-glass-border bg-black/25 backdrop-blur-xl px-6 md:px-10 flex items-center justify-between shrink-0 z-20">
          {/* Bottom gold hairline */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-aura-gold/25 to-transparent" />
          <div className="flex items-center gap-4">
             <button className="md:hidden p-2 -ml-2 text-aura-platinum/50 hover:text-aura-platinum" onClick={() => setMobileMenuOpen(true)}>
               <Menu className="w-5 h-5" />
             </button>
             <h1 className="font-serif text-xl md:text-2xl font-light italic tracking-tight hidden sm:block">
               <span className="bg-gradient-to-r from-aura-platinum via-aura-platinum to-aura-gold/80 bg-clip-text text-transparent">
                 {navigation.find(n => n.href === location.pathname)?.name || t('commandCenter')}
               </span>
             </h1>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2 bg-gradient-to-r from-aura-emerald/10 to-transparent px-3 py-1.5 rounded-full border border-aura-emerald/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aura-emerald opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-aura-emerald shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              </span>
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-aura-emerald">{t('aiCoreActive')}</span>
            </div>
            <button
              type="button"
              onClick={toggleLocale}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-aura-platinum/60 hover:text-aura-gold hover:border-aura-gold/40 hover:bg-aura-gold/5 transition-all"
              title={t('switchLanguage')}
            >
              {locale === 'en' ? 'DE' : 'EN'}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4 pb-12">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Team Chat widget — available to everyone with CRM access */}
      <TeamChat />
    </div>
  );
}
