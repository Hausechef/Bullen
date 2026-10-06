import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useForexStore, ForexTrend } from './forexStore';

export type PositionType = 'Long' | 'Short';
export type OrderType = 'Market' | 'Limit' | 'Stop';
export type MarginType = 'Cross' | 'Isolated';

export interface Position {
  id: string;
  symbol: string;
  type: PositionType;
  entryPrice: number;
  size: number; // in base currency or quote? Let's say base crypto.
  leverage: number;
  marginType: MarginType;
  margin: number;
  liquidationPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  unrealizedPnL: number;
  status: 'open' | 'closed';
  createdAt?: string;
  closedAt?: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  buyPrice: number;
  currentPrice: number;
  createdAt: string;
}

export interface Order {
  id: string;
  symbol: string;
  type: OrderType;
  positionType: PositionType;
  price: number; // target price for limit/stop
  size: number;
  leverage: number;
  marginType: MarginType;
  stopLoss: number | null;
  takeProfit: number | null;
  status: 'pending' | 'filled' | 'canceled';
}

export interface Wallet {
  balance: number; // in USD
  realizedPnL: number;
  marginUsed: number;
}

interface TradingState {
  wallet: Wallet;
  positions: Position[];
  orders: Order[];
  assets: Asset[];
  prices: Record<string, number>;
  priceChanges: Record<string, number>;
  priceOverrides: Record<string, number>;
  contractSigned: boolean;
  contractPriceSnapshot: number | null;

  // Actions
  checkContractSignature: () => Promise<void>;
  initPriceOverrideSync: (signal: AbortSignal) => Promise<() => void>;
  setPositions: (positions: Position[]) => void;
  setOrders: (orders: Order[]) => void;
  setPriceOverride: (symbol: string, price: number | null) => void;
  setWallet: (wallet: Partial<Wallet>) => void;
  updatePrice: (symbol: string, price: number, change24h: number) => void;
  openPosition: (pos: Omit<Position, 'id' | 'unrealizedPnL' | 'status'>) => boolean;
  closePosition: (id: string, closePrice: number) => void;
  updatePositionPnL: (symbol: string, currentPrice: number) => void;
  placeOrder: (order: Omit<Order, 'id' | 'status'>) => boolean;
  cancelOrder: (id: string) => void;
  checkOrders: () => void; // checks limit/stop orders against current prices
  addBalance: (amount: number) => void;
  setWalletBalance: (amount: number) => void;
  buyAsset: (symbol: string, name: string, price: number, amount: number) => Promise<boolean>;
  setAssets: (assets: Asset[]) => void;
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      wallet: {
        balance: 0, // starting balance
        realizedPnL: 0,
        marginUsed: 0,
      },
      positions: [],
      orders: [],
      assets: [],
      prices: {},
      priceChanges: {},
      priceOverrides: {},
      contractSigned: false,
      contractPriceSnapshot: null,

      checkContractSignature: async () => {
        try {
          const { data, error } = await supabase
            .from('premarket_contract_signatures')
            .select('id, price_snapshot')
            .eq('contract_version', 'v1.0');
          if (!error && data && data.length > 0) {
            const snapshot = data[0].price_snapshot != null ? Number(data[0].price_snapshot) : null;
            set({ contractSigned: true, contractPriceSnapshot: snapshot });
          }
        } catch (err) {
          console.error('Failed to check contract signature', err);
        }
      },

