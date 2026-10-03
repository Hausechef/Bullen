import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTradingStore, type Position, type Order } from '../stores/tradingStore';

const mapDbPosition = (row: any): Position => ({
  id: row.id,
  symbol: row.symbol,
  type: row.type,
  entryPrice: Number(row.entry_price),
  size: Number(row.size),
  leverage: Number(row.leverage),
  marginType: row.margin_type,
  margin: Number(row.margin),
  liquidationPrice: Number(row.liquidation_price),
  stopLoss: row.stop_loss != null ? Number(row.stop_loss) : null,
  takeProfit: row.take_profit != null ? Number(row.take_profit) : null,
  unrealizedPnL: row.unrealized_pnl != null ? Number(row.unrealized_pnl) : 0,
  status: row.status,
  createdAt: row.created_at,
  closedAt: row.closed_at,
});

const mapDbOrder = (row: any): Order => ({
  id: row.id,
  symbol: row.symbol,
  type: row.type,
  positionType: row.position_type,
  price: Number(row.price),
  size: Number(row.size),
  leverage: Number(row.leverage),
  marginType: row.margin_type,
  stopLoss: row.stop_loss != null ? Number(row.stop_loss) : null,
  takeProfit: row.take_profit != null ? Number(row.take_profit) : null,
  status: row.status,
});

// Single source of truth for trading state hydration: loads the wallet balance
// and realized P&L from the users table, plus open positions and pending orders.
// marginUsed is derived from the open-positions sum (the true reserved margin),
// not the denormalized users.margin_used column, which can drift.
export const useWalletSync = (pollMs = 30000) => {
  const setWallet = useTradingStore((s) => s.setWallet);
  const setPositions = useTradingStore((s) => s.setPositions);
  const setOrders = useTradingStore((s) => s.setOrders);
  const setAssets = useTradingStore((s) => s.setAssets);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user?.id) {
        setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
        setPositions([]);
        setOrders([]);
        setAssets([]);
        return;
      }
      const uid = session.user.id;

      const [profileRes, posRes, ordRes, txRes] = await Promise.all([
        supabase.from('users').select('balance, realized_pnl').eq('id', uid).maybeSingle(),
        supabase.from('positions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(150),
        supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(150),
        supabase.from('transactions').select('*').eq('user_id', uid).eq('type', 'Trade').order('created_at', { ascending: true })
      ]);

      if (profileRes.error) throw profileRes.error;

      const positions = (posRes.data ?? []).map(mapDbPosition);
      const orders = (ordRes.data ?? []).map(mapDbOrder);
      const marginUsed = positions.filter(p => p.status === 'open').reduce((acc, p) => acc + p.margin, 0);

      // Reconstruct assets from transactions
      const parsedAssets: any[] = [];
      (txRes.data ?? []).forEach(tx => {
        if (!tx.instructions) return;
        const match = tx.instructions.match(/Pre-Market Purchase:\s*([\d.]+)\s+([A-Z0-9]+)\s+at/i);
        if (match) {
          const qty = parseFloat(match[1]);
          const price = tx.amount / qty;
          parsedAssets.push({
            id: tx.id,
            symbol: match[2],
            name: match[2], // Use symbol as name since we don't store name in transaction
            amount: qty,
            buyPrice: price,
            currentPrice: price, // This will be updated by real price feed later
            createdAt: tx.created_at
          });
        }
      });

      setPositions(positions);
      setOrders(orders);
      setAssets(parsedAssets);
      setWallet({
        balance: Number(profileRes.data?.balance ?? 0),
        realizedPnL: Number(profileRes.data?.realized_pnl ?? 0),
        marginUsed,
      });
    } catch (err: any) {
      console.error('[useWalletSync] failed to load wallet:', err);
      setError(err?.message || 'Failed to load wallet');
      setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
    } finally {
      setLoading(false);
    }
  }, [setWallet, setPositions, setOrders]);

  useEffect(() => {
    refetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
        setPositions([]);
        setOrders([]);
        setAssets([]);
      } else {
        refetch();
      }
    });

    if (!pollMs) {
      return () => subscription.unsubscribe();
    }

    const interval = window.setInterval(refetch, pollMs);
    return () => {
      subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, [pollMs, refetch, setWallet, setPositions, setOrders, setAssets]);

  return { loading, error, refetch };
};
