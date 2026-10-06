-- Migration 25: Unify premarket contract signing under a single RPC
--
-- Two parallel signing stacks existed:
--   1. sign_premarket_contract(version)             -> premarket_contract_signatures (legacy)
--   2. sign_premarket_contract(version, asset_id)   -> premarket_contract_signatures + price_snapshot (Migration 24)
--   3. sign_premarket_asset_contract(p_asset_id)    -> premarket_asset_signatures (parallel implementation)
--
-- The 1-arg/2-arg overload of sign_premarket_contract makes PostgREST RPC calls
-- that pass only {version} fail with an ambiguity error. This migration keeps
-- sign_premarket_contract(version, asset_id DEFAULT NULL) as the single entry
-- point and drops the other two functions.
--
-- premarket_asset_signatures table is intentionally kept: existing signature
-- rows are preserved, the table is just no longer written to.

DROP FUNCTION IF EXISTS public.sign_premarket_contract(text);
DROP FUNCTION IF EXISTS public.sign_premarket_asset_contract(uuid);
