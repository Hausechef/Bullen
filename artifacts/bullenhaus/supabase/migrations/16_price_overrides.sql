-- Migration 16: Admin price overrides table for real-time market control
--
-- Allows admins/trade_admins to fix asset prices that are then broadcast
-- to all connected clients via Supabase Realtime.

create table if not exists public.price_overrides (
  symbol       text primary key,
  price        numeric(18, 8) not null check (price > 0),
  set_by       uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.price_overrides enable row level security;

-- Admins and trade_admins can insert/update/delete
drop policy if exists "price_overrides_admin_all" on public.price_overrides;
create policy "price_overrides_admin_all"
  on public.price_overrides for all
  using (public.get_my_role() in ('admin', 'trade_admin'))
  with check (public.get_my_role() in ('admin', 'trade_admin'));

-- All authenticated users can read (to receive overrides)
drop policy if exists "price_overrides_read" on public.price_overrides;
create policy "price_overrides_read"
  on public.price_overrides for select
  using (auth.uid() is not null);

drop trigger if exists price_overrides_set_updated_at on public.price_overrides;
create trigger price_overrides_set_updated_at
  before update on public.price_overrides
  for each row execute function public.set_updated_at();

-- Enable realtime so clients receive INSERT/UPDATE/DELETE events
alter publication supabase_realtime add table public.price_overrides;
