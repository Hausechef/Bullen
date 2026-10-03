import { useEffect } from 'react';
import { useTradingStore } from '../stores/tradingStore';
import { useForexStore } from '../stores/forexStore';

// Major crypto pairs (Binance symbols)
const CRYPTO_PAIRS = [
  'btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'xrpusdt', 'adausdt', 'dogeusdt',
  'avaxusdt', 'dotusdt', 'linkusdt', 'ltcusdt', 'trxusdt', 'tonusdt', 'bchusdt',
  'shibusdt', 'pepeusdt', 'aptusdt', 'arbusdt', 'opusdt', 'suiusdt', 'nearusdt',
  'atomusdt', 'filusdt', 'icpusdt', 'uniusdt', 'etcusdt', 'injusdt', 'renderusdt',
  'seiusdt', 'fetusdt',
];

// ── Crypto: Binance REST fallback ────────────────────────────────────────────
const BINANCE_REST_URLS = [
  'https://api.binance.com/api/v3/ticker/24hr',
  'https://data-api.binance.vision/api/v3/ticker/24hr',
];

async function fetchCryptoPricesREST(): Promise<{ symbol: string; price: number; change: number }[]> {
  const symbolList = CRYPTO_PAIRS.map(p => `"${p.toUpperCase()}"`).join(',');
  for (const base of BINANCE_REST_URLS) {
    try {
      const res = await fetch(`${base}?symbols=[${symbolList}]`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const data: any[] = await res.json();
      return data.map(d => ({
        symbol: d.symbol,
        price: parseFloat(d.lastPrice),
        change: parseFloat(d.priceChangePercent),
      }));
    } catch { /* try next */ }
  }
  return [];
}

// ── Forex: Frankfurter API ───────────────────────────────────────────────────
// Derives major & cross rates from a single USD-base call.
async function fetchForexPricesREST(): Promise<{ symbol: string; price: number }[]> {
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?base=USD',
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const data: { base: string; rates: Record<string, number> } = await res.json();
    const r = data.rates; // r.EUR = units-of-EUR per 1 USD

    const results: { symbol: string; price: number }[] = [];

    // Helper: safe divide
    const q = (a: number | undefined, b: number | undefined) => (a && b && b !== 0) ? a / b : null;

    // USD pairs (direct from response)
    const direct: [string, number | undefined][] = [
      ['USDJPY', r['JPY']], ['USDCHF', r['CHF']], ['USDCAD', r['CAD']],
      ['USDMXN', r['MXN']], ['USDZAR', r['ZAR']], ['USDSEK', r['SEK']],
      ['USDNOK', r['NOK']], ['USDDKK', r['DKK']], ['USDPLN', r['PLN']],
      ['USDCNH', r['CNY']], ['USDTRY', r['TRY']],
    ];
    direct.forEach(([sym, val]) => { if (val) results.push({ symbol: sym, price: val }); });

    // Quoted-against-USD (inverse)
    const inverse: [string, string][] = [
      ['EURUSD', 'EUR'], ['GBPUSD', 'GBP'], ['AUDUSD', 'AUD'],
      ['NZDUSD', 'NZD'],
    ];
    inverse.forEach(([sym, cur]) => {
      const v = r[cur];
      if (v) results.push({ symbol: sym, price: 1 / v });
    });

    // Cross rates derived from USD pairs
    const EUR = r['EUR'], GBP = r['GBP'], AUD = r['AUD'], NZD = r['NZD'];
    const JPY = r['JPY'], CHF = r['CHF'], CAD = r['CAD'], SGD = r['SGD'];

    const crosses: [string, number | null][] = [
      ['EURGBP', q(GBP, EUR)],
      ['EURJPY', q(JPY, EUR)],
      ['EURCHF', q(CHF, EUR)],
      ['EURAUD', q(AUD, EUR)],
      ['EURCAD', q(CAD, EUR)],
      ['EURNZD', q(NZD, EUR)],
      ['EURTRY', q(r['TRY'], EUR)],
      ['EURSEK', q(r['SEK'], EUR)],
      ['EURNOK', q(r['NOK'], EUR)],
      ['GBPJPY', q(JPY, GBP)],
      ['GBPCHF', q(CHF, GBP)],
      ['GBPAUD', q(AUD, GBP)],
      ['GBPCAD', q(CAD, GBP)],
      ['GBPNZD', q(NZD, GBP)],
      ['GBPTRY', q(r['TRY'], GBP)],
      ['GBPZAR', q(r['ZAR'], GBP)],
      ['AUDJPY', q(JPY, AUD)],
      ['AUDCHF', q(CHF, AUD)],
      ['AUDCAD', q(CAD, AUD)],
      ['AUDNZD', q(NZD, AUD)],
      ['AUDSGD', q(SGD, AUD)],
      ['CADJPY', q(JPY, CAD)],
      ['CADCHF', q(CHF, CAD)],
      ['NZDJPY', q(JPY, NZD)],
      ['NZDCHF', q(CHF, NZD)],
      ['NZDCAD', q(CAD, NZD)],
      ['CHFJPY', q(JPY, CHF)],
      ['SGDJPY', q(JPY, SGD)],
    ];
    crosses.forEach(([sym, val]) => { if (val) results.push({ symbol: sym, price: val }); });

    return results;
  } catch {
    return [];
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useMarketEngine = () => {
  const { updatePrice } = useTradingStore();
  const { tickSimulation } = useForexStore();

  // ── Crypto: WebSocket + REST fallback ──────────────────────────────────────
  useEffect(() => {
    let ws: WebSocket | null = null;
    let wsAlive = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let destroyed = false;

    const stopRESTFallback = () => {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    };

    const startRESTFallback = () => {
      if (pollTimer) return;
        // Immediate fetch
        fetchCryptoPricesREST().then(prices => {
          if (destroyed) return;
          prices.forEach(p => {
            const fp = useForexStore.getState().pairs[p.symbol];
            if (fp && (fp.trend !== 'sideways' || fp.isPaused)) return;
            updatePrice(p.symbol, p.price, p.change);
          });
        });
        // Poll every 5 s while WS is down
        pollTimer = setInterval(async () => {
          if (wsAlive || destroyed) return;
          const prices = await fetchCryptoPricesREST();
          if (destroyed) return;
          prices.forEach(p => {
            const fp = useForexStore.getState().pairs[p.symbol];
            if (fp && (fp.trend !== 'sideways' || fp.isPaused)) return;
            updatePrice(p.symbol, p.price, p.change);
          });
        }, 5000);
    };

    const connectWS = () => {
      if (destroyed) return;
      const streamUrl = CRYPTO_PAIRS.map(p => `${p}@ticker`).join('/');
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streamUrl}`);

      ws.onopen = () => { wsAlive = true; stopRESTFallback(); };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (Array.isArray(payload)) {
            payload.forEach((item: any) => {
              const symbol = item.s.toUpperCase();
              
              // Block Binance if admin is manipulating this pair
              const fp = useForexStore.getState().pairs[symbol];
              if (fp && (fp.trend !== 'sideways' || fp.isPaused)) {
                return; // let forexStore simulation handle it
              }
              
              updatePrice(symbol, parseFloat(item.c), parseFloat(item.P));
            });
          } else if (payload.data) {
            const item = payload.data;
            const symbol = item.s.toUpperCase();
            
            const fp = useForexStore.getState().pairs[symbol];
            if (fp && (fp.trend !== 'sideways' || fp.isPaused)) {
              return;
            }
            
            updatePrice(symbol, parseFloat(item.c), parseFloat(item.P));
          }
        } catch { /* ignore */ }
      };

      ws.onerror = () => {
        wsAlive = false;
        startRESTFallback();
        console.warn('Binance WS Connection Error - Retrying soon...');
      };

      ws.onclose = () => {
        wsAlive = false;
        startRESTFallback();
        if (!destroyed) setTimeout(connectWS, 5000);
      };
    };

    connectWS();
    startRESTFallback(); // also fire immediately so prices are available before WS connects

    return () => {
      destroyed = true;
      wsAlive = false;
      stopRESTFallback();
      if (ws) ws.close();
    };
  }, [updatePrice]);

  // ── Forex + Metals: simulation tick + Frankfurter seed ────────────────────
  useEffect(() => {
    // Seed tradingStore immediately from forexStore (avoids 1 s blank price delay)
    const seedFromForex = () => {
      const pairs = useForexStore.getState().pairs;
      Object.values(pairs).forEach(fp => {
        updatePrice(fp.symbol, fp.price, fp.change24h);
      });
    };
    seedFromForex();

    // Fetch real rates — skip symbols that are pinned (admin override)
    fetchForexPricesREST().then(prices => {
      if (prices.length === 0) return;
      const { updatePrice: fxUpdate } = useForexStore.getState();
      const overrides = useTradingStore.getState().priceOverrides;
      prices.forEach(({ symbol, price }) => {
        if (overrides[symbol] !== undefined) return; // admin has fixed this price — don't touch it
        fxUpdate(symbol, price);
        updatePrice(symbol, price, 0);
      });
    });

    // 1 Hz simulation tick for all forex/metal pairs
    const interval = setInterval(() => {
      tickSimulation();

      const currentForexPairs = useForexStore.getState().pairs;
      Object.values(currentForexPairs).forEach(fp => {
        updatePrice(fp.symbol, fp.price, fp.change24h);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tickSimulation, updatePrice]);
};
