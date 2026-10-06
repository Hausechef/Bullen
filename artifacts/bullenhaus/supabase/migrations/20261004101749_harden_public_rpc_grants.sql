-- Least-privilege RPC surface for the existing public schema.
--
-- This migration intentionally does not change business-function bodies or
-- tables. It removes the implicit PUBLIC/anon execute surface, then grants
-- authenticated access only to RPCs called by the application or required by
-- authenticated RLS policies. Each SECURITY DEFINER RPC must still validate
-- the caller in its body before accessing privileged rows.

begin;

revoke execute on all functions in schema public from public, anon;

-- Application RPCs. Their respective function bodies enforce their narrower
-- business roles; `authenticated` here merely permits the RPC invocation.
grant execute on function public.ai_settings_status() to authenticated;
grant execute on function public.approve_deposit(uuid) to authenticated;
grant execute on function public.approve_withdrawal(uuid) to authenticated;
grant execute on function public.assign_leads_bulk(uuid, uuid[]) to authenticated;
grant execute on function public.execute_spot_trade(text, text, numeric, numeric) to authenticated;
grant execute on function public.get_gamification_leaderboard(integer) to authenticated;
grant execute on function public.get_my_gamification_stats() to authenticated;
grant execute on function public.get_my_role() to authenticated;
grant execute on function public.sign_premarket_contract(text) to authenticated;
grant execute on function public.sign_premarket_contract(text, uuid) to authenticated;

-- These functions use unqualified references to existing public objects. A
-- fixed search path closes role-dependent resolution while preserving those
-- references; pg_catalog remains first for built-ins.
alter function public.execute_spot_trade(text, text, numeric, numeric)
  set search_path = pg_catalog, public;
alter function public.get_gamification_leaderboard(integer)
  set search_path = pg_catalog, public;
alter function public.get_my_gamification_stats()
  set search_path = pg_catalog, public;
alter function public.sign_premarket_contract(text)
  set search_path = pg_catalog, public;
alter function public.sign_premarket_contract(text, uuid)
  set search_path = pg_catalog, public;
alter function public.set_updated_at()
  set search_path = pg_catalog, public;

commit;
