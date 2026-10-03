-- ============================================================
-- Migration 17: Fix users.role constraint and RLS for trade_admin/crm_admin
--
-- WHY THIS EXISTS:
--   Migration 02 defined users.role with only 5 allowed values.
--   Roles trade_admin and crm_admin were added to the frontend later
--   but were never added to the DB constraint or RLS policies.
--   This migration brings the DB in sync with the application role system.
-- ============================================================

-- ============================================================
-- PART 1: Fix the role CHECK constraint
--
-- The current constraint (auto-named users_role_check by Postgres)
-- blocks INSERT/UPDATE of any row with role = 'trade_admin' or 'crm_admin'.
-- We drop it and add a new one with all 7 allowed values.
-- ============================================================

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'client',
    'agent',
    'manager',
    'director',
    'admin',
    'trade_admin',
    'crm_admin'
  ));

-- ============================================================
-- PART 2: Fix users SELECT policy
--
-- Before: only 'admin' and 'manager' could read all user rows.
-- trade_admin needs to see users to manage their trading data.
-- crm_admin needs to see all users to do CRM work.
-- ============================================================

DROP POLICY IF EXISTS "users_select_admin_manager" ON public.users;

CREATE POLICY "users_select_admin_manager"
  ON public.users FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'trade_admin', 'crm_admin'));

-- ============================================================
-- PART 3: Fix users UPDATE policy
--
-- Before: only 'admin' could update any user row.
-- crm_admin needs to update users (role, kyc_status, profile fields).
-- trade_admin needs to update users (balance, margin_used after trades).
-- ============================================================

DROP POLICY IF EXISTS "users_update_admin" ON public.users;

CREATE POLICY "users_update_admin"
  ON public.users FOR UPDATE
  USING (get_my_role() IN ('admin', 'trade_admin', 'crm_admin'));

-- ============================================================
-- PART 4: Fix transactions SELECT policy
--
-- trade_admin manages the trading side and must see deposit/withdrawal
-- requests to process them.
-- crm_admin manages the CRM side and must see all client transactions.
-- ============================================================

DROP POLICY IF EXISTS "transactions_select_admin_manager" ON public.transactions;

CREATE POLICY "transactions_select_admin_manager"
  ON public.transactions FOR SELECT
  USING (get_my_role() IN ('admin', 'manager', 'trade_admin', 'crm_admin'));

-- ============================================================
-- PART 5: Fix transactions UPDATE policy
--
-- Before: only 'admin' could approve/reject transactions.
-- crm_admin is responsible for approving client deposits/withdrawals.
-- trade_admin also needs to approve trading-related transactions.
-- ============================================================

DROP POLICY IF EXISTS "transactions_update_admin" ON public.transactions;

CREATE POLICY "transactions_update_admin"
  ON public.transactions FOR UPDATE
  USING (get_my_role() IN ('admin', 'trade_admin', 'crm_admin'));

-- ============================================================
-- PART 6: Fix transactions INSERT policy
--
-- crm_admin may need to create manual credit/debit entries.
-- trade_admin may create trade settlement transactions.
-- ============================================================

DROP POLICY IF EXISTS "transactions_insert_admin" ON public.transactions;

CREATE POLICY "transactions_insert_admin"
  ON public.transactions FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'trade_admin', 'crm_admin'));

-- ============================================================
-- PART 7: Ensure unrealized_pnl column exists on positions
--
-- Migration 15_create_positions_and_orders.sql includes this column.
-- If for any reason the other 15_* file ran first (no unrealized_pnl),
-- this ADD COLUMN IF NOT EXISTS is a safe no-op when column already exists.
-- The frontend tradingStore reads and writes this column.
-- ============================================================

ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS unrealized_pnl numeric(18, 2) NOT NULL DEFAULT 0;
