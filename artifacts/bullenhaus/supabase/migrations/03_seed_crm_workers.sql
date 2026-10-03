-- ============================================================
-- Migration 03: Aurelius Unified Trade Desk — CRM worker roles
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- This script:
--   1. Upserts a public.users row for each CRM worker (safe if the
--      auth trigger already created the row — uses ON CONFLICT)
--   2. Sets the correct role, full_name, display_name, kyc_status
--
-- All 15 workers must already exist in auth.users before running.
-- ============================================================

do $$
declare
  worker record;
begin

  for worker in (
    select *
    from (values
      ('orion.voss@aurelius-desk.crm',    'Orion Voss',     'Orion',   'admin'),
      ('selene.marwick@aurelius-desk.crm','Selene Marwick', 'Selene',  'director'),
      ('damian.rye@aurelius-desk.crm',    'Damian Rye',     'Damian',  'director'),
      ('nora.valen@aurelius-desk.crm',    'Nora Valen',     'Nora',    'manager'),
      ('kaspar.elian@aurelius-desk.crm',  'Kaspar Elian',   'Kaspar',  'manager'),
      ('mira.sable@aurelius-desk.crm',    'Mira Sable',     'Mira',    'agent'),
      ('levin.cross@aurelius-desk.crm',   'Levin Cross',    'Levin',   'agent'),
      ('aria.novak@aurelius-desk.crm',    'Aria Novak',     'Aria',    'agent'),
      ('theo.marek@aurelius-desk.crm',    'Theo Marek',     'Theo',    'agent'),
      ('ivana.reed@aurelius-desk.crm',    'Ivana Reed',     'Ivana',   'agent'),
      ('roman.kade@aurelius-desk.crm',    'Roman Kade',     'Roman',   'agent'),
      ('elara.finch@aurelius-desk.crm',   'Elara Finch',    'Elara',   'agent'),
      ('milan.torr@aurelius-desk.crm',    'Milan Torr',     'Milan',   'agent'),
      ('vera.lyon@aurelius-desk.crm',     'Vera Lyon',      'Vera',    'agent'),
      ('soren.black@aurelius-desk.crm',   'Soren Black',    'Soren',   'agent')
    ) as t(email, full_name, display_name, role)
  ) loop

    insert into public.users (id, email, full_name, display_name, role, kyc_status)
    select
      au.id,
      worker.email,
      worker.full_name,
      worker.display_name,
      worker.role,
      'VERIFIED'
    from auth.users au
    where au.email = worker.email
    on conflict (id) do update set
      full_name    = excluded.full_name,
      display_name = excluded.display_name,
      role         = excluded.role,
      kyc_status   = 'VERIFIED',
      updated_at   = now();

    if not found then
      raise notice 'WARNING: auth user not found for email: %', worker.email;
    end if;

  end loop;

end $$;

-- Verify results
select id, email, full_name, role, kyc_status, created_at
from public.users
where email like '%@aurelius-desk.crm'
order by
  case role
    when 'admin'    then 1
    when 'director' then 2
    when 'manager'  then 3
    when 'agent'    then 4
    else 5
  end,
  email;
