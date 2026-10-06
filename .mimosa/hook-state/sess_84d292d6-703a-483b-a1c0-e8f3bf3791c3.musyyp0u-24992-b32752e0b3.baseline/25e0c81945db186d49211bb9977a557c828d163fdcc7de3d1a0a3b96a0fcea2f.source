import { create } from 'zustand';

export type ForexTrend = 'bull' | 'bear' | 'sideways' | 'crash' | 'news';

export interface ForexPairConfig {
  symbol: string;
  price: number;
  basePrice: number;
  change24h: number;
  volatility: number;
  spread: number;
  trend: ForexTrend;
  isPaused: boolean;
}

// Realistic seed prices (approximate current market rates)
const SEED_PRICES: Record<string, number> = {
  // Majors
  EURUSD: 1.0850, GBPUSD: 1.2650, USDJPY: 149.50, USDCHF: 0.9050,
  AUDUSD: 0.6530, USDCAD: 1.3670, NZDUSD: 0.5970,
  // Minors EUR
  EURGBP: 0.8580, EURJPY: 162.30, EURCHF: 0.9820, EURAUD: 1.6620,
  EURCAD: 1.4830, EURNZD: 1.8190,
  // Minors GBP
  GBPJPY: 188.90, GBPCHF: 1.1450, GBPAUD: 1.9370, GBPCAD: 1.7290, GBPNZD: 2.1200,
  // Minors AUD
  AUDJPY: 97.60, AUDCHF: 0.5910, AUDCAD: 0.8940, AUDNZD: 1.0940,
  // Other crosses
  CADJPY: 109.50, CADCHF: 0.6630, NZDJPY: 89.40, NZDCHF: 0.5410,
  NZDCAD: 0.8170, CHFJPY: 165.30,
  // Exotics
  USDTRY: 32.50, USDMXN: 17.20, USDZAR: 18.80, USDSEK: 10.50,
  USDNOK: 10.80, USDDKK: 6.90, USDPLN: 3.97, USDCNH: 7.24,
  EURTRY: 35.20, EURSEK: 11.40, EURNOK: 11.72,
  GBPTRY: 41.20, GBPZAR: 23.80, AUDSGD: 0.8810, SGDJPY: 110.50,
  // Metals
  XAUUSD: 2340.00, XAGUSD: 27.80, XPTUSD: 960.00, XPDUSD: 1020.00,
};

// Volatility per symbol (pip/tick size for random walk)
const VOLATILITY: Record<string, number> = {
  USDJPY: 0.008, EURJPY: 0.010, GBPJPY: 0.012, AUDJPY: 0.008,
  CADJPY: 0.008, NZDJPY: 0.007, CHFJPY: 0.009, SGDJPY: 0.008,
  XAUUSD: 0.40, XAGUSD: 0.04, XPTUSD: 0.35, XPDUSD: 0.35,
  USDTRY: 0.015, USDMXN: 0.008, USDZAR: 0.012, USDSEK: 0.006,
  USDNOK: 0.006, USDDKK: 0.004, USDPLN: 0.004, USDCNH: 0.004,
  EURTRY: 0.018, EURSEK: 0.007, EURNOK: 0.007, GBPTRY: 0.022,
  GBPZAR: 0.015, AUDSGD: 0.0002,
};

const DEFAULT_VOLATILITY = 0.00008;
const DEFAULT_SPREAD = 0.00010;

const forexPairList = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'EURNZD',
  'GBPJPY', 'GBPCHF', 'GBPAUD', 'GBPCAD', 'GBPNZD',
  'AUDJPY', 'AUDCHF', 'AUDCAD', 'AUDNZD',
  'CADJPY', 'CADCHF', 'NZDJPY', 'NZDCHF', 'NZDCAD', 'CHFJPY',
  'USDTRY', 'USDMXN', 'USDZAR', 'USDSEK', 'USDNOK', 'USDDKK', 'USDPLN', 'USDCNH',
  'EURTRY', 'EURSEK', 'EURNOK', 'GBPTRY', 'GBPZAR', 'AUDSGD', 'SGDJPY',
  'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD',
];

