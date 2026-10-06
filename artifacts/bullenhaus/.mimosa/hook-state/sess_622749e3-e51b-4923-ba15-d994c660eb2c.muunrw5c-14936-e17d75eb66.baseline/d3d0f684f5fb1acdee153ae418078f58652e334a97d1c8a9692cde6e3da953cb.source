/**
 * useMarketPreview — market data for the public login/marketing page.
 *
 * DATA SOURCES (honest):
 *   • Crypto  — LIVE from Binance public REST (`/api/v3/ticker/24hr`), the same
 *               endpoints the in-app market engine uses. Polled every 10s.
 *               Real last price + real 24h change %. Falls back to DEMO seeds
 *               if the request fails (offline / rate-limited).
 *   • Forex   — LIVE base prices from the free Frankfurter API
 *               (`api.frankfurter.app/latest?base=USD`). Frankfurter returns
 *               daily reference rates with no intraday delta, so the small
 *               change % shown for forex is SIMULATED for visual life (flagged
 *               `changeIsSimulated`). Falls back to DEMO seeds on failure.
 *   • Metals  — DEMO only. No free metals feed is wired in this project, so
 *               XAU/XAG/XPT/XPD use seed prices with a small simulated drift.
 *
 * To wire a real feed later, replace the `fetchCrypto`/`fetchForex` bodies (and
 * add a metals fetch) — the hook's return shape can stay identical.
 */
import { useEffect, useRef, useState } from 'react';

export type Direction = 'up' | 'down' | 'flat';

export interface Quote {
  symbol: string;      // e.g. 'BTC', 'EURUSD', 'XAUUSD'
  label: string;       // display label e.g. 'BTC/USDT', 'EUR/USD', 'Gold'
  price: number;
  change: number;      // 24h % (crypto real; forex/metals simulated)
  direction: Direction;
  icon?: string;       // optional asset icon url (crypto)
}

export type FeedMode = 'live' | 'demo';

export interface MarketPreview {
  crypto: Quote[];
  forex: Quote[];
  metals: Quote[];
  cryptoMode: FeedMode;
  forexMode: FeedMode;
  metalsMode: FeedMode; // always 'demo' in this build
  changeIsSimulated: { forex: boolean; metals: boolean };
  loading: boolean;
  error: string | null;
}

// ── Crypto universe (Binance symbols) ────────────────────────────────────────
const CRYPTO = [
  { sym: 'BTC', pair: 'BTCUSDT', seed: 68000, seedChange: 1.9 },
  { sym: 'ETH', pair: 'ETHUSDT', seed: 3550, seedChange: 1.2 },
  { sym: 'SOL', pair: 'SOLUSDT', seed: 172, seedChange: 3.4 },
  { sym: 'BNB', pair: 'BNBUSDT', seed: 610, seedChange: 0.8 },
  { sym: 'XRP', pair: 'XRPUSDT', seed: 0.62, seedChange: -1.1 },
  { sym: 'ADA', pair: 'ADAUSDT', seed: 0.46, seedChange: -0.7 },
  { sym: 'DOGE', pair: 'DOGEUSDT', seed: 0.15, seedChange: 2.6 },
  { sym: 'AVAX', pair: 'AVAXUSDT', seed: 36, seedChange: 1.5 },
  { sym: 'LINK', pair: 'LINKUSDT', seed: 17.5, seedChange: 0.9 },
  { sym: 'DOT', pair: 'DOTUSDT', seed: 7.2, seedChange: -0.4 },
  { sym: 'TON', pair: 'TONUSDT', seed: 7.6, seedChange: 1.1 },
  { sym: 'LTC', pair: 'LTCUSDT', seed: 84, seedChange: 0.5 },
] as const;

const CRYPTO_REST = [
  'https://api.binance.com/api/v3/ticker/24hr',
  'https://data-api.binance.vision/api/v3/ticker/24hr',
];

// ── Forex + metals seeds (mirror the in-app forexStore) ──────────────────────
const FOREX = [
  { sym: 'EURUSD', label: 'EUR/USD', seed: 1.0850 },
  { sym: 'GBPUSD', label: 'GBP/USD', seed: 1.2650 },
  { sym: 'USDJPY', label: 'USD/JPY', seed: 149.50 },
  { sym: 'USDCHF', label: 'USD/CHF', seed: 0.9050 },
  { sym: 'AUDUSD', label: 'AUD/USD', seed: 0.6530 },
  { sym: 'USDCAD', label: 'USD/CAD', seed: 1.3670 },
] as const;

const METALS = [
  { sym: 'XAUUSD', label: 'Gold', seed: 2340.0 },
  { sym: 'XAGUSD', label: 'Silver', seed: 27.8 },
  { sym: 'XPTUSD', label: 'Platinum', seed: 960.0 },
  { sym: 'XPDUSD', label: 'Palladium', seed: 1020.0 },
] as const;

