-- Migration 31: Spot trading (buy & hold crypto without leverage)
--
-- spot_holdings  — current per-user holdings, one row per (user, symbol),
--                  average buy price maintained on every purchase.
-- spot_trades    — immutable trade history (buy/sell).
-- execute_spot_trade RPC — the only write path. Atomically moves money
--                  between users.balance and the holding under a row lock.
-- Prices come from the client's live market feed, same trust model as the
-- existing margin engine.

CREATE TABLE IF NOT EXISTS public.spot_holdings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol        TEXT NOT NULL,                     -- base ticker, e.g. 'BTC'
  amount        NUMERIC(28, 10) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  avg_buy_price NUMERIC(18, 8)  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, symbol)
);

CREATE TABLE IF NOT EXISTS public.spot_trades (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol     TEXT NOT NULL,
  side       TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  amount     NUMERIC(28, 10) NOT NULL CHECK (amount > 0),
  price      NUMERIC(18, 8)  NOT NULL CHECK (price > 0),
  total      NUMERIC(18, 2)  NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spot_trades_user_created_idx
  ON public.spot_trades (user_id, created_at DESC);

ALTER TABLE public.spot_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_trades   ENABLE ROW LEVEL SECURITY;

-- Users read their own rows; all writes go through the SECURITY DEFINER RPC.
DROP POLICY IF EXISTS spot_holdings_select_own ON public.spot_holdings;
CREATE POLICY spot_holdings_select_own ON public.spot_holdings
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS spot_trades_select_own ON public.spot_trades;
CREATE POLICY spot_trades_select_own ON public.spot_trades
  FOR SELECT USING (user_id = auth.uid());

-- Admins can read everything (role check against public.users).
DROP POLICY IF EXISTS spot_holdings_select_admin ON public.spot_holdings;
CREATE POLICY spot_holdings_select_admin ON public.spot_holdings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'trade_admin'))
  );

DROP POLICY IF EXISTS spot_trades_select_admin ON public.spot_trades;
CREATE POLICY spot_trades_select_admin ON public.spot_trades
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'trade_admin'))
  );

CREATE OR REPLACE FUNCTION public.execute_spot_trade(
  p_symbol TEXT,
  p_side   TEXT,
  p_amount NUMERIC,
  p_price  NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user    UUID := auth.uid();
  v_total   NUMERIC(18, 2);
  v_balance NUMERIC;
  v_holding public.spot_holdings%ROWTYPE;
  v_new_amount NUMERIC;
  v_new_avg    NUMERIC;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_side NOT IN ('buy', 'sell') THEN
    RAISE EXCEPTION 'Invalid side';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_price IS NULL OR p_price <= 0 THEN
    RAISE EXCEPTION 'Invalid amount or price';
  END IF;

  v_total := round(p_amount * p_price, 2);

  -- Lock the wallet row for the duration of the trade.
  SELECT balance INTO v_balance FROM public.users WHERE id = v_user FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  SELECT * INTO v_holding
  FROM public.spot_holdings
  WHERE user_id = v_user AND symbol = p_symbol
  FOR UPDATE;

  IF p_side = 'buy' THEN
    IF v_balance < v_total THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;

    IF v_holding.id IS NULL THEN
      INSERT INTO public.spot_holdings (user_id, symbol, amount, avg_buy_price)
      VALUES (v_user, p_symbol, p_amount, p_price);
    ELSE
      v_new_amount := v_holding.amount + p_amount;
      v_new_avg := (v_holding.amount * v_holding.avg_buy_price + p_amount * p_price) / v_new_amount;
      UPDATE public.spot_holdings
      SET amount = v_new_amount, avg_buy_price = v_new_avg, updated_at = now()
      WHERE id = v_holding.id;
    END IF;

    UPDATE public.users SET balance = balance - v_total WHERE id = v_user;

  ELSE -- sell
    IF v_holding.id IS NULL OR v_holding.amount < p_amount THEN
      RAISE EXCEPTION 'Insufficient holding';
    END IF;

    v_new_amount := v_holding.amount - p_amount;
    IF v_new_amount <= 0.0000000001 THEN
      DELETE FROM public.spot_holdings WHERE id = v_holding.id;
    ELSE
      UPDATE public.spot_holdings
      SET amount = v_new_amount, updated_at = now()
      WHERE id = v_holding.id;
    END IF;

    UPDATE public.users SET balance = balance + v_total WHERE id = v_user;
  END IF;

  INSERT INTO public.spot_trades (user_id, symbol, side, amount, price, total)
  VALUES (v_user, p_symbol, p_side, p_amount, p_price, v_total);

  SELECT balance INTO v_balance FROM public.users WHERE id = v_user;

  RETURN json_build_object(
    'balance', v_balance,
    'symbol', p_symbol,
    'side', p_side,
    'amount', p_amount,
    'price', p_price,
    'total', v_total
  );
END;
$$;
