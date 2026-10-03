-- ============================================================
-- Seed data for Bullenhaus MVP
-- Run AFTER applying migration 02_corrected_schema.sql
--
-- Step 1: Create auth users via Supabase Dashboard → Authentication
--         or use the Supabase CLI: supabase auth create-user
-- Step 2: Copy the resulting UUIDs into the INSERT below
-- Step 3: Run this SQL in the Supabase SQL Editor
-- ============================================================

-- Replace these placeholder UUIDs with real auth.users IDs
-- created via: Dashboard → Authentication → Users → Add user

do $$
declare
  admin_id   uuid := '00000000-0000-0000-0000-000000000001';
  manager_id uuid := '00000000-0000-0000-0000-000000000002';
  agent_id   uuid := '00000000-0000-0000-0000-000000000003';
  client_id  uuid := '00000000-0000-0000-0000-000000000004';
begin

  -- Admin user
  insert into public.users (id, email, full_name, display_name, role, kyc_status, balance)
  values (admin_id, 'admin@bullenhaus.com', 'Admin User', 'Admin', 'admin', 'VERIFIED', 0)
  on conflict (id) do update set role = 'admin', kyc_status = 'VERIFIED';

  -- Manager
  insert into public.users (id, email, full_name, display_name, role, kyc_status, balance)
  values (manager_id, 'manager@bullenhaus.com', 'Account Manager', 'Manager', 'manager', 'VERIFIED', 0)
  on conflict (id) do update set role = 'manager', kyc_status = 'VERIFIED';

  -- Agent
  insert into public.users (id, email, full_name, display_name, role, kyc_status, balance)
  values (agent_id, 'agent@bullenhaus.com', 'Sales Agent', 'Agent', 'agent', 'VERIFIED', 0)
  on conflict (id) do update set role = 'agent', kyc_status = 'VERIFIED';

  -- Demo client with funded wallet
  insert into public.users (id, email, full_name, display_name, role, kyc_status, balance, realized_pnl)
  values (client_id, 'client@bullenhaus.com', 'Demo Client', 'DemoClient', 'client', 'VERIFIED', 10000, 250)
  on conflict (id) do update set balance = 10000, kyc_status = 'VERIFIED';

  -- Sample transactions for demo client
  insert into public.transactions (user_id, user_email, user_name, type, status, amount, currency, method)
  values
    (client_id, 'client@bullenhaus.com', 'DemoClient', 'Deposit',    'Completed', 10000, 'USD', 'IBAN Transfer'),
    (client_id, 'client@bullenhaus.com', 'DemoClient', 'Withdrawal', 'Pending',     500, 'USD', 'IBAN Transfer'),
    (client_id, 'client@bullenhaus.com', 'DemoClient', 'Deposit',    'Approved',   2500, 'USD', 'Credit Card')
  on conflict do nothing;

end $$;
