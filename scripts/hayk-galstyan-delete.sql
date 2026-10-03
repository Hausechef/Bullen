-- Destructive cleanup for removing every record related to Hayk Galstyan.
-- Do not run until the dry-run script has been reviewed and the target
-- environment has been confirmed.
--
-- Recommended psql usage:
--   \set ON_ERROR_STOP on
--   begin;
--   \i scripts/hayk-galstyan-delete.sql
--   -- review returned counts
--   commit;
--
-- To test without deleting, replace the final COMMIT in your client with ROLLBACK.

create temp table _target_users(id uuid primary key) on commit drop;
create temp table _target_leads(id uuid primary key) on commit drop;
create temp table _target_clients(id uuid primary key) on commit drop;
create temp table _deleted(table_name text, deleted_rows bigint) on commit drop;

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

do $$
declare
  r record;
  n bigint;
begin
  for r in
    select * from (values
      ('storage.objects', 'bucket_id in (''client-files'', ''kyc-documents'', ''premarket-contracts'') and exists (select 1 from _target_users tu where name like tu.id::text || ''/%'')'),
      ('public.lead_assignment_log', 'lead_id in (select id from _target_leads)'),
      ('public.lead_stage_history', 'lead_id in (select id from _target_leads)'),
      ('public.tasks', 'client_id in (select id from _target_users) or lead_id in (select id from _target_leads)'),
      ('public.call_logs', 'client_id in (select id from _target_users)'),
      ('public.client_files', 'client_id in (select id from _target_users) or uploaded_by in (select id from _target_users)'),
      ('public.messages', 'client_id in (select id from _target_users)'),
      ('public.support_tickets', 'client_id in (select id from _target_users) or lower(coalesce(contact_email, '''')) like ''%hayk%'' or lower(coalesce(contact_email, '''')) like ''%galstyan%'''),
      ('public.notifications', 'user_id in (select id from _target_users)'),
      ('public.kyc_reviews', 'user_id in (select id from _target_users)'),
      ('public.premarket_asset_signatures', 'user_id in (select id from _target_users)'),
      ('public.premarket_contract_signatures', 'user_id in (select id from _target_users)'),
      ('public.spot_trades', 'user_id in (select id from _target_users)'),
      ('public.spot_holdings', 'user_id in (select id from _target_users)'),
      ('public.orders', 'user_id in (select id from _target_users)'),
      ('public.positions', 'user_id in (select id from _target_users)'),
      ('public.transactions', 'user_id in (select id from _target_users) or lower(coalesce(user_email, '''')) like ''%hayk%'' or lower(coalesce(user_email, '''')) like ''%galstyan%'' or lower(coalesce(user_name, '''')) like ''%hayk%galstyan%'''),
      ('public.clients', 'id in (select id from _target_clients)'),
      ('public.leads', 'id in (select id from _target_leads)'),
      ('public.users', 'id in (select id from _target_users)'),
      ('auth.users', 'id in (select id from _target_users) or lower(coalesce(email, '''')) like ''%hayk%'' or lower(coalesce(email, '''')) like ''%galstyan%'' or lower(coalesce(raw_user_meta_data->>''full_name'', '''')) like ''%hayk%galstyan%''')
    ) as x(table_name, condition)
  loop
    if to_regclass(r.table_name) is not null then
      execute format('delete from %s where %s', r.table_name, r.condition);
      get diagnostics n = row_count;
      insert into _deleted values (r.table_name, n);
    end if;
  end loop;
end $$;

select *
from _deleted
where deleted_rows > 0
order by table_name;
