import React from 'react';
import { TrendingUp, TrendingDown, Bitcoin, DollarSign, Gem, Loader2, WifiOff } from 'lucide-react';
import type { Quote, FeedMode } from './useMarketPreview';

const fmt = (p: number) =>
  p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 0 })
  : p >= 1 ? p.toFixed(2)
  : p.toFixed(4);

const FeedBadge: React.FC<{ mode: FeedMode }> = ({ mode }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]
      ${mode === 'live'
        ? 'border-success/30 bg-success-soft text-success'
        : 'border-warning/30 bg-warning-soft text-warning'}`}
  >
    <span className={`h-1 w-1 rounded-full ${mode === 'live' ? 'bg-success' : 'bg-warning'}`} />
    {mode === 'live' ? 'Live' : 'Demo'}
  </span>
);

const Row: React.FC<{ q: Quote; unit?: string }> = ({ q, unit = '$' }) => {
  const up = q.direction !== 'down';
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        {q.icon ? (
          <img
            src={q.icon}
            alt=""
            className="h-6 w-6 shrink-0 rounded-full"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
          />
        ) : (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 text-[9px] font-bold text-text-muted">
            {q.symbol.slice(0, 3)}
          </span>
        )}
        <span className="truncate font-mono text-xs font-semibold text-text">{q.label}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-xs text-text tabular-nums">{unit}{fmt(q.price)}</span>
        <span className={`flex w-16 items-center justify-end gap-0.5 font-mono text-xs font-semibold tabular-nums ${up ? 'text-success' : 'text-danger'}`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {q.change >= 0 ? '+' : ''}{q.change.toFixed(2)}%
        </span>
      </div>
    </li>
  );
};

interface WidgetProps {
  title: string;
  icon: React.ReactNode;
  quotes: Quote[];
  mode: FeedMode;
  unit?: string;
  loading: boolean;
  error: string | null;
  note?: string;
}

const MarketWidget: React.FC<WidgetProps> = ({ title, icon, quotes, mode, unit, loading, error, note }) => (
  <div className="card-premium p-5">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-gold">{icon}</span>
        <h3 className="font-serif text-base font-semibold text-text">{title}</h3>
      </div>
      <FeedBadge mode={mode} />
    </div>

    {loading && quotes.length === 0 ? (
      <div className="flex h-40 items-center justify-center text-text-muted">
        <Loader2 className="animate-spin text-gold" size={20} />
      </div>
    ) : quotes.length === 0 ? (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-text-muted">
        <WifiOff size={18} />
        <p className="text-xs">{error ?? 'No market data available.'}</p>
      </div>
    ) : (
      <ul className="divide-y divide-border">
        {quotes.map((q) => <Row key={q.symbol} q={q} unit={unit} />)}
      </ul>
    )}

    {note && <p className="mt-3 text-[10px] leading-relaxed text-text-dim">{note}</p>}
  </div>
);

interface MarketWidgetsProps {
  crypto: Quote[];
  forex: Quote[];
  metals: Quote[];
  cryptoMode: FeedMode;
  forexMode: FeedMode;
  metalsMode: FeedMode;
  loading: boolean;
  error: string | null;
}

export const MarketWidgets: React.FC<MarketWidgetsProps> = ({
  crypto, forex, metals, cryptoMode, forexMode, metalsMode, loading, error,
}) => (
  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
    <MarketWidget
      title="Cryptocurrencies"
      icon={<Bitcoin size={18} />}
      quotes={crypto}
      mode={cryptoMode}
      loading={loading}
      error={error}
      note={cryptoMode === 'live' ? 'Live last price & 24h change via public exchange feed.' : undefined}
    />
    <MarketWidget
      title="Forex"
      icon={<DollarSign size={18} />}
      quotes={forex}
      mode={forexMode}
      unit=""
      loading={loading}
      error={error}
      note="Reference rates are live; intraday change % is indicative (simulated)."
    />
    <MarketWidget
      title="Metals"
      icon={<Gem size={18} />}
      quotes={metals}
      mode={metalsMode}
      loading={loading}
      error={error}
      note="Demo prices — a metals feed is not yet connected."
    />
  </div>
);
