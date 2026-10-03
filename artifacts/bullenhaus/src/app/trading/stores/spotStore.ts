import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useTradingStore } from './tradingStore';

export interface SpotHolding {
  symbol: string;        // base ticker, e.g. 'BTC'
  amount: number;
  avgBuyPrice: number;
  updatedAt: string;
}

export interface SpotTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  createdAt: string;
}

interface SpotState {
  holdings: SpotHolding[];
  trades: SpotTrade[];
  loading: boolean;
  executing: boolean;

  loadHoldings: () => Promise<void>;
  loadTrades: (limit?: number) => Promise<void>;
  /**
   * Executes a spot trade through the execute_spot_trade RPC.
   * The DB atomically moves money between users.balance and the holding;
   * on success the local wallet balance and holdings are refreshed.
   * Returns an error message on failure, null on success.
   */
  executeTrade: (symbol: string, side: 'buy' | 'sell', amount: number, price: number) => Promise<string | null>;
}

export const useSpotStore = create<SpotState>()((set, get) => ({
  holdings: [],
  trades: [],
  loading: false,
  executing: false,

  loadHoldings: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('spot_holdings')
        .select('symbol, amount, avg_buy_price, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      set({
        holdings: (data ?? []).map(r => ({
          symbol: r.symbol,
          amount: Number(r.amount),
          avgBuyPrice: Number(r.avg_buy_price),
          updatedAt: r.updated_at,
        })),
      });
    } catch (err) {
      console.error('[spotStore] failed to load holdings:', err);
    } finally {
      set({ loading: false });
    }
  },

  loadTrades: async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('spot_trades')
        .select('id, symbol, side, amount, price, total, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      set({
        trades: (data ?? []).map(r => ({
          id: r.id,
          symbol: r.symbol,
          side: r.side,
          amount: Number(r.amount),
          price: Number(r.price),
          total: Number(r.total),
          createdAt: r.created_at,
        })),
      });
    } catch (err) {
      console.error('[spotStore] failed to load trades:', err);
    }
  },

  executeTrade: async (symbol, side, amount, price) => {
    if (get().executing) return 'Another trade is in progress';
    set({ executing: true });
    try {
      const { data, error } = await supabase.rpc('execute_spot_trade', {
        p_symbol: symbol,
        p_side: side,
        p_amount: amount,
        p_price: price,
      });
      if (error) {
        const msg = error.message || 'Trade failed';
        if (msg.includes('Insufficient balance')) return 'Insufficient balance';
        if (msg.includes('Insufficient holding')) return 'Insufficient holding';
        return msg;
      }

      // Sync the wallet balance returned by the RPC into the trading store.
      const newBalance = data?.balance != null ? Number(data.balance) : null;
      if (newBalance != null) {
        useTradingStore.getState().setWallet({ balance: newBalance });
      }

      await get().loadHoldings();

      // Log to the shared transactions feed (same pattern as buyAsset) so the
      // trade shows up on the Transactions page and in the admin panel.
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('transactions').insert({
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email,
            type: 'Trade',
            amount: Number(data?.total ?? amount * price),
            currency: 'USD',
            method: 'Other',
            status: 'Completed',
            instructions: `Spot ${side === 'buy' ? 'Buy' : 'Sell'}: ${amount} ${symbol} at $${price.toLocaleString()}`,
          });
        } catch (err) {
          console.error('[spotStore] failed to log transaction:', err);
        }
      })();

      return null;
    } catch (err: any) {
      return err?.message || 'Trade failed';
    } finally {
      set({ executing: false });
    }
  },
}));
