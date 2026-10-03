-- Dry-run audit for removing every record related to Hayk Galstyan.
-- This script is read-only except for temporary tables in the current session.
-- Review every result set before running any delete script.

begin;

create temp table _target_users(id uuid primary key) on commit drop;
create temp table _target_leads(id uuid primary key) on commit drop;
create temp table _target_clients(id uuid primary key) on commit drop;
create temp table _counts(scope text, table_name text, matched_rows bigint) on commit drop;

insert into _target_users(id)
select id
from public.users
where
  lower(coalesce(email, '')) like '%hayk%'
  or lower(coalesce(email, '')) like '%galstyan%'
  or lower(coalesce(full_name, '')) like '%hayk%galstyan%'
  or lower(coalesce(display_name, '')) like '%hayk%galstyan%'
  or lower(coalesce(username, '')) like '%hayk%galstyan%'
  or lower(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) like '%hayk%galstyan%'
on conflict do nothing;

insert into _target_leads(id)
select id
from public.leads
where
  lower(coalesce(email, '')) like '%hayk%'
  or lower(coalesce(email, '')) like '%galstyan%'
  or lower(coalesce(name, '')) like '%hayk%galstyan%'
  or lower(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) like '%hayk%galstyan%'
on conflict do nothing;

insert into _target_clients(id)
select id
from public.clients
where
  user_id in (select id from _target_users)
  or lower(coalesce(email, '')) like '%hayk%'
  or lower(coalesce(email, '')) like '%galstyan%'
  or lower(coalesce(full_name, '')) like '%hayk%galstyan%'
on conflict do nothing;

insert into _target_users(id)
select user_id
from public.clients
where id in (select id from _target_clients)
  and user_id is not null
on conflict do nothing;

insert into _counts(scope, table_name, matched_rows)
select 'identity', 'public.users', count(*) from _target_users
union all
select 'identity', 'public.leads', count(*) from _target_leads
union all
select 'identity', 'public.clients', count(*) from _target_clients;

do $$
declare
  r record;
  q text;
  n bigint;
begin
  for r in
    select * from (values
      ('public.transactions', 'user_id in (select id from _target_users) or lower(coalesce(user_email, '''')) like ''%hayk%'' or lower(coalesce(user_email, '''')) like ''%galstyan%'' or lower(coalesce(user_name, '''')) like ''%hayk%galstyan%'''),
      ('public.positions', 'user_id in (select id from _target_users)'),
      ('public.orders', 'user_id in (select id from _target_users)'),
      ('public.spot_holdings', 'user_id in (select id from _target_users)'),
      ('public.spot_trades', 'user_id in (select id from _target_users)'),
      ('public.premarket_contract_signatures', 'user_id in (select id from _target_users)'),
      ('public.premarket_asset_signatures', 'user_id in (select id from _target_users)'),
      ('public.kyc_reviews', 'user_id in (select id from _target_users)'),
      ('public.notifications', 'user_id in (select id from _target_users)'),
      ('public.support_tickets', 'client_id in (select id from _target_users) or lower(coalesce(contact_email, '''')) like ''%hayk%'' or lower(coalesce(contact_email, '''')) like ''%galstyan%'''),
      ('public.messages', 'client_id in (select id from _target_users)'),
      ('public.client_files', 'client_id in (select id from _target_users) or uploaded_by in (select id from _target_users)'),
      ('public.call_logs', 'client_id in (select id from _target_users)'),
      ('public.tasks', 'client_id in (select id from _target_users) or lead_id in (select id from _target_leads)'),
      ('public.lead_stage_history', 'lead_id in (select id from _target_leads)'),
      ('public.lead_assignment_log', 'lead_id in (select id from _target_leads)'),
      ('storage.objects', 'bucket_id in (''client-files'', ''kyc-documents'', ''premarket-contracts'') and exists (select 1 from _target_users tu where name like tu.id::text || ''/%'')')
    ) as x(table_name, condition)
  loop
    if to_regclass(r.table_name) is not null then
      q := format('select count(*) from %s where %s', r.table_name, r.condition);
      execute q into n;
      insert into _counts values ('related', r.table_name, n);
    end if;
  end loop;
end $$;

select 'target public.users' as result_set, u.*
from public.users u
where u.id in (select id from _target_users)
order by u.created_at nulls last;

select 'target public.leads' as result_set, l.*
from public.leads l
where l.id in (select id from _target_leads)
order by l.created_at nulls last;

select 'target public.clients' as result_set, c.*
from public.clients c
where c.id in (select id from _target_clients)
order by c.created_at nulls last;

select *
from _counts
where matched_rows > 0
order by scope, table_name;

rollback;
