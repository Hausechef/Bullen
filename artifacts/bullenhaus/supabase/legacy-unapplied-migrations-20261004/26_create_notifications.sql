-- Notifications used by /trade/notifications.
-- The frontend expects public.notifications; do not create user_notifications/alerts duplicates.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text not null default 'system',
  title text not null,
  message text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.users') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'notifications_user_id_fkey'
         and conrelid = 'public.notifications'::regclass
     ) then
    alter table public.notifications
      add constraint notifications_user_id_fkey
      foreign key (user_id)
      references public.users(id)
      on delete cascade;
  end if;
end $$;

create index if not exists idx_notifications_user_id
on public.notifications(user_id);

create index if not exists idx_notifications_created_at
on public.notifications(created_at desc);

create index if not exists idx_notifications_user_read
on public.notifications(user_id, read_at);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
drop policy if exists "Users can mark own notifications read" on public.notifications;
drop policy if exists "Admins can manage notifications" on public.notifications;

create policy "Users can read own notifications"
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
  or public.get_my_role() in ('admin', 'crm_admin', 'trade_admin')
);

create policy "Users can mark own notifications read"
on public.notifications
for update
to authenticated
using (
  user_id = auth.uid()
  or public.get_my_role() in ('admin', 'crm_admin', 'trade_admin')
)
with check (
  user_id = auth.uid()
  or public.get_my_role() in ('admin', 'crm_admin', 'trade_admin')
);

create policy "Admins can manage notifications"
on public.notifications
for all
to authenticated
using (
  public.get_my_role() in ('admin', 'crm_admin', 'trade_admin')
)
with check (
  public.get_my_role() in ('admin', 'crm_admin', 'trade_admin')
);

notify pgrst, 'reload schema';