const defaultPairs: Record<string, ForexPairConfig> = {};
forexPairList.forEach(symbol => {
  const price = SEED_PRICES[symbol] ?? 1.0;
  const volatility = VOLATILITY[symbol] ?? DEFAULT_VOLATILITY;

  let spread = DEFAULT_SPREAD;
  if (symbol.includes('JPY')) spread = volatility * 0.5;
  else if (symbol.startsWith('XA') || symbol.startsWith('XP')) spread = volatility * 0.3;
  else if (['USDTRY','USDMXN','USDZAR','USDSEK','USDNOK','EURTRY','GBPTRY'].includes(symbol)) spread = volatility * 0.5;

  defaultPairs[symbol] = {
    symbol,
    price,
    basePrice: price,
    change24h: 0,
    volatility,
    spread,
    trend: 'sideways',
    isPaused: false,
  };
});

interface ForexState {
  pairs: Record<string, ForexPairConfig>;
  globalVolatilityMultiplier: number;

  updatePrice: (symbol: string, newPrice: number) => void;
  /** Pin price: sets price + basePrice, resets change24h to 0, pauses simulation */
  pinPrice: (symbol: string, newPrice: number) => void;
  setVolatility: (symbol: string, vol: number) => void;
  setSpread: (symbol: string, spread: number) => void;
  setTrend: (symbol: string, trend: ForexTrend) => void;
  togglePause: (symbol: string) => void;
  setPaused: (symbol: string, isPaused: boolean) => void;
  resetMarket: (symbol: string) => void;
  tickSimulation: () => void;
}

const ensurePair = (state: ForexState, symbol: string): ForexPairConfig => {
  if (state.pairs[symbol]) return state.pairs[symbol];
  return {
    symbol,
    price: 1.0,
    basePrice: 1.0,
    change24h: 0,
    volatility: 0.0001,
    spread: 0.0001,
    trend: 'sideways',
    isPaused: false
  };
};

export const useForexStore = create<ForexState>((set, get) => ({
  pairs: defaultPairs,
  globalVolatilityMultiplier: 1.0,

  updatePrice: (symbol, newPrice) => set(state => ({
    pairs: { ...state.pairs, [symbol]: { ...ensurePair(state, symbol), price: newPrice } }
  })),

  pinPrice: (symbol, newPrice) => set(state => ({
    pairs: {
      ...state.pairs,
      [symbol]: {
        ...ensurePair(state, symbol),
        price: newPrice,
        basePrice: newPrice,
        change24h: 0,
        isPaused: true,
      },
    }
  })),

  setVolatility: (symbol, volatility) => set(state => ({
    pairs: { ...state.pairs, [symbol]: { ...ensurePair(state, symbol), volatility } }
  })),

  setSpread: (symbol, spread) => set(state => ({
    pairs: { ...state.pairs, [symbol]: { ...ensurePair(state, symbol), spread } }
  })),

  setTrend: (symbol, trend) => set(state => ({
    pairs: { ...state.pairs, [symbol]: { ...ensurePair(state, symbol), trend } }
  })),

  togglePause: (symbol) => set(state => {
    const p = ensurePair(state, symbol);
    return {
      pairs: { ...state.pairs, [symbol]: { ...p, isPaused: !p.isPaused } }
    };
  }),

  setPaused: (symbol, isPaused) => set(state => ({
    pairs: { ...state.pairs, [symbol]: { ...ensurePair(state, symbol), isPaused } }
  })),

  resetMarket: (symbol) => set(state => ({
    pairs: { ...state.pairs, [symbol]: { ...defaultPairs[symbol] } }
  })),

  tickSimulation: () => set(state => {
    const newPairs = { ...state.pairs };
    let changed = false;

    Object.keys(newPairs).forEach(sym => {
      const p = newPairs[sym];
      if (p.isPaused) return;

      let move = (Math.random() - 0.5) * p.volatility * state.globalVolatilityMultiplier;

      if (p.trend === 'bull') {
        move += Math.random() * p.volatility * 5.0;
      } else if (p.trend === 'bear') {
        move -= Math.random() * p.volatility * 5.0;
      } else if (p.trend === 'crash') {
        move -= Math.random() * p.volatility * 20.0;
      } else if (p.trend === 'news') {
        move += (Math.random() - 0.5) * p.volatility * 30.0;
      }

      const newPrice = Math.max(p.price * 0.001, p.price + move);
      const change24h = ((newPrice - p.basePrice) / p.basePrice) * 100;

      if (newPrice !== p.price) {
        newPairs[sym] = { ...p, price: newPrice, change24h };
        changed = true;
      }
    });

    return changed ? { pairs: newPairs } : state;
  }),
}));
