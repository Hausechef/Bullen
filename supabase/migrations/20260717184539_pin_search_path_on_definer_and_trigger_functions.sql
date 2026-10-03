-- WARN: these functions had a mutable search_path, letting a role that
-- can create objects in a schema earlier in the caller's search_path
-- shadow unqualified references. All bodies already qualify tables with
-- public., so this only pins the resolution path -- no behavior change.
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.set_workflows_updated_at() SET search_path = public;
ALTER FUNCTION public.sign_premarket_contract(text, uuid) SET search_path = public;
ALTER FUNCTION public.execute_spot_trade(text, text, numeric, numeric) SET search_path = public;
ALTER FUNCTION public.get_my_gamification_stats() SET search_path = public;
ALTER FUNCTION public.get_gamification_leaderboard(integer) SET search_path = public;
