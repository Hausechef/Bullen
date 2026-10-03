-- Separate BHRecover registration queue for the CRM.
-- This intentionally does not share Trade users, leads, balances, or cases.

create table if not exists public.recovery_registrations (
  id                    uuid primary key default gen_random_uuid(),
  external_user_id      text not null unique,
  full_name             text not null,
  email                 text not null,
  registration_status   text not null default 'NEW'
    check (registration_status in ('NEW', 'CONTACTED', 'IN_REVIEW', 'ACTIVE_CASE', 'CLOSED')),
  source                text not null default 'BHRecover',
  assigned_agent_id     uuid references public.users(id) on delete set null,
  notes                 text,
  sync_metadata         jsonb not null default '{}'::jsonb,
  registered_at         timestamptz not null,
  last_synced_at        timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create unique index if not exists recovery_registrations_email_unique
  on public.recovery_registrations (lower(email));
create index if not exists recovery_registrations_status_idx
  on public.recovery_registrations (registration_status, registered_at desc);
create index if not exists recovery_registrations_assignee_idx
  on public.recovery_registrations (assigned_agent_id);

create or replace function public.set_recovery_registration_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recovery_registrations_set_updated_at on public.recovery_registrations;
create trigger recovery_registrations_set_updated_at
  before update on public.recovery_registrations
  for each row execute function public.set_recovery_registration_updated_at();

alter table public.recovery_registrations enable row level security;

revoke all on table public.recovery_registrations from anon, authenticated;
grant select on table public.recovery_registrations to authenticated;
grant update (registration_status, assigned_agent_id, notes)
  on table public.recovery_registrations to authenticated;
grant all on table public.recovery_registrations to service_role;

drop policy if exists "Recovery CRM workers can view registrations" on public.recovery_registrations;
create policy "Recovery CRM workers can view registrations"
  on public.recovery_registrations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.users staff
      where staff.id = (select auth.uid())
        and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin')
    )
  );

drop policy if exists "Recovery CRM workers can update registrations" on public.recovery_registrations;
create policy "Recovery CRM workers can update registrations"
  on public.recovery_registrations
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.users staff
      where staff.id = (select auth.uid())
        and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin')
    )
  )
  with check (
    exists (
      select 1
      from public.users staff
      where staff.id = (select auth.uid())
        and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin')
    )
  );
