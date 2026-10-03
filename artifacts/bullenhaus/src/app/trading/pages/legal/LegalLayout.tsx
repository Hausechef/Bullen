import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Section {
  heading: string;
  body: React.ReactNode;
}

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: Section[];
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, subtitle, lastUpdated, sections }) => {
  const { t } = useTranslation('common');
  
  const NAV_LINKS = [
    { label: t('legal.nav.contact'), href: '/legal/contact'   },
    { label: t('legal.nav.terms'),     href: '/legal/terms'     },
    { label: t('legal.nav.privacy'),       href: '/legal/privacy'   },
    { label: t('legal.nav.aml'),     href: '/legal/aml'       },
    { label: t('legal.nav.corporate'),       href: '/legal/corporate' },
  ];

  return (
  <div className="min-h-dvh bg-[#0a0a0b] text-slate-300 font-sans">
    {/* Fixed glow */}
    <div className="fixed top-0 left-1/4 w-96 h-96 bg-yellow-500/5 blur-[180px] rounded-full pointer-events-none" />
    <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 blur-[180px] rounded-full pointer-events-none" />

    {/* Top bar */}
    <header className="sticky top-0 z-30 bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/trade/dashboard" className="flex items-center gap-2 text-xs text-slate-500 hover:text-accent-primary transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          {t('legal.backToPlatform')}
        </Link>

        <div className="flex items-center gap-2">
          <img src="/bullenhaus-logo.png" alt="Bullenhaus" className="h-7 w-auto" onError={e => (e.currentTarget.style.display = 'none')} />
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Bullenhaus</span>
        </div>

        <nav className="hidden md:flex items-center gap-5">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-slate-500 hover:text-accent-primary transition-colors font-medium whitespace-nowrap">
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>

    {/* Hero */}
    <div className="max-w-5xl mx-auto px-6 pt-16 pb-10">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={14} className="text-accent-primary" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-accent-primary font-bold">{t('legal.documentation')}</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">{title}</h1>
      <p className="text-slate-400 text-base max-w-2xl leading-relaxed">{subtitle}</p>
      <p className="mt-4 text-[10px] text-slate-600 uppercase tracking-widest font-bold">{t('legal.lastUpdated')}: {lastUpdated}</p>
    </div>

    {/* Content */}
    <main className="max-w-5xl mx-auto px-6 pb-20">
      <div className="border-t border-white/5 pt-10 space-y-12">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-[10px] font-black text-accent-primary flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              {s.heading}
            </h2>
            <div className="ml-9 text-sm text-slate-400 leading-relaxed space-y-3">{s.body}</div>
          </section>
        ))}
      </div>
    </main>

    {/* Bottom nav */}
    <footer className="border-t border-white/5 py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {NAV_LINKS.map(l => (
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-slate-500 hover:text-accent-primary transition-colors">
            {l.label}
          </a>
        ))}
      </div>
      <p className="text-center text-[10px] text-slate-600 mt-4">
        &copy; {new Date().getFullYear()} Bullenhaus. {t('legal.allRightsReserved')}
      </p>
    </footer>
  </div>
);
};
