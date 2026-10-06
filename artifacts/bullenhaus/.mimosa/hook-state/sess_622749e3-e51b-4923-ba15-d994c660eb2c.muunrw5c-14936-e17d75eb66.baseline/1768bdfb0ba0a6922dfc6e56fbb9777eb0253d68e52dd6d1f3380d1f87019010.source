import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TradingProvider, useTradingContext } from '../../contexts/TradingContext';
import { TradingChart } from '../../components/dashboard/TradingChart';
import { AdvancedOrderPanel as OrderPanel } from '../../components/dashboard/AdvancedOrderPanel';
import { PositionsAndOrdersPanel } from '../../components/dashboard/PositionsAndOrdersPanel';
import { useTradingStore } from '../../stores/tradingStore';
import { useWalletSync } from '../../hooks/useWalletSync';
import { motion } from 'motion/react';

const TradeContent = () => {
  const [searchParams] = useSearchParams();
  const { setCurrentPair, currentPair } = useTradingContext();
  const prices = useTradingStore(s => s.prices);

  useWalletSync();

  useEffect(() => {
    const sym = searchParams.get('symbol');
    if (sym && sym !== currentPair) {
      setCurrentPair(sym);
    }
  }, [searchParams, setCurrentPair, currentPair]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col gap-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart Area */}
        <div className="lg:col-span-8 xl:col-span-9 h-[520px] sm:h-[560px] lg:h-[620px] glass-card overflow-hidden relative order-1">
           <TradingChart />
        </div>

        {/* Order Panel */}
        <div className="lg:col-span-4 xl:col-span-3 lg:row-span-2 order-2">
           <OrderPanel />
        </div>

        {/* Positions & Orders */}
        <div className="lg:col-span-8 xl:col-span-9 order-3">
            <PositionsAndOrdersPanel />
        </div>

      </div>
    </div>
  );
};

export const Trade = () => {
  return (
    <TradingProvider>
      <TradeContent />
    </TradingProvider>
  );
};
