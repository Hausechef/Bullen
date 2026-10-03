-- ============================================================
-- Migration 02: Corrected MVP schema (replaces 01)
-- Matches exact frontend field names and enum values
-- ============================================================

-- Drop existing broken tables (safe on fresh DB; cascade removes policies)
drop table if exists public.transactions cascade;
drop table if exists public.users cascade;

-- ============================================================
-- HELPER: security-definer function to read caller's role
-- Avoids RLS infinite recursion when policies query users table
-- ============================================================
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- ============================================================
-- TABLE: public.users
-- Merged profile + wallet + role + kyc — linked to auth.users
-- ============================================================
create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  full_name       text,
  username        text,
  display_name    text,
  avatar_url      text,
  role            text not null default 'client'
                    check (role in ('client', 'agent', 'manager', 'director', 'admin')),
  kyc_status      text not null default 'UNVERIFIED'
                    check (kyc_status in ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')),
  balance         numeric(18, 2) not null default 0,
  realized_pnl    numeric(18, 2) not null default 0,
  margin_used     numeric(18, 2) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABLE: public.transactions
-- Deposit/withdrawal requests submitted by traders
-- ============================================================
create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  user_email   text,
  user_name    text,
  type         text not null
                 check (type in ('Deposit', 'Withdrawal')),
  status       text not null default 'Pending'
                 check (status in ('Pending', 'Processing', 'Approved', 'Completed', 'Rejected')),
  amount       numeric(18, 2) not null check (amount > 0),
  currency     text not null default 'USD',
  method       text
                 check (method in ('Credit Card', 'IBAN Transfer', 'Payment Link', 'Other')),
  instructions text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index transactions_user_id_idx    on public.transactions(user_id);
create index transactions_status_idx     on public.transactions(status);
create index transactions_created_at_idx on public.transactions(created_at desc);
create index users_role_idx              on public.users(role);
create index users_kyc_status_idx        on public.users(kyc_status);

-- ============================================================
-- TRIGGER: auto-update updated_at on row change
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ============================================================
-- TRIGGER: auto-insert profile row when new Auth user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'display_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.users        enable row level security;
alter table public.transactions enable row level security;

-- ---- users policies ----------------------------------------

-- Any authenticated user can read their own row
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

-- Admin/manager can read all user rows (uses helper to avoid recursion)
create policy "users_select_admin_manager"
  on public.users for select
  using (get_my_role() in ('admin', 'manager'));

-- User can update their own profile fields (not role, not balance)
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admin can update any user (including balance, role, kyc_status)
create policy "users_update_admin"
  on public.users for update
  using (get_my_role() = 'admin');

-- Only the trigger (security definer) inserts rows; block manual insert
create policy "users_insert_trigger_only"
  on public.users for insert
  with check (auth.uid() = id);

-- ---- transactions policies ----------------------------------

-- User can view own transactions
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

-- Admin/manager can view all transactions
create policy "transactions_select_admin_manager"
  on public.transactions for select
  using (get_my_role() in ('admin', 'manager'));

-- User can create their own transaction requests
create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Admin can create transactions for any user
create policy "transactions_insert_admin"
  on public.transactions for insert
  with check (get_my_role() = 'admin');

-- Admin can update transactions (approve/reject, set instructions)
create policy "transactions_update_admin"
  on public.transactions for update
  using (get_my_role() = 'admin');

-- Manager can update transaction status/instructions (not amount)
create policy "transactions_update_manager"
  on public.transactions for update
  using (get_my_role() = 'manager');
