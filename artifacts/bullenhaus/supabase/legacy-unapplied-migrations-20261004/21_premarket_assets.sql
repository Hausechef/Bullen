create table if not exists public.premarket_assets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  price numeric not null check (price >= 0),
  description text,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.premarket_assets enable row level security;

create policy "Premarket assets are viewable by everyone" on public.premarket_assets for select using (true);
create policy "Admins can insert premarket assets" on public.premarket_assets for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'superadmin', 'trade_admin'))
);
create policy "Admins can update premarket assets" on public.premarket_assets for update using (
  exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'superadmin', 'trade_admin'))
);
create policy "Admins can delete premarket assets" on public.premarket_assets for delete using (
  exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'superadmin', 'trade_admin'))
);