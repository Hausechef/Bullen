import React, { useState } from 'react';

/**
 * Unified asset icon.
 *
 * Resolution order for a symbol (accepts raw pairs like "BTCUSDT" / "EURUSD"
 * and plain tickers like "BTC"):
 *   1. Metals (XAUUSD, XAG…)  -> /assets/metals/<metal>.svg badge
 *   2. Forex pairs            -> two overlapping circle flags from /assets/flags/
 *   3. Crypto                 -> /assets/coins/<base>.png logo
 *   4. Anything else / 404    -> the original lettered square fallback
 */

const CURRENCY_FLAGS: Record<string, string> = {
  EUR: 'eu', USD: 'us', GBP: 'gb', JPY: 'jp', CHF: 'ch', AUD: 'au',
  CAD: 'ca', NZD: 'nz', TRY: 'tr', MXN: 'mx', ZAR: 'za', SEK: 'se',
  NOK: 'no', DKK: 'dk', PLN: 'pl', CNH: 'cn', SGD: 'sg',
};

const METALS = new Set(['XAU', 'XAG', 'XPT', 'XPD']);

const baseOf = (symbol: string): string => {
  const s = (symbol || '').toUpperCase();
  return (s.endsWith('USDT') ? s.slice(0, -4) : s).toLowerCase();
};

/** Splits a 6-letter forex pair into [base, quote] if both are known currencies. */
const splitForexPair = (symbol: string): [string, string] | null => {
  const s = (symbol || '').toUpperCase();
  if (s.length !== 6) return null;
  const a = s.slice(0, 3);
  const b = s.slice(3);
  if (CURRENCY_FLAGS[a] && CURRENCY_FLAGS[b]) return [a, b];
  return null;
};

interface AssetIconProps {
  symbol: string;
  /** Square size in px. Defaults to 32. */
  size?: number;
  className?: string;
}

const LetterFallback: React.FC<AssetIconProps> = ({ symbol, size = 32, className = '' }) => {
  const label = (symbol || '?').toUpperCase().replace('USDT', '').substring(0, 3);
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.28)) }}
      className={`rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white shrink-0 ${className}`}
    >
      {label}
    </div>
  );
};

/** Two overlapping circle flags: base bottom-left, quote top-right. */
const ForexPairIcon: React.FC<{ base: string; quote: string; size: number; className: string; onError: () => void }> = ({
  base, quote, size, className, onError,
}) => {
  const flagSize = Math.round(size * 0.72);
  return (
    <div style={{ width: size, height: size }} className={`relative shrink-0 ${className}`}>
      <img
        src={`/assets/flags/${CURRENCY_FLAGS[quote]}.svg`}
        alt={quote}
        width={flagSize}
        height={flagSize}
        style={{ width: flagSize, height: flagSize }}
        className="absolute top-0 right-0 rounded-full"
        onError={onError}
        loading="lazy"
      />
      <img
        src={`/assets/flags/${CURRENCY_FLAGS[base]}.svg`}
        alt={base}
        width={flagSize}
        height={flagSize}
        style={{ width: flagSize, height: flagSize }}
        className="absolute bottom-0 left-0 rounded-full ring-2 ring-[#0d0f14]"
        onError={onError}
        loading="lazy"
      />
    </div>
  );
};

export const AssetIcon: React.FC<AssetIconProps> = ({ symbol, size = 32, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const s = (symbol || '').toUpperCase();

  if (failed || !s) {
    return <LetterFallback symbol={symbol} size={size} className={className} />;
  }

  // 1. Metals — XAUUSD, XAGUSD, XPTUSD, XPDUSD (or bare XAU…)
  const metal = METALS.has(s.slice(0, 3)) ? s.slice(0, 3).toLowerCase() : null;
  if (metal) {
    return (
      <img
        src={`/assets/metals/${metal}.svg`}
        alt={symbol}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`rounded-full shrink-0 ${className}`}
        onError={() => setFailed(true)}
        loading="lazy"
      />
    );
  }

  // 2. Forex pairs — two overlapping flags
  const fx = splitForexPair(s);
  if (fx) {
    return (
      <ForexPairIcon
        base={fx[0]}
        quote={fx[1]}
        size={size}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  // 3. Crypto logo
  const base = baseOf(s);
  return (
    <img
      src={`/assets/coins/${base}.png`}
      alt={symbol}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-full object-contain shrink-0 ${className}`}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
};
