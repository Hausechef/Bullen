-- Drop old policies that lacked 'admin' role
drop policy if exists "Admins can insert premarket assets" on public.premarket_assets;
drop policy if exists "Admins can update premarket assets" on public.premarket_assets;
drop policy if exists "Admins can delete premarket assets" on public.premarket_assets;

-- Create new policies including 'admin' role
create policy "Admins can insert premarket assets" on public.premarket_assets for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'superadmin', 'trade_admin'))
);

create policy "Admins can update premarket assets" on public.premarket_assets for update using (
  exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'superadmin', 'trade_admin'))
);

create policy "Admins can delete premarket assets" on public.premarket_assets for delete using (
  exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'superadmin', 'trade_admin'))
);
