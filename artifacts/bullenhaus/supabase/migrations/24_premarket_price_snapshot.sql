-- Migration 24: Premarket contract price snapshot
--
-- Adds asset_id and price_snapshot to premarket_contract_signatures so every
-- signature records which asset was purchased and the live price at signing time.
-- Backward-compatible: both columns are nullable, existing rows are unaffected.
--
-- The updated sign_premarket_contract RPC reads the asset price from
-- premarket_assets at call time, preventing stale/template prices from entering
-- the signed record.

ALTER TABLE public.premarket_contract_signatures
  ADD COLUMN IF NOT EXISTS asset_id      UUID    REFERENCES public.premarket_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price_snapshot NUMERIC;

-- Replace the RPC.
-- asset_id is optional (NULL keeps backward compat for calls without an asset).
-- ON CONFLICT now UPDATEs so that if the admin changes the price and the user
-- re-triggers signing, the snapshot and timestamp are refreshed.
CREATE OR REPLACE FUNCTION sign_premarket_contract(version TEXT, asset_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price NUMERIC;
BEGIN
  IF asset_id IS NOT NULL THEN
    SELECT price INTO v_price
    FROM public.premarket_assets
    WHERE id = asset_id;
  END IF;

  INSERT INTO public.premarket_contract_signatures
         (user_id, contract_version, asset_id, price_snapshot)
  VALUES (auth.uid(), version,       asset_id, v_price)
  ON CONFLICT (user_id, contract_version) DO UPDATE
    SET asset_id       = EXCLUDED.asset_id,
        price_snapshot = EXCLUDED.price_snapshot,
        agreed_at      = now();
END;
$$;
