import { loginText } from './loginLanguage';
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Quote } from './useMarketPreview';

const fmtPrice = (p: number) =>
  p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 0 })
  : p >= 1 ? p.toFixed(2)
  : p.toFixed(4);

const TickerItem: React.FC<{ q: Quote }> = ({ q }) => {
  const up = q.direction !== 'down';
  return (
    <div className="flex items-center gap-2.5 px-5 py-2 whitespace-nowrap" aria-hidden="true">
      {q.icon ? (
        <img
          src={q.icon}
          alt=""
          className="h-5 w-5 rounded-full"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      ) : null}
      <span className="font-mono text-xs font-semibold tracking-wide text-text">{q.symbol}</span>
      <span className="font-mono text-xs text-text-muted">${fmtPrice(q.price)}</span>
      <span
        className={`flex items-center gap-0.5 font-mono text-xs font-semibold ${up ? 'text-success' : 'text-danger'}`}
      >
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {q.change >= 0 ? '+' : ''}{q.change.toFixed(2)}%
      </span>
      <span className="ml-1 h-3 w-px bg-border" />
    </div>
  );
};

/**
 * CryptoTicker — seamless horizontal crypto price strip.
 * The list is rendered twice inside a flex track animated by -50%, so the loop
 * is gapless. Animation pauses on hover and is disabled under reduced-motion.
 */
export const CryptoTicker: React.FC<{ quotes: Quote[]; live: boolean }> = ({ quotes, live }) => {
  if (quotes.length === 0) return null;

  return (
    <div
      className="ticker-group relative flex items-center overflow-hidden border-y border-glass-border bg-bg-2/10 backdrop-blur-xl"
      role="marquee"
      aria-label={loginText("Live cryptocurrency prices")}
      style={{
        // 3D glass: 10% opacity, strong blur, layered shadow + inner highlight
        background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(12,12,16,0.10))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25), 0 4px 20px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.5)',
        transform: 'perspective(800px) rotateX(2deg)',
      }}
    >
      {/* Live/demo badge + edge fades */}
      <div className="relative z-10 flex shrink-0 items-center gap-1.5 border-r border-border bg-bg px-4 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-gold" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
          {loginText(live ? 'Live' : 'Demo')}</span>
      </div>

      <div className="pointer-events-none absolute left-[76px] top-0 z-10 h-full w-12 bg-gradient-to-r from-black/20 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-black/20 to-transparent" />

      <div className="flex min-w-full shrink-0 animate-ticker">
        {quotes.map((q) => <TickerItem key={`a-${q.symbol}`} q={q} />)}
        {quotes.map((q) => <TickerItem key={`b-${q.symbol}`} q={q} />)}
      </div>
    </div>
  );
};
