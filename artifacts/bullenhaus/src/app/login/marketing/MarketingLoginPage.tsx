import { loginText, useLoginLanguage } from './loginLanguage';
import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Coins, DollarSign, Gem, ShieldCheck } from 'lucide-react';
import { LoginPanel } from './LoginDropdown';
import { CryptoTicker } from './CryptoTicker';
import { MarketWidgets } from './MarketWidgets';
import {
  PlatformAdvantages, PreMarketSection, ITodaySection, StrongFeatures, OffersSection,
} from './PromoSections';
import { useMarketPreview } from './useMarketPreview';

/**
 * MarketingLoginPage — the public /login experience: a full trading-themed
 * marketing page with a persistent background, a header "Log In" trigger that
 * opens a dropdown panel OVER the page, a live crypto ticker, crypto/forex/metals
 * market widgets, and promo sections (advantages, premarket, iTools, features,
 * offers). See useMarketPreview.ts for which data is live vs demo.
 */
export default function MarketingLoginPage() {
  const { language, setLanguage } = useLoginLanguage();
  const [loginOpen, setLoginOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const market = useMarketPreview();
  const openLogin = () => setLoginOpen(true);

  return (
    <div lang={language} data-login-language={language} className="relative min-h-dvh w-full overflow-x-hidden bg-bg text-text">
      {/* ── Persistent background (always visible, incl. when login is open) ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 55% at 50% -5%, rgba(212,175,55,0.20) 0%, rgba(212,175,55,0.05) 35%, transparent 65%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 108%, rgba(16,185,129,0.06) 0%, transparent 60%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-luminosity"
          style={{ backgroundImage: "url('/images/golden_bull_bg.png')", backgroundSize: 'cover', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat' }}
        />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'repeating-conic-gradient(from 0deg at 50% 50%, #fff 0deg 1deg, transparent 1deg 2deg)' }} />
      </div>

      {/* ── Header / top bar ── */}
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="panel-shell flex items-center justify-between px-4 py-3">
          <a href="/login" className="flex items-center gap-2.5" aria-label={loginText("Bullenhaus home")}>
            <img
              src="/logo.png"
              alt="Bullenhaus"
              className="h-9 w-auto object-contain drop-shadow-[0_0_16px_rgba(212,175,55,0.5)]"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="hidden font-serif text-lg font-bold tracking-tight gold-gradient-text sm:inline">BULLENHAUS</span>
          </a>

          <nav className="hidden items-center gap-7 text-sm text-text-muted lg:flex" aria-label={loginText("Primary")}>
            <a href="#markets" className="transition-colors hover:text-text">{loginText("Markets")}</a>
            <a href="#premarket" className="transition-colors hover:text-text">{loginText("Premarket")}</a>
            <a href="#itools" className="transition-colors hover:text-text">iTools</a>
            <a href="#features" className="transition-colors hover:text-text">{loginText("Platform")}</a>
          </nav>

          <div className="flex items-center gap-3">
            <div role="group" aria-label={language === 'de' ? 'Sprache' : 'Language'} className="flex items-center gap-1">
              {(['en', 'de'] as const).map((code) => (
                <button key={code} type="button" onClick={() => setLanguage(code)} aria-pressed={language === code}
                  aria-label={code === 'en' ? 'English' : 'Deutsch'} title={code === 'en' ? 'English' : 'Deutsch'}
                  className={language === code ? 'btn-gold text-xs' : 'btn-ghost text-xs'}
                  style={{ minWidth: 44, minHeight: 44, padding: '8px' }}>
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <a
              href="https://bullenhaus.st"
              className="hidden items-center gap-2 rounded-lg border border-border bg-bg-2/60 px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:border-gold/40 hover:text-text sm:flex"
              target="_blank"
              rel="noopener noreferrer"
            >
              BHGroupe
            </a>
            <button
              ref={triggerRef}
              onClick={() => setLoginOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={loginOpen}
              aria-controls="login-panel"
              className="btn-gold px-3 py-2.5 text-sm"
              style={{ minHeight: 44 }}
            >
              <LogIn size={16} />
              {loginText("Log In")}</button>
          </div>
        </div>
      </header>

      {/* The dropdown auth panel (overlays the page; background stays visible) */}
      <LoginPanel open={loginOpen} onClose={() => setLoginOpen(false)} returnFocusRef={triggerRef} labelledById="login-panel" />

      {/* Crypto ticker — directly under the header, 3D glass strip */}
      <div className="relative z-20">
        <CryptoTicker quotes={market.crypto} live={market.cryptoMode === 'live'} />
      </div>

      {/* ── Main content ── */}
      <main className="relative z-10">
        {/* Hero */}
        <section className="panel-shell px-4 pb-10 pt-16 text-center md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-3xl"
          >
            <p className="label-eyebrow text-gold/80">{loginText("Private multi-asset trading terminal")}</p>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] tracking-tight text-text md:text-6xl">
              {loginText('Trade crypto, Forex & metals')}<br />
              <span className="gold-gradient-text">{loginText("with a premium edge")}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-text-muted">
              {loginText("Fast execution, premarket access and the iTools analytics suite — one elegant terminal on desktop and mobile.")}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={openLogin} className="btn-gold w-full sm:w-auto">
                <LogIn size={16} /> {loginText("Log in to your account")}</button>
              <a href="/register" className="btn-ghost w-full text-center sm:w-auto">{loginText("Open an account")}</a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-dim">
              <span className="inline-flex items-center gap-1.5"><Coins size={13} className="text-gold" /> {loginText("Crypto")}</span>
              <span className="inline-flex items-center gap-1.5"><DollarSign size={13} className="text-gold" /> {loginText("Forex")}</span>
              <span className="inline-flex items-center gap-1.5"><Gem size={13} className="text-gold" /> {loginText("Metals")}</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-gold" /> {loginText("Risk controls")}</span>
            </div>
          </motion.div>
        </section>

        {/* Market widgets */}
        <section id="markets" className="panel-shell px-4 py-16" aria-labelledby="markets-title">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="label-eyebrow text-gold/80">{loginText("Live market overview")}</p>
            <h2 id="markets-title" className="section-title mt-2">{loginText('Crypto, Forex & Metals at a glance')}</h2>
          </div>
          <MarketWidgets
            crypto={market.crypto}
            forex={market.forex}
            metals={market.metals}
            cryptoMode={market.cryptoMode}
            forexMode={market.forexMode}
            metalsMode={market.metalsMode}
            loading={market.loading}
            error={market.error}
          />
        </section>

        {/* Promo sections */}
        <PlatformAdvantages />
        <div id="premarket"><PreMarketSection onCtaClick={openLogin} /></div>
        <div id="itools"><ITodaySection /></div>
        <div id="features"><StrongFeatures /></div>
        <OffersSection onCtaClick={openLogin} />

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="panel-shell flex flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-text-muted sm:flex-row">
            <p>© {new Date().getFullYear()} {loginText("Bullenhaus. Trading involves risk.")}</p>
            <nav className="flex flex-wrap items-center justify-center gap-4" aria-label={loginText("Legal")}>
              <a href="/legal/terms" className="transition-colors hover:text-text">{loginText("Terms")}</a>
              <a href="/legal/privacy" className="transition-colors hover:text-text">{loginText("Privacy")}</a>
              <a href="/legal/aml" className="transition-colors hover:text-text">AML</a>
              <a href="/legal/contact" className="transition-colors hover:text-text">{loginText("Contact")}</a>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
