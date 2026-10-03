import React from 'react';
import {
  Coins, LineChart, Zap, ShieldCheck, Bell, Layers, Smartphone, Rocket,
  BrainCircuit, BarChart3, Gauge, Globe, ArrowRight,
} from 'lucide-react';

const SectionHeader: React.FC<{ eyebrow: string; title: string; sub?: string }> = ({ eyebrow, title, sub }) => (
  <div className="mx-auto mb-10 max-w-2xl text-center">
    <p className="label-eyebrow text-gold/80">{eyebrow}</p>
    <h2 className="section-title mt-2">{title}</h2>
    {sub && <p className="mt-3 text-sm leading-relaxed text-text-muted">{sub}</p>}
  </div>
);

// ── Platform advantages ──────────────────────────────────────────────────────
const ADVANTAGES = [
  { icon: Coins, title: 'Multi-asset access', desc: 'Trade crypto, Forex and precious metals from one unified account.' },
  { icon: Zap, title: 'Fast execution', desc: 'Low-latency order routing so your fills track the price you see.' },
  { icon: ShieldCheck, title: 'Risk management', desc: 'Stop-loss, take-profit and margin controls built into every ticket.' },
  { icon: Bell, title: 'Smart alerts', desc: 'Price and volatility alerts that reach you on desktop and mobile.' },
  { icon: BarChart3, title: 'Market overview', desc: 'Clean, responsive charts with the depth serious traders expect.' },
  { icon: Smartphone, title: 'Desktop & mobile', desc: 'A consistent premium terminal on every screen size.' },
];

// ── Strong feature highlights (large tiles) ──────────────────────────────────
const FEATURES = [
  { icon: Layers, title: 'Multi-asset trading', desc: 'Crypto, Forex majors, and metals side by side — diversify without switching platforms.' },
  { icon: Gauge, title: 'Fast, precise fills', desc: 'A responsive engine and live pricing keep execution tight during fast markets.' },
  { icon: Globe, title: 'Global markets', desc: 'Follow currencies and commodities around the clock with a live market overview.' },
];

