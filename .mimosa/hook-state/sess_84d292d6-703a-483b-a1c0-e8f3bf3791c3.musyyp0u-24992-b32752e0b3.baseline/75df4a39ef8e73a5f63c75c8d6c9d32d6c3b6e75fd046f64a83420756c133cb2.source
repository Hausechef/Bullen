import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTradingStore } from '../stores/tradingStore';

export interface TradingState {
  currentPair: string; // e.g., 'BTCUSDT'
  currentTimeframe: string; // e.g., '1m', '1h', etc.
  orderSize: string;
  leverage: number;
  takeProfit: string;
  stopLoss: string;
  marginType: 'Cross' | 'Isolated';
  orderType: 'Market' | 'Limit' | 'Stop';
}

export interface TradingActions {
  setCurrentPair: (pair: string) => void;
  setCurrentTimeframe: (tf: string) => void;
  setOrderSize: (size: string) => void;
  setLeverage: (leverage: number) => void;
  setTakeProfit: (tp: string) => void;
  setStopLoss: (sl: string) => void;
  setMarginType: (type: 'Cross' | 'Isolated') => void;
  setOrderType: (type: 'Market' | 'Limit' | 'Stop') => void;
}

const defaultState: Omit<TradingState, 'currentPrice' | 'priceChange24h' | 'priceChangePercent24h'> = {
  currentPair: 'BTCUSDT',
  currentTimeframe: '1m',
  orderSize: '10',
  leverage: 20,
  takeProfit: '',
  stopLoss: '',
  marginType: 'Cross',
  orderType: 'Market',
};

const TradingContext = createContext<(TradingState & TradingActions) | null>(null);

export const TradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState(defaultState);

  const initPriceOverrideSync = useTradingStore(s => s.initPriceOverrideSync);

  useEffect(() => {
    const controller = new AbortController();
    let cleanup: (() => void) | undefined;
    void initPriceOverrideSync(controller.signal)
      .then((unsubscribe) => {
        if (controller.signal.aborted) unsubscribe();
        else cleanup = unsubscribe;
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error('Failed to initialize price override sync', error);
      });
    return () => {
      controller.abort();
      cleanup?.();
    };
  }, [initPriceOverrideSync]);

  const actions: TradingActions = {
    setCurrentPair: (pair) => setState(s => ({ ...s, currentPair: pair })),
    setCurrentTimeframe: (tf) => setState(s => ({ ...s, currentTimeframe: tf })),
    setOrderSize: (size) => setState(s => ({ ...s, orderSize: size })),
    setLeverage: (leverage) => setState(s => ({ ...s, leverage })),
    setTakeProfit: (tp) => setState(s => ({ ...s, takeProfit: tp })),
    setStopLoss: (sl) => setState(s => ({ ...s, stopLoss: sl })),
    setMarginType: (type) => setState(s => ({ ...s, marginType: type })),
    setOrderType: (type) => setState(s => ({ ...s, orderType: type })),
  };

  return (
    <TradingContext.Provider value={{ 
      ...state, 
      ...actions 
    }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error("useTradingContext must be used within a TradingProvider");
  }
  return context;
};