      initPriceOverrideSync: async (signal) => {
        // Fetch all existing admin price overrides and apply them locally
        try {
          const { data } = await supabase.from('price_overrides').select('symbol, price').abortSignal(signal);
          if (signal.aborted) return () => {};
          if (data && data.length > 0) {
            const overrides: Record<string, number> = {};
            const { setTrend, setVolatility, setSpread, setPaused } = useForexStore.getState();

            const initCryptoPair = (sym: string) => {
              const currentForex = useForexStore.getState().pairs[sym];
              if (!currentForex) {
                const p = get().prices[sym] || 1.0;
                useForexStore.setState(s => ({
                  pairs: { ...s.pairs, [sym]: { symbol: sym, price: p, basePrice: p, change24h: 0, volatility: p * 0.0001, spread: p * 0.0001, trend: 'sideways' as any, isPaused: false } }
                }));
              }
            };

            data.forEach((row: { symbol: string; price: number }) => {
              const name = row.symbol;
              const val = Number(row.price);

              if (name.endsWith('_trend')) {
                const sym = name.replace('_trend', '');
                initCryptoPair(sym);
                const trend = val === 1 ? 'bull' : val === 2 ? 'bear' : val === 3 ? 'sideways' : val === 4 ? 'crash' : 'news';
                setTrend(sym, trend as ForexTrend);
              } else if (name.endsWith('_volatility')) {
                const sym = name.replace('_volatility', '');
                initCryptoPair(sym);
                setVolatility(sym, val);
              } else if (name.endsWith('_spread')) {
                const sym = name.replace('_spread', '');
                initCryptoPair(sym);
                setSpread(sym, val);
              } else if (name.endsWith('_isPaused')) {
                const sym = name.replace('_isPaused', '');
                initCryptoPair(sym);
                setPaused(sym, val === 1);
              } else {
                overrides[name] = val;
                initCryptoPair(name);
                useForexStore.getState().pinPrice(name, val);
              }
            });
            set({ priceOverrides: overrides });
          }
        } catch {
          // table may not exist yet — silently skip
        }

        // An unmounted provider must not create a channel after its fetch finishes.
        if (signal.aborted) return () => {};

        // Each provider owns its channel, including overlapping mounts during cleanup.
        const channel = supabase
          .channel(`price-overrides-sync-${crypto.randomUUID()}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'price_overrides' }, (payload) => {
            const row = payload.new as { symbol: string; price: number };
            const name = row.symbol;
            const val = Number(row.price);

            const { setTrend, setVolatility, setSpread, setPaused } = useForexStore.getState();

            const initCryptoPair = (sym: string) => {
              const currentForex = useForexStore.getState().pairs[sym];
              if (!currentForex) {
                const p = get().prices[sym] || 1.0;
                useForexStore.setState(s => ({
                  pairs: { ...s.pairs, [sym]: { symbol: sym, price: p, basePrice: p, change24h: 0, volatility: p * 0.0001, spread: p * 0.0001, trend: 'sideways' as any, isPaused: false } }
                }));
              }
            };

            if (name.endsWith('_trend')) {
              const sym = name.replace('_trend', '');
              initCryptoPair(sym);
              const trend = val === 1 ? 'bull' : val === 2 ? 'bear' : val === 3 ? 'sideways' : val === 4 ? 'crash' : 'news';
              setTrend(sym, trend as any);
            } else if (name.endsWith('_volatility')) {
              const sym = name.replace('_volatility', '');
              initCryptoPair(sym);
              setVolatility(sym, val);
            } else if (name.endsWith('_spread')) {
              const sym = name.replace('_spread', '');
              initCryptoPair(sym);
              setSpread(sym, val);
            } else if (name.endsWith('_isPaused')) {
              const sym = name.replace('_isPaused', '');
              initCryptoPair(sym);
              setPaused(sym, val === 1);
            } else {
              initCryptoPair(name);
              useForexStore.getState().pinPrice(name, val);
              get().setPriceOverride(name, val);
            }
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'price_overrides' }, (payload) => {
            const row = payload.new as { symbol: string; price: number };
            const name = row.symbol;
            const val = Number(row.price);

            const { setTrend, setVolatility, setSpread, setPaused } = useForexStore.getState();

            const initCryptoPair = (sym: string) => {
              const currentForex = useForexStore.getState().pairs[sym];
              if (!currentForex) {
                const p = get().prices[sym] || 1.0;
                useForexStore.setState(s => ({
                  pairs: { ...s.pairs, [sym]: { symbol: sym, price: p, basePrice: p, change24h: 0, volatility: p * 0.0001, spread: p * 0.0001, trend: 'sideways' as any, isPaused: false } }
                }));
              }
            };

            if (name.endsWith('_trend')) {
              const sym = name.replace('_trend', '');
              initCryptoPair(sym);
              const trend = val === 1 ? 'bull' : val === 2 ? 'bear' : val === 3 ? 'sideways' : val === 4 ? 'crash' : 'news';
              setTrend(sym, trend as any);
            } else if (name.endsWith('_volatility')) {
              const sym = name.replace('_volatility', '');
              initCryptoPair(sym);
              setVolatility(sym, val);
            } else if (name.endsWith('_spread')) {
              const sym = name.replace('_spread', '');
              initCryptoPair(sym);
              setSpread(sym, val);
            } else if (name.endsWith('_isPaused')) {
              const sym = name.replace('_isPaused', '');
              initCryptoPair(sym);
              setPaused(sym, val === 1);
            } else {
              initCryptoPair(name);
              useForexStore.getState().pinPrice(name, val);
              get().setPriceOverride(name, val);
            }
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'price_overrides' }, (payload) => {
            const row = payload.old as { symbol?: string };
            const name = row?.symbol;
            if (!name) return;

            const { resetMarket } = useForexStore.getState();

            if (name.endsWith('_trend')) {
              const sym = name.replace('_trend', '');
              useForexStore.setState(state => ({
                pairs: { ...state.pairs, [sym]: { ...state.pairs[sym], trend: 'sideways' } }
              }));
            } else if (name.endsWith('_volatility')) {
              const sym = name.replace('_volatility', '');
              resetMarket(sym);
            } else if (name.endsWith('_spread')) {
              const sym = name.replace('_spread', '');
              resetMarket(sym);
            } else if (name.endsWith('_isPaused')) {
              const sym = name.replace('_isPaused', '');
              useForexStore.getState().setPaused(sym, false);
            } else {
              get().setPriceOverride(name, null);
              const fp = useForexStore.getState().pairs[name];
              if (fp) {
                useForexStore.getState().setPaused(name, false);
                get().updatePrice(name, fp.price, fp.change24h);
              }
            }
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      },

      setPositions: (positions) => set({ positions }),
      setOrders: (orders) => set({ orders }),

      setWallet: (wallet) => {
        set((state) => ({
          wallet: {
            ...state.wallet,
            ...wallet,
          },
        }));
      },

      setPriceOverride: (symbol, price) => {
        set((state) => {
          const overrides = { ...state.priceOverrides };
          if (price === null) {
            delete overrides[symbol];
          } else {
            overrides[symbol] = price;
          }
          return { priceOverrides: overrides };
        });
      },

      updatePrice: (symbol, price, change) => {
        set((state) => {
          const actualPrice = state.priceOverrides[symbol] !== undefined ? state.priceOverrides[symbol] : price;
          const newPrices = { ...state.prices, [symbol]: actualPrice };
          const newChanges = { ...state.priceChanges, [symbol]: change };
          
          return { prices: newPrices, priceChanges: newChanges };
        });
        // Triggers side effects like PnL update or liqudation checks
        const finalPrice = get().prices[symbol];
        get().updatePositionPnL(symbol, finalPrice);
        get().checkOrders();
      },

      openPosition: (posData) => {
        const state = get();
        if (state.wallet.balance - state.wallet.marginUsed < posData.margin) {
          return false;
        }

        const newId = crypto.randomUUID();

        set((state) => {
          const newPos: Position = {
            ...posData,
            id: newId,
            unrealizedPnL: 0,
            status: 'open',
          };
          
          return {
            positions: [...state.positions, newPos],
            wallet: {
              ...state.wallet,
              marginUsed: state.wallet.marginUsed + posData.margin,
            }
          };
        });

        // Background database sync
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Insert position record
            const { error: posErr } = await supabase.from('positions').insert({
              id: newId,
              user_id: user.id,
              symbol: posData.symbol,
              type: posData.type,
              entry_price: posData.entryPrice,
              size: posData.size,
              leverage: posData.leverage,
              margin_type: posData.marginType,
              margin: posData.margin,
              liquidation_price: posData.liquidationPrice,
              stop_loss: posData.stopLoss,
              take_profit: posData.takeProfit,
              status: 'open',
            });
            if (posErr) throw posErr;

            // 2. Log trade transaction
            const { error: txErr } = await supabase.from('transactions').insert({
              user_id: user.id,
              user_email: user.email,
              user_name: user.user_metadata?.full_name || user.email,
              type: 'Trade',
              amount: posData.margin,
              currency: 'USD',
              method: 'Other',
              status: 'Completed',
              instructions: `Opened ${posData.type} position: ${posData.size} ${posData.symbol} at $${posData.entryPrice.toLocaleString()}`,
            });
            if (txErr) throw txErr;

            // 3. Update balance and margin in user profile
            const currentWallet = get().wallet;
            const { error: userErr } = await supabase.from('users').update({
              balance: currentWallet.balance,
              margin_used: currentWallet.marginUsed,
            }).eq('id', user.id);
            if (userErr) throw userErr;
          } catch (err) {
            console.error('[openPosition] Failed to persist to Supabase:', err);
          }
        })();

        return true;
      },

      closePosition: (id, closePrice) => {
        const pos = get().positions.find(p => p.id === id);
        if (!pos || pos.status === 'closed') return;

        const pnl = pos.type === 'Long' 
          ? (closePrice - pos.entryPrice) * pos.size
          : (pos.entryPrice - closePrice) * pos.size;

        set((state) => ({
          positions: state.positions.map(p => 
            p.id === id ? { ...p, status: 'closed', unrealizedPnL: pnl } : p
          ),
          wallet: {
            ...state.wallet,
            balance: Math.max(0, state.wallet.balance + pnl),
            realizedPnL: state.wallet.realizedPnL + pnl,
            marginUsed: state.wallet.marginUsed - pos.margin,
          }
        }));

        // Background database sync
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Update position status to closed
            const { error: posErr } = await supabase.from('positions').update({
              status: 'closed',
              unrealized_pnl: pnl,
            }).eq('id', id);
            if (posErr) throw posErr;

            // 2. Log close trade transaction
            const { error: txErr } = await supabase.from('transactions').insert({
              user_id: user.id,
              user_email: user.email,
              user_name: user.user_metadata?.full_name || user.email,
              type: 'Trade',
              amount: Math.max(0.01, Math.abs(pnl)),
              currency: 'USD',
              method: 'Other',
              status: 'Completed',
              instructions: `Closed ${pos.type} position on ${pos.symbol} at $${closePrice.toLocaleString()}. P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString()}`,
            });
            if (txErr) throw txErr;

            // 3. Update user balance
            const currentWallet = get().wallet;
            const { error: userErr } = await supabase.from('users').update({
              balance: currentWallet.balance,
              margin_used: currentWallet.marginUsed,
              realized_pnl: currentWallet.realizedPnL,
            }).eq('id', user.id);
            if (userErr) throw userErr;
          } catch (err) {
            console.error('[closePosition] Failed to persist to Supabase:', err);
          }
        })();
      },

      updatePositionPnL: (symbol, currentPrice) => {
        const closedJobs: { pos: Position; pnl: number; reason: string }[] = [];

        set((state) => {
          let marginFreed = 0;
          let balanceChange = 0;
          let realizedPnLChange = 0;

          const updatedPositions = state.positions.map(pos => {
            if (pos.symbol !== symbol || pos.status !== 'open') return pos;

            const pnl = pos.type === 'Long' 
              ? (currentPrice - pos.entryPrice) * pos.size
              : (pos.entryPrice - currentPrice) * pos.size;

            let isLiquidated = false;
            let reason = 'Liquidation';

            // Liquidation check
            if (pos.type === 'Long' && currentPrice <= pos.liquidationPrice) isLiquidated = true;
            if (pos.type === 'Short' && currentPrice >= pos.liquidationPrice) isLiquidated = true;

            // SL / TP check
            if (pos.stopLoss && pos.type === 'Long' && currentPrice <= pos.stopLoss) {
              isLiquidated = true;
              reason = 'Stop Loss';
            }
            if (pos.stopLoss && pos.type === 'Short' && currentPrice >= pos.stopLoss) {
              isLiquidated = true;
              reason = 'Stop Loss';
            }
            if (pos.takeProfit && pos.type === 'Long' && currentPrice >= pos.takeProfit) {
              isLiquidated = true;
              reason = 'Take Profit';
            }
            if (pos.takeProfit && pos.type === 'Short' && currentPrice <= pos.takeProfit) {
              isLiquidated = true;
              reason = 'Take Profit';
            }

            if (isLiquidated) {
               marginFreed += pos.margin;
               balanceChange += pnl;
               realizedPnLChange += pnl;
               
               const closedPos = { ...pos, unrealizedPnL: pnl, status: 'closed' as const };
               closedJobs.push({ pos: closedPos, pnl, reason });
               return closedPos;
            }

            return { ...pos, unrealizedPnL: pnl };
          });

          if (marginFreed > 0 || balanceChange !== 0) {
            return {
              positions: updatedPositions,
              wallet: {
                ...state.wallet,
                balance: Math.max(0, state.wallet.balance + balanceChange),
                realizedPnL: state.wallet.realizedPnL + realizedPnLChange,
                marginUsed: state.wallet.marginUsed - marginFreed,
              }
            }
          }

          return { positions: updatedPositions };
        });

        // Trigger background db updates for each closed position (SL/TP/Liq)
        if (closedJobs.length > 0) {
          (async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              for (const job of closedJobs) {
                // 1. Update position status to closed
                const { error: posErr } = await supabase.from('positions').update({
                  status: 'closed',
                  unrealized_pnl: job.pnl,
                }).eq('id', job.pos.id);
                if (posErr) throw posErr;

                // 2. Log close trade transaction
                const { error: txErr } = await supabase.from('transactions').insert({
                  user_id: user.id,
                  user_email: user.email,
                  user_name: user.user_metadata?.full_name || user.email,
                  type: 'Trade',
                  amount: Math.max(0.01, Math.abs(job.pnl)),
                  currency: 'USD',
                  method: 'Other',
                  status: 'Completed',
                  instructions: `Closed ${job.pos.type} position on ${job.pos.symbol} at $${currentPrice.toLocaleString()} via ${job.reason}. P&L: ${job.pnl >= 0 ? '+' : ''}$${job.pnl.toLocaleString()}`,
                });
                if (txErr) throw txErr;
              }

              // 3. Update user balance
              const currentWallet = get().wallet;
              const { error: userErr } = await supabase.from('users').update({
                balance: currentWallet.balance,
                margin_used: currentWallet.marginUsed,
                realized_pnl: currentWallet.realizedPnL,
              }).eq('id', user.id);
              if (userErr) throw userErr;
            } catch (err) {
              console.error('[updatePositionPnL] Failed to persist closed positions to Supabase:', err);
            }
          })();
        }
      },

      placeOrder: (orderData) => {
        const state = get();
        // Reserve margin at the order's execution price (not current market) so the
        // reserved amount matches the position margin booked at fill and released at close.
        const marginRequired = (orderData.size * orderData.price) / orderData.leverage;
        if (state.wallet.balance - state.wallet.marginUsed < marginRequired) {
          return false;
        }

        const newId = crypto.randomUUID();

        set((state) => ({
          orders: [...state.orders, { ...orderData, id: newId, status: 'pending' }],
          wallet: {
            ...state.wallet,
            marginUsed: state.wallet.marginUsed + marginRequired,
          },
        }));

        // Background database sync
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error: ordErr } = await supabase.from('orders').insert({
              id: newId,
              user_id: user.id,
              symbol: orderData.symbol,
              type: orderData.type,
              position_type: orderData.positionType,
              price: orderData.price,
              size: orderData.size,
              leverage: orderData.leverage,
              margin_type: orderData.marginType,
              stop_loss: orderData.stopLoss,
              take_profit: orderData.takeProfit,
              status: 'pending',
            });
            if (ordErr) throw ordErr;
          } catch (err) {
            console.error('[placeOrder] Failed to persist to Supabase:', err);
          }
        })();

        return true;
      },

      cancelOrder: (id) => {
        const order = get().orders.find(o => o.id === id);
        const marginToReturn = (order && order.status === 'pending')
          ? (order.size * order.price) / order.leverage
          : 0;
        set((state) => ({
          orders: state.orders.map(o => o.id === id ? { ...o, status: 'canceled' } : o),
          ...(marginToReturn > 0 ? {
            wallet: {
              ...state.wallet,
              marginUsed: Math.max(0, state.wallet.marginUsed - marginToReturn),
            },
          } : {}),
        }));

        // Background database sync
        (async () => {
          try {
            const { error: ordErr } = await supabase.from('orders').update({
              status: 'canceled',
            }).eq('id', id);
            if (ordErr) throw ordErr;
          } catch (err) {
            console.error('[cancelOrder] Failed to update cancel status in Supabase:', err);
          }
        })();
      },

      checkOrders: () => {
        const filledJobs: { order: Order; newPos: Position }[] = [];

        set((state) => {
          let changed = false;
          const newOrders = [...state.orders];
          const newPositions = [...state.positions];

          for (let i = 0; i < newOrders.length; i++) {
            const order = newOrders[i];
            if (order.status !== 'pending') continue;

            const currentPrice = state.prices[order.symbol];
            if (!currentPrice) continue;

            let shouldExecute = false;
            if (order.type === 'Limit') {
              if (order.positionType === 'Long' && currentPrice <= order.price) shouldExecute = true;
              if (order.positionType === 'Short' && currentPrice >= order.price) shouldExecute = true;
            } else if (order.type === 'Stop') {
              if (order.positionType === 'Long' && currentPrice >= order.price) shouldExecute = true;
              if (order.positionType === 'Short' && currentPrice <= order.price) shouldExecute = true;
            }

            if (shouldExecute) {
              // Margin was already reserved in placeOrder at order.price; convert that
              // reservation into a position so marginUsed stays balanced on close.
              const margin = (order.size * order.price) / order.leverage;
              order.status = 'filled';
              changed = true;

              const isLong = order.positionType === 'Long';
              const liqPrice = isLong
                ? order.price * (1 - 1/order.leverage + 0.005) // maintenance margin simplified
                : order.price * (1 + 1/order.leverage - 0.005);

              const newPos: Position = {
                id: crypto.randomUUID(),
                symbol: order.symbol,
                type: order.positionType,
                entryPrice: order.price, // executed at order price for logic
                size: order.size,
                leverage: order.leverage,
                marginType: order.marginType,
                margin,
                liquidationPrice: liqPrice,
                stopLoss: order.stopLoss,
                takeProfit: order.takeProfit,
                unrealizedPnL: 0,
                status: 'open'
              };

              newPositions.push(newPos);
              filledJobs.push({ order, newPos });
            }
          }

          if (changed) {
            return { orders: newOrders, positions: newPositions };
          }
          return state;
        });

        // Notify user for each filled order
        filledJobs.forEach(job => {
          toast.success(
            `✅ ${job.order.type} order filled: ${job.order.positionType} ${job.order.symbol} at $${job.order.price.toLocaleString()}`,
            { duration: 6000 }
          );
        });

        // Trigger background db updates for each filled order
        if (filledJobs.length > 0) {
          (async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              for (const job of filledJobs) {
                // 1. Update order status to filled
                const { error: ordErr } = await supabase.from('orders').update({
                  status: 'filled',
                }).eq('id', job.order.id);
                if (ordErr) throw ordErr;

                // 2. Insert position record
                const { error: posErr } = await supabase.from('positions').insert({
                  id: job.newPos.id,
                  user_id: user.id,
                  symbol: job.newPos.symbol,
                  type: job.newPos.type,
                  entry_price: job.newPos.entryPrice,
                  size: job.newPos.size,
                  leverage: job.newPos.leverage,
                  margin_type: job.newPos.marginType,
                  margin: job.newPos.margin,
                  liquidation_price: job.newPos.liquidationPrice,
                  stop_loss: job.newPos.stopLoss,
                  take_profit: job.newPos.takeProfit,
                  status: 'open',
                });
                if (posErr) throw posErr;

                // 3. Log filled trade transaction
                const { error: txErr } = await supabase.from('transactions').insert({
                  user_id: user.id,
                  user_email: user.email,
                  user_name: user.user_metadata?.full_name || user.email,
                  type: 'Trade',
                  amount: job.newPos.margin,
                  currency: 'USD',
                  method: 'Other',
                  status: 'Completed',
                  instructions: `Order Filled - Opened ${job.newPos.type} position: ${job.newPos.size} ${job.newPos.symbol} at $${job.newPos.entryPrice.toLocaleString()}`,
                });
                if (txErr) throw txErr;
              }

              // 4. Update balance and margin in user profile
              const currentWallet = get().wallet;
              const { error: userErr } = await supabase.from('users').update({
                balance: currentWallet.balance,
                margin_used: currentWallet.marginUsed,
              }).eq('id', user.id);
              if (userErr) throw userErr;
            } catch (err) {
              console.error('[checkOrders] Failed to synchronize filled orders with Supabase:', err);
            }
          })();
        }
      },

      addBalance: (amount) => {
        set((state) => ({
          wallet: {
            ...state.wallet,
            balance: state.wallet.balance + amount
          }
        }));
      },
      
      setWalletBalance: (amount) => {
        set((state) => ({
          wallet: {
            ...state.wallet,
            balance: amount
          }
        }));
      },
      
      buyAsset: async (symbol, name, price, amount) => {
        // Fetch live price from DB — don't trust the client-side value which may
        // be stale if the admin changed the asset price after the page loaded.
        let livePrice = price;
        try {
          const { data: assetRow } = await supabase
            .from('premarket_assets')
            .select('price')
            .eq('symbol', symbol)
            .eq('is_active', true)
            .maybeSingle();
          if (assetRow?.price != null) {
            livePrice = Number(assetRow.price);
          }
        } catch {
          // Network error — fall back to provided price; purchase will still proceed
        }

        const state = get();
        const cost = livePrice * amount;
        if (state.wallet.balance - state.wallet.marginUsed < cost) {
          return false;
        }

        // Backend validation
        try {
          const { data, error } = await supabase.from('premarket_contract_signatures').select('id').eq('contract_version', 'v1.0');
          if (error || !data || data.length === 0) {
            toast.error('You must sign the contract before purchasing.');
            return false;
          }
        } catch (err) {
          return false;
        }

        const newId = crypto.randomUUID();
        const newAsset: Asset = {
          id: newId,
          symbol,
          name,
          amount,
          buyPrice: livePrice,
          currentPrice: livePrice,
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          assets: [...(state.assets || []), newAsset],
          wallet: {
            ...state.wallet,
            balance: state.wallet.balance - cost,
          }
        }));

        // Background database sync
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Log transaction
            const { error: txErr } = await supabase.from('transactions').insert({
              user_id: user.id,
              user_email: user.email,
              user_name: user.user_metadata?.full_name || user.email,
              type: 'Trade',
              amount: cost,
              currency: 'USD',
              method: 'Other',
              status: 'Completed',
              instructions: `Pre-Market Purchase: ${amount} ${symbol} at $${livePrice.toLocaleString()}`,
            });
            if (txErr) throw txErr;

            // Update balance
            const currentWallet = get().wallet;
            const { error: userErr } = await supabase.from('users').update({
              balance: currentWallet.balance,
            }).eq('id', user.id);
            if (userErr) throw userErr;
          } catch (err) {
            console.error('[buyAsset] Failed to persist to Supabase:', err);
          }
        })();

        return true;
      },
      setAssets: (assets) => set({ assets })
    }),
    {
      name: 'bullenhaus-trading-store',
      partialize: (state) => ({
        positions: state.positions,
        orders: state.orders,
        assets: state.assets,
      }),
    }
  )
);
