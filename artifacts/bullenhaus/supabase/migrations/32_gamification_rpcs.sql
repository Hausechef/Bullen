-- Migration 32: Real data for the Rewards (gamification) page
--
-- get_my_gamification_stats  — per-user trading stats the badges/XP are
--                              computed from (margin positions + spot trades,
--                              stop-loss/limit-order usage, realized PnL).
-- get_gamification_leaderboard — global top-N by XP. SECURITY DEFINER so it
--                              can aggregate across users, but only exposes
--                              display name, role, XP, PnL and trade count.
--                              XP formula: trades * 100 + max(realized_pnl,0)/10.

CREATE OR REPLACE FUNCTION public.get_my_gamification_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_margin_trades   INT;
  v_spot_trades     INT;
  v_closed          INT;
  v_winning         INT;
  v_has_stop_loss   BOOLEAN;
  v_has_limit_order BOOLEAN;
  v_realized_pnl    NUMERIC;
  v_balance         NUMERIC;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT count(*) INTO v_margin_trades FROM public.positions WHERE user_id = v_user;
  SELECT count(*) INTO v_spot_trades   FROM public.spot_trades WHERE user_id = v_user;
  SELECT count(*), count(*) FILTER (WHERE unrealized_pnl > 0)
    INTO v_closed, v_winning
    FROM public.positions WHERE user_id = v_user AND status = 'closed';
  SELECT EXISTS (SELECT 1 FROM public.positions WHERE user_id = v_user AND stop_loss IS NOT NULL)
    INTO v_has_stop_loss;
  SELECT EXISTS (SELECT 1 FROM public.orders WHERE user_id = v_user AND type = 'Limit')
    INTO v_has_limit_order;
  SELECT COALESCE(realized_pnl, 0), COALESCE(balance, 0)
    INTO v_realized_pnl, v_balance
    FROM public.users WHERE id = v_user;

  RETURN json_build_object(
    'total_trades',    v_margin_trades + v_spot_trades,
    'margin_trades',   v_margin_trades,
    'spot_trades',     v_spot_trades,
    'closed_trades',   v_closed,
    'winning_trades',  v_winning,
    'has_stop_loss',   v_has_stop_loss,
    'has_limit_order', v_has_limit_order,
    'realized_pnl',    v_realized_pnl,
    'balance',         v_balance
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_gamification_leaderboard(p_limit INT DEFAULT 10)
RETURNS TABLE (
  rank         BIGINT,
  display_name TEXT,
  role         TEXT,
  xp           NUMERIC,
  realized_pnl NUMERIC,
  trades       BIGINT,
  is_me        BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH trade_counts AS (
    SELECT u.id,
           COALESCE(u.display_name, u.full_name, u.username, split_part(u.email, '@', 1)) AS name,
           u.role,
           COALESCE(u.realized_pnl, 0) AS pnl,
           (SELECT count(*) FROM public.positions p WHERE p.user_id = u.id)
         + (SELECT count(*) FROM public.spot_trades st WHERE st.user_id = u.id) AS trades
    FROM public.users u
    WHERE u.role IN ('client', 'admin', 'trade_admin')
  ),
  scored AS (
    SELECT *,
           trades * 100 + GREATEST(pnl, 0) / 10 AS xp
    FROM trade_counts
    WHERE trades > 0 OR pnl <> 0
  )
  SELECT row_number() OVER (ORDER BY xp DESC, pnl DESC) AS rank,
         name AS display_name,
         role,
         round(xp, 0) AS xp,
         round(pnl, 2) AS realized_pnl,
         trades,
         (id = auth.uid()) AS is_me
  FROM scored
  ORDER BY xp DESC, pnl DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 100);
$$;