export const PlatformAdvantages: React.FC = () => (
  <section className="panel-shell px-4 py-16" aria-labelledby="adv-title">
    <SectionHeader
      eyebrow="Why Bullenhaus"
      title="Everything a modern trader needs"
      sub="A premium multi-asset terminal built for speed, clarity and control."
    />
    <div id="adv-title" className="sr-only">Platform advantages</div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ADVANTAGES.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="card-premium surface-hover p-6">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-border-gold bg-gold-soft text-gold">
            <Icon size={20} />
          </div>
          <h3 className="mb-1.5 font-serif text-lg font-semibold text-text">{title}</h3>
          <p className="text-sm leading-relaxed text-text-muted">{desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export const PreMarketSection: React.FC<{ onCtaClick: () => void }> = ({ onCtaClick }) => (
  <section className="panel-shell px-4 py-16" aria-labelledby="premarket-title">
    <div className="card-premium relative overflow-hidden p-8 md:p-12">
      <div className="bg-ambient-gold absolute -right-20 -top-20 h-64 w-64" />
      <div className="relative grid items-center gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-gold bg-gold-soft px-3 py-1">
            <Rocket size={13} className="text-gold" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gold-light">Premarket</span>
          </div>
          <h2 id="premarket-title" className="section-title">Get in before the crowd</h2>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Access premarket opportunities and pre-IPO style allocations the moment they open.
            Position early on emerging assets with transparent terms and a fixed price at signing.
          </p>
          <ul className="mt-5 space-y-2.5">
            {['Early access to pre-market assets', 'Fixed price locked at signing', 'Transparent, contract-backed allocations'].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-text">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-success-soft text-success">✓</span>
                {t}
              </li>
            ))}
          </ul>
          <button onClick={onCtaClick} className="btn-gold mt-7">
            Explore premarket <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Rocket, k: 'Early entry', v: 'Pre-launch' },
            { icon: LineChart, k: 'Upside potential', v: 'High' },
            { icon: ShieldCheck, k: 'Terms', v: 'Contract-backed' },
            { icon: Gauge, k: 'Price', v: 'Fixed at signing' },
          ].map(({ icon: Icon, k, v }) => (
            <div key={k} className="glass-card p-5">
              <Icon size={18} className="text-gold" />
              <p className="mt-3 text-[11px] uppercase tracking-wider text-text-muted">{k}</p>
              <p className="mt-0.5 font-serif text-lg font-semibold text-text">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export const ITodaySection: React.FC = () => (
  <section className="panel-shell px-4 py-16" aria-labelledby="itools-title">
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
        {[
          { icon: BrainCircuit, k: 'AI insights', v: 'Signal scoring' },
          { icon: BarChart3, k: 'Analytics', v: 'Market depth' },
          { icon: Bell, k: 'Alerts', v: 'Real-time' },
          { icon: Gauge, k: 'Risk radar', v: 'Exposure view' },
        ].map(({ icon: Icon, k, v }) => (
          <div key={k} className="card-premium surface-hover p-5">
            <Icon size={18} className="text-gold" />
            <p className="mt-3 text-[11px] uppercase tracking-wider text-text-muted">{k}</p>
            <p className="mt-0.5 font-serif text-lg font-semibold text-text">{v}</p>
          </div>
        ))}
      </div>

      <div className="order-1 lg:order-2">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-info/30 bg-info-soft px-3 py-1">
          <BrainCircuit size={13} className="text-info" />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-info">iTools</span>
        </div>
        <h2 id="itools-title" className="section-title">Analytics that work while you trade</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          iTools is the platform's analytical module: market scanning, signal scoring, risk exposure
          and volatility alerts in one place — so you spend less time hunting and more time deciding.
        </p>
        <ul className="mt-5 space-y-2.5">
          {['Cross-asset market scanner', 'Volatility & momentum signals', 'Portfolio risk & exposure radar'].map((t) => (
            <li key={t} className="flex items-center gap-2.5 text-sm text-text">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-info-soft text-info">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export const StrongFeatures: React.FC = () => (
  <section className="panel-shell px-4 py-16" aria-labelledby="feat-title">
    <SectionHeader eyebrow="Platform strength" title="Built for serious execution" />
    <div id="feat-title" className="sr-only">Strong platform features</div>
    <div className="grid gap-5 md:grid-cols-3">
      {FEATURES.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="card-premium relative overflow-hidden p-7">
          <div className="hairline-gold-top absolute inset-x-0 top-0 h-px" />
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-border-gold bg-gold-soft text-gold">
            <Icon size={22} />
          </div>
          <h3 className="mb-2 font-serif text-xl font-semibold text-text">{title}</h3>
          <p className="text-sm leading-relaxed text-text-muted">{desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export const OffersSection: React.FC<{ onCtaClick: () => void }> = ({ onCtaClick }) => (
  <section className="panel-shell px-4 py-16" aria-labelledby="offers-title">
    <div className="card-premium relative overflow-hidden p-8 text-center md:p-14">
      <div className="bg-ambient-gold absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2" />
      <div className="relative mx-auto max-w-2xl">
        <p className="label-eyebrow text-gold/80">Limited offer</p>
        <h2 id="offers-title" className="section-title mt-2">Start trading with a premium edge</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          Open an account today and unlock multi-asset trading, premarket access and the full iTools
          analytics suite. Fast onboarding, transparent terms, and support on desktop and mobile.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { k: 'Welcome package', v: 'Priority onboarding' },
            { k: 'iTools included', v: 'Full analytics suite' },
            { k: 'Premarket access', v: 'Early allocations' },
          ].map(({ k, v }) => (
            <div key={k} className="glass-card p-5">
              <p className="text-[11px] uppercase tracking-wider text-text-muted">{k}</p>
              <p className="mt-1 font-serif text-base font-semibold text-gold-light">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={onCtaClick} className="btn-gold w-full sm:w-auto">
            Log in to continue <ArrowRight size={16} />
          </button>
          <a href="/register" className="btn-ghost w-full text-center sm:w-auto">Create an account</a>
        </div>
        <p className="mt-4 text-[11px] text-text-dim">
          Trading involves risk. Promotional content describes platform features only.
        </p>
      </div>
    </div>
  </section>
);
