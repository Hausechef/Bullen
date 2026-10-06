import React, { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTradingStore } from '../../stores/tradingStore';
import { useForexStore } from '../../stores/forexStore';
import { AssetIcon } from '../../components/common/AssetIcon';

const MarketRow = React.memo(({ symbol, handleTrade, t }: { symbol: string, handleTrade: (s:string)=>void, t: any }) => {
  const price = useTradingStore(s => s.prices[symbol]);
  const change = useTradingStore(s => s.priceChanges[symbol]);
  const spreadParams = useForexStore(s => s.pairs[symbol]?.spread);
  const spread = spreadParams != null ? spreadParams : null;

  const isPositive = change != null && change >= 0;
  const displaySym = symbol?.includes('USDT') ? symbol.replace('USDT', ' / USDT') : `${symbol?.substring(0,3)} / ${symbol?.substring(3)}`;

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <AssetIcon symbol={symbol} size={32} />
          <div>
            <p className="font-bold text-white group-hover:text-accent-primary transition-colors">{displaySym}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 font-mono text-slate-200">
        {price != null ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : '.'}
      </td>
      <td className="px-6 py-4">
        {change != null ? (
          <div className={`flex items-center gap-1 font-bold ${isPositive ? 'text-accent-secondary' : 'text-accent-quaternary'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </div>
        ) : '.'}
      </td>
      <td className="px-6 py-4 text-slate-500 text-sm font-mono">
        {spread != null ? spread.toFixed(4) : '.'}
      </td>
      <td className="px-6 py-4 text-right">
        <button 
          onClick={() => handleTrade(symbol)}
          className="px-4 py-1.5 bg-accent-primary/10 hover:bg-accent-primary text-accent-primary hover:text-black border border-accent-primary/20 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ml-auto"
        >
          {t('tradeAction')} <ExternalLink size={12} />
        </button>
      </td>
    </tr>
  );
});

export const Markets = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const categories = ['Crypto', 'Forex', 'Metals'];
  const initialSearch = searchParams.get('q') || '';
  const [activeCategory, setActiveCategory] = React.useState('Crypto');
  const [searchTerm, setSearchTerm] = React.useState(initialSearch);

  useEffect(() => {
    if (searchParams.has('q')) {
      const q = searchParams.get('q') || '';
      setSearchTerm(q);
      
      // Auto-switch category if exact match found
      if (q) {
        const upQ = q.toUpperCase();
        if (assets.Forex.some(s => s.includes(upQ))) setActiveCategory('Forex');
        else if (assets.Metals.some(s => s.includes(upQ))) setActiveCategory('Metals');
        else setActiveCategory('Crypto');
      }
    }
  }, [searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setSearchParams(val ? { q: val } : {});
  };

  const assets = useMemo(() => ({
    'Crypto': [
      'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT',
      'AVAXUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'TRXUSDT', 'TONUSDT', 'BCHUSDT'
    ],
    'Forex': [
      'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
      'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY', 'CHFJPY',
      'USDTRY', 'USDMXN', 'USDZAR'
    ],
    'Metals': ['XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD']
  }), []);

  const handleTrade = React.useCallback((symbol: string) => {
    navigate(`/trade/terminal?symbol=${symbol}`);
  }, [navigate]);

  const currentAssets = assets[activeCategory as keyof typeof assets].filter(sym => 
    sym.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('markets')}</h1>
            <p className="text-slate-400">{t('livePrices')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={t('search')} 
                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-all w-full sm:w-64"
              />
            </div>
            <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl w-fit">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeCategory === cat ? 'bg-accent-primary text-black shadow-neon-gold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="glass-card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5">
                <th className="px-6 py-4">{t('asset')}</th>
                <th className="px-6 py-4">{t('price')}</th>
                <th className="px-6 py-4">{t('change24h')}</th>
                <th className="px-6 py-4">{t('spread')}</th>
                <th className="px-6 py-4 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {currentAssets.map(symbol => (
                <MarketRow key={symbol} symbol={symbol} handleTrade={handleTrade} t={t} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
