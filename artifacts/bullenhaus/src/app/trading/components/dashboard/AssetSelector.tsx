import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTradingContext } from '../../contexts/TradingContext';
import { Search, Star, ChevronDown, Check, Flame, TrendingUp, TrendingDown, Bitcoin } from 'lucide-react';
import { useTradingStore } from '../../stores/tradingStore';
import { AssetIcon } from '../common/AssetIcon';

const CATEGORIES = ['Crypto', 'Forex', 'Metals'];
export const ASSETS = {
  Crypto: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT'],
  Forex: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURJPY', 'GBPJPY'],
  Metals: ['XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD']
};

const formatPair = (pair: string) => {
  if (pair.endsWith('USDT')) return pair.replace('USDT', ' / USDT');
  if (pair.endsWith('USD')) return pair.replace('USD', ' / USD');
  if (pair.length === 6) return pair.slice(0, 3) + ' / ' + pair.slice(3);
  return pair;
};

export const AssetSelector: React.FC = () => {
  const { currentPair, setCurrentPair } = useTradingContext();
  const prices = useTradingStore(s => s.prices);
  const priceChanges = useTradingStore(s => s.priceChanges);
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Crypto');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load from local storage
  useEffect(() => {
    const savedFavs = localStorage.getItem('ab_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    
    const savedRecents = localStorage.getItem('ab_recent');
    if (savedRecents) setRecent(JSON.parse(savedRecents));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (symbol: string) => {
    setCurrentPair(symbol);
    setIsOpen(false);
    
    // Add to recent
    const newRecent = [symbol, ...recent.filter(r => r !== symbol)].slice(0, 5);
    setRecent(newRecent);
    localStorage.setItem('ab_recent', JSON.stringify(newRecent));
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('symbol', symbol);
    window.history.replaceState({}, '', url);
  };

  const toggleFav = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    const newFavs = favorites.includes(symbol) 
      ? favorites.filter(f => f !== symbol)
      : [...favorites, symbol];
    setFavorites(newFavs);
    localStorage.setItem('ab_favorites', JSON.stringify(newFavs));
  };

  const allAssets = Object.values(ASSETS).flat();
  
  const filteredAssets = search.trim() 
    ? allAssets.filter(a => a.toLowerCase().includes(search.toLowerCase()))
    : activeCategory === 'Favorites'
      ? favorites
      : ASSETS[activeCategory as keyof typeof ASSETS] || [];

  const currentPrice = prices[currentPair];
  const currentChange = priceChanges[currentPair];
  const isPositive = currentChange != null && currentChange >= 0;

  return (
    <div className="relative z-50 h-full flex items-center" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 h-full border-r border-white/5 hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white group-hover:text-accent-primary transition-colors">
                {formatPair(currentPair)}
            </span>
            <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180 text-accent-primary' : ''}`} />
        </div>
        <div className="hidden md:flex flex-col items-end opacity-80">
            <span className="text-xs font-mono font-bold text-white">{currentPrice != null ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : '.'}</span>
            <span className={`text-[9px] font-bold flex items-center gap-0.5 ${isPositive ? 'text-accent-secondary' : currentChange != null ? 'text-accent-quaternary' : 'text-slate-500'}`}>
                {currentChange != null ? (isPositive ? <TrendingUp size={8}/> : <TrendingDown size={8}/>) : null}
                {currentChange != null ? (isPositive ? '+' : '') + currentChange.toFixed(2) + '%' : '.'}
            </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 lg:w-[400px] max-w-[400px] bg-surface-bg/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden shadow-black/50"
          >
            {/* Search */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search assets..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/5 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-accent-primary/50 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Categories */}
            {!search.trim() && (
              <div className="flex overflow-x-auto custom-scrollbar border-b border-white/5 px-2">
                <button
                  onClick={() => setActiveCategory('Favorites')}
                  className={`px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap border-b-2 flex items-center gap-1 ${activeCategory === 'Favorites' ? 'border-accent-primary text-accent-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                  <Star size={12} className={activeCategory === 'Favorites' ? 'fill-accent-primary text-accent-primary' : ''} /> Favs
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap border-b-2 ${activeCategory === cat ? 'border-accent-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Recent (Only when not searching) */}
            {!search.trim() && recent.length > 0 && activeCategory !== 'Favorites' && (
               <div className="px-3 py-2 border-b border-white/5 flex gap-2 overflow-x-auto custom-scrollbar">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest shrink-0 self-center border-r border-white/10 pr-2 mr-1">Recent</span>
                  {recent.map(r => (
                     <button key={r} onClick={() => handleSelect(r)} className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] font-bold text-slate-300 font-mono transition-colors shrink-0">
                        {formatPair(r)}
                     </button>
                  ))}
               </div>
            )}

            {/* List */}
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
              {filteredAssets.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No assets found</div>
              ) : (
                filteredAssets.map(symbol => {
                  const p = prices[symbol];
                  const c = priceChanges[symbol];
                  const isPos = c != null && c >= 0;
                  const isFav = favorites.includes(symbol);

                  return (
                    <button 
                      key={symbol}
                      onClick={() => handleSelect(symbol)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors group ${currentPair === symbol ? 'bg-accent-primary/10 border border-accent-primary/20' : 'hover:bg-white/5 border border-transparent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div onClick={(e) => toggleFav(e, symbol)} className={`cursor-pointer transition-colors ${isFav ? 'text-accent-primary' : 'text-slate-600 hover:text-slate-400'}`}>
                           <Star size={14} className={isFav ? 'fill-accent-primary' : ''} />
                        </div>
                        <AssetIcon symbol={symbol} size={24} />
                        <div className="text-left">
                          <div className={`text-sm font-bold font-mono ${currentPair === symbol ? 'text-accent-primary' : 'text-white group-hover:text-white'}`}>
                            {formatPair(symbol)}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Perpetual</div>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-mono font-bold text-white">{p != null ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : '.'}</div>
                         <div className={`text-[10px] font-bold font-mono ${isPos ? 'text-accent-secondary' : c != null ? 'text-accent-quaternary' : 'text-slate-500'}`}>
                           {c != null ? (isPos ? '+' : '') + c.toFixed(2) + '%' : '.'}
                         </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