const iconFor = (sym: string) => `/assets/coins/${sym.toLowerCase()}.png`;
const dir = (change: number): Direction => (change > 0.001 ? 'up' : change < -0.001 ? 'down' : 'flat');
// Deterministic-ish small simulated change so forex/metals cards aren't static.
const simChange = (seed: number) => ((Math.sin(seed * 12.9898) * 43758.5453) % 1) * 1.6 - 0.4;

function demoCrypto(): Quote[] {
  return CRYPTO.map((c) => ({
    symbol: c.sym,
    label: `${c.sym}/USDT`,
    price: c.seed,
    change: c.seedChange,
    direction: dir(c.seedChange),
    icon: iconFor(c.sym),
  }));
}

function demoForex(): Quote[] {
  return FOREX.map((f) => {
    const change = simChange(f.seed);
    return { symbol: f.sym, label: f.label, price: f.seed, change, direction: dir(change) };
  });
}

function demoMetals(): Quote[] {
  return METALS.map((m) => {
    const change = simChange(m.seed);
    return { symbol: m.sym, label: m.label, price: m.seed, change, direction: dir(change) };
  });
}

async function fetchCrypto(signal: AbortSignal): Promise<Quote[] | null> {
  const symbolsParam = encodeURIComponent(JSON.stringify(CRYPTO.map((c) => c.pair)));
  for (const base of CRYPTO_REST) {
    try {
      const res = await fetch(`${base}?symbols=${symbolsParam}`, { signal });
      if (!res.ok) continue;
      const rows: any[] = await res.json();
      const bySym = new Map(rows.map((r) => [r.symbol, r]));
      return CRYPTO.map((c) => {
        const row = bySym.get(c.pair);
        const price = row ? parseFloat(row.lastPrice) : c.seed;
        const change = row ? parseFloat(row.priceChangePercent) : c.seedChange;
        return {
          symbol: c.sym,
          label: `${c.sym}/USDT`,
          price: Number.isFinite(price) ? price : c.seed,
          change: Number.isFinite(change) ? change : c.seedChange,
          direction: dir(change),
          icon: iconFor(c.sym),
        };
      });
    } catch {
      /* try next base */
    }
  }
  return null;
}

async function fetchForex(signal: AbortSignal): Promise<Quote[] | null> {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?base=USD', { signal });
    if (!res.ok) return null;
    const data: { rates: Record<string, number> } = await res.json();
    const r = data.rates || {};
    const priceOf = (sym: string, seed: number): number => {
      switch (sym) {
        case 'EURUSD': return r.EUR ? 1 / r.EUR : seed;
        case 'GBPUSD': return r.GBP ? 1 / r.GBP : seed;
        case 'AUDUSD': return r.AUD ? 1 / r.AUD : seed;
        case 'USDJPY': return r.JPY ?? seed;
        case 'USDCHF': return r.CHF ?? seed;
        case 'USDCAD': return r.CAD ?? seed;
        default: return seed;
      }
    };
    return FOREX.map((f) => {
      const price = priceOf(f.sym, f.seed);
      const change = simChange(price); // Frankfurter has no intraday delta — simulated
      return { symbol: f.sym, label: f.label, price, change, direction: dir(change) };
    });
  } catch {
    return null;
  }
}

export function useMarketPreview(): MarketPreview {
  const [state, setState] = useState<MarketPreview>({
    crypto: demoCrypto(),
    forex: demoForex(),
    metals: demoMetals(),
    cryptoMode: 'demo',
    forexMode: 'demo',
    metalsMode: 'demo',
    changeIsSimulated: { forex: true, metals: true },
    loading: true,
    error: null,
  });
  const prevPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      const [crypto, forex] = await Promise.all([
        fetchCrypto(controller.signal),
        fetchForex(controller.signal),
      ]);
      if (cancelled) return;

      // Derive tick direction from previous price where we have it (crypto).
      const withTickDir = (quotes: Quote[] | null, fallback: Quote[]): Quote[] => {
        const list = quotes ?? fallback;
        return list.map((q) => {
          const prev = prevPrices.current[q.symbol];
          prevPrices.current[q.symbol] = q.price;
          const direction: Direction =
            prev != null && q.price !== prev ? (q.price > prev ? 'up' : 'down') : q.direction;
          return { ...q, direction };
        });
      };

      setState((s) => ({
        ...s,
        crypto: withTickDir(crypto, s.crypto),
        forex: forex ?? s.forex,
        metals: demoMetals(),
        cryptoMode: crypto ? 'live' : 'demo',
        forexMode: forex ? 'live' : 'demo',
        metalsMode: 'demo',
        loading: false,
        error: crypto || forex ? null : 'Live market feed unavailable — showing demo data.',
      }));
    };

    load();
    const id = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
    };
  }, []);

  return state;
}
