-- ============================================================================
-- Enforce the staff privilege boundary on public.users at the database layer.
--
-- WHY
-- ---
-- public.users has these UPDATE policies (live state, 2026-07-27):
--   * users_update_own   USING/CHECK  (auth.uid() = id)          -- any own-row
--   * users_update_admin USING (get_my_role() in admin/trade_admin/crm_admin)
--   * "CRM managers can assign client users" (role stays 'client')
-- and `authenticated` holds column-level UPDATE on every column, including
-- `role` and `kyc_status`. The only BEFORE UPDATE trigger (users_set_updated_at)
-- just stamps updated_at. Net effect:
--
--   P0 — any authenticated client can escalate itself with a direct PostgREST
--        write, e.g.
--          update public.users set role = 'admin', kyc_status = 'VERIFIED'
--          where id = auth.uid();
--        because users_update_own's WITH CHECK only re-verifies id ownership,
--        not which columns changed.
--
--   F1 (RLS path) — users_update_admin has no WITH CHECK, so a crm_admin or
--        trade_admin can set any user's role to 'admin' (vertical escalation),
--        mirroring the server-side worker gap already fixed in PR #32.
--
-- WHAT THIS DOES
-- --------------
-- A BEFORE UPDATE trigger enforces, for DIRECT client writes only:
--   * role      — a caller may only assign/keep roles at or below its own tier,
--                 and may not touch a row whose current role outranks it; a
--                 non-staff caller (client) may not change role at all.
--   * kyc_status— a non-staff caller may only self-submit ('PENDING'/'UNVERIFIED')
--                 on its own row; it may never self-'VERIFIED'/'REJECTED'. Staff
--                 may set any status (KYC review flow).
--
-- The trigger is SECURITY INVOKER so `current_user` still reflects the real
-- caller. It exempts every privileged server path:
--   * service_role  — the api/** Vercel functions and Supabase edge functions
--                     (which already re-check rank in code, PR #32);
--   * SECURITY DEFINER RPCs owned by the DB superuser — approve_deposit,
--                     approve_withdrawal, execute_spot_trade, sign_premarket_
--                     contract, etc. (current_user becomes the function owner).
--
-- DELIBERATELY OUT OF SCOPE
-- -------------------------
-- `balance`, `margin_used`, `realized_pnl` are intentionally NOT guarded here.
-- The current trade engine is client-authoritative: the browser computes the
-- wallet and writes these columns directly as `authenticated`
-- (artifacts/bullenhaus/src/app/trading/stores/tradingStore.ts). Locking them
-- would break open/close position, order fills, and pre-market buys. Making
-- balances server-authoritative is a separate, larger change and is called out
-- as its own finding — not smuggled into this minimal patch.
-- ============================================================================

-- Numeric rank for a role. Unknown/NULL ranks 0 (lowest). Mirrors ROLE_RANK in
-- api/_lib/supabase.ts (minus 'superadmin', which is not a valid users.role per
-- the users_role_check constraint).
CREATE OR REPLACE FUNCTION public.role_rank(role text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE role
    WHEN 'admin'       THEN 4
    WHEN 'director'    THEN 3
    WHEN 'crm_admin'   THEN 3
    WHEN 'trade_admin' THEN 3
    WHEN 'manager'     THEN 2
    WHEN 'agent'       THEN 1
    ELSE 0
  END;
$$;

GRANT EXECUTE ON FUNCTION public.role_rank(text) TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.enforce_users_privilege_boundary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_role text;
  caller_rank integer;
BEGIN
  -- Only guard direct client/PostgREST writes. Privileged server paths run
  -- under a different current_user and are intentionally exempt:
  --   'service_role' — edge/API functions (they re-check rank in code);
  --   the DB superuser (e.g. 'postgres') — SECURITY DEFINER financial RPCs.
  IF current_user = 'service_role' OR current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  caller_role := public.get_my_role();
  caller_rank := public.role_rank(caller_role);

  -- role: bounded by the caller's own tier; clients cannot change it at all.
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF caller_rank < 1 THEN
      RAISE EXCEPTION 'Not authorized to change user role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF public.role_rank(NEW.role) > caller_rank
       OR public.role_rank(OLD.role) > caller_rank THEN
      RAISE EXCEPTION 'Cannot assign or modify a role at or above your own tier'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- kyc_status: non-staff may only self-submit; staff may set any status.
  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status THEN
    IF caller_rank < 1
       AND (auth.uid() <> NEW.id OR NEW.kyc_status NOT IN ('PENDING', 'UNVERIFIED')) THEN
      RAISE EXCEPTION 'Not authorized to set this KYC status'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_enforce_privilege_boundary ON public.users;
CREATE TRIGGER users_enforce_privilege_boundary
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_users_privilege_boundary();
