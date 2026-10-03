-- ============================================================
-- Migration 15: Create positions and orders tables
-- ============================================================

-- ============================================================
-- TABLE: public.positions
-- ============================================================
create table if not exists public.positions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  symbol            text not null,
  type              text not null check (type in ('Long', 'Short')),
  entry_price       numeric(18, 8) not null check (entry_price > 0),
  size              numeric(18, 8) not null check (size > 0),
  leverage          numeric(6, 2) not null check (leverage >= 1),
  margin_type       text not null check (margin_type in ('Cross', 'Isolated')),
  margin            numeric(18, 2) not null check (margin >= 0),
  liquidation_price numeric(18, 8) not null check (liquidation_price >= 0),
  stop_loss         numeric(18, 8),
  take_profit       numeric(18, 8),
  unrealized_pnl    numeric(18, 2) not null default 0,
  status            text not null default 'open' check (status in ('open', 'closed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- TABLE: public.orders
-- ============================================================
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  symbol        text not null,
  type          text not null check (type in ('Market', 'Limit', 'Stop')),
  position_type text not null check (position_type in ('Long', 'Short')),
  price         numeric(18, 8) not null check (price >= 0),
  size          numeric(18, 8) not null check (size > 0),
  leverage      numeric(6, 2) not null check (leverage >= 1),
  margin_type   text not null check (margin_type in ('Cross', 'Isolated')),
  stop_loss     numeric(18, 8),
  take_profit   numeric(18, 8),
  status        text not null default 'pending' check (status in ('pending', 'filled', 'canceled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indexes
create index positions_user_id_idx on public.positions(user_id);
create index positions_status_idx on public.positions(status);
create index orders_user_id_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);

-- Enable RLS
alter table public.positions enable row level security;
alter table public.orders enable row level security;

-- Policies for positions
create policy "positions_select_own" on public.positions
  for select using (auth.uid() = user_id);

create policy "positions_select_admin" on public.positions
  for select using (get_my_role() in ('admin', 'manager', 'director'));

create policy "positions_insert_own" on public.positions
  for insert with check (auth.uid() = user_id);

create policy "positions_update_own" on public.positions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "positions_update_admin" on public.positions
  for update using (get_my_role() = 'admin');

-- Policies for orders
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

create policy "orders_select_admin" on public.orders
  for select using (get_my_role() in ('admin', 'manager', 'director'));

create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "orders_update_own" on public.orders
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "orders_update_admin" on public.orders
  for update using (get_my_role() = 'admin');

-- ============================================================
-- ALTERATION: Support 'Trade' transaction type
-- ============================================================
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (type in ('Deposit', 'Withdrawal', 'Trade'));

