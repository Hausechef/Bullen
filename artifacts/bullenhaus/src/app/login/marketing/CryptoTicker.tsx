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
      className="ticker-group relative flex items-center overflow-hidden border-y border-border bg-bg-2/80 backdrop-blur-sm"
      role="marquee"
      aria-label="Live cryptocurrency prices"
    >
      {/* Live/demo badge + edge fades */}
      <div className="relative z-10 flex shrink-0 items-center gap-1.5 border-r border-border bg-bg px-4 py-2">
        <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-success animate-pulse-gold' : 'bg-warning'}`} />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
          {live ? 'Live' : 'Demo'}
        </span>
      </div>

      <div className="pointer-events-none absolute left-[76px] top-0 z-10 h-full w-12 bg-gradient-to-r from-bg-2 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-bg-2 to-transparent" />

      <div className="flex min-w-full shrink-0 animate-ticker">
        {quotes.map((q) => <TickerItem key={`a-${q.symbol}`} q={q} />)}
        {quotes.map((q) => <TickerItem key={`b-${q.symbol}`} q={q} />)}
      </div>
    </div>
  );
};
