-- SELECT-only audit for Hayk Galstyan.
-- No temp tables, no transaction, no DML.

with
target_users as (
  select id
  from public.users
  where
    lower(coalesce(email, '')) like '%hayk%'
    or lower(coalesce(email, '')) like '%galstyan%'
    or lower(coalesce(full_name, '')) like '%hayk%galstyan%'
    or lower(coalesce(display_name, '')) like '%hayk%galstyan%'
    or lower(coalesce(username, '')) like '%hayk%galstyan%'
    or lower(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) like '%hayk%galstyan%'
),
target_leads as (
  select id
  from public.leads
  where
    lower(coalesce(email, '')) like '%hayk%'
    or lower(coalesce(email, '')) like '%galstyan%'
    or lower(coalesce(name, '')) like '%hayk%galstyan%'
    or lower(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) like '%hayk%galstyan%'
),
target_clients as (
  select id
  from public.clients
  where
    user_id in (select id from target_users)
    or lower(coalesce(email, '')) like '%hayk%'
    or lower(coalesce(email, '')) like '%galstyan%'
    or lower(coalesce(full_name, '')) like '%hayk%galstyan%'
),
expanded_users as (
  select id from target_users
  union
  select user_id from public.clients where id in (select id from target_clients) and user_id is not null
)
select 'public.users' as table_name, count(*) as matched_rows from expanded_users
union all select 'auth.users', count(*) from auth.users where id in (select id from expanded_users) or lower(coalesce(email, '')) like '%hayk%' or lower(coalesce(email, '')) like '%galstyan%' or lower(coalesce(raw_user_meta_data->>'full_name', '')) like '%hayk%galstyan%'
union all select 'public.leads', count(*) from target_leads
union all select 'public.clients', count(*) from target_clients
union all select 'public.transactions', count(*) from public.transactions where user_id in (select id from expanded_users) or lower(coalesce(user_email, '')) like '%hayk%' or lower(coalesce(user_email, '')) like '%galstyan%' or lower(coalesce(user_name, '')) like '%hayk%galstyan%'
union all select 'public.positions', count(*) from public.positions where user_id in (select id from expanded_users)
union all select 'public.orders', count(*) from public.orders where user_id in (select id from expanded_users)
union all select 'public.spot_holdings', count(*) from public.spot_holdings where user_id in (select id from expanded_users)
union all select 'public.spot_trades', count(*) from public.spot_trades where user_id in (select id from expanded_users)
union all select 'public.premarket_contract_signatures', count(*) from public.premarket_contract_signatures where user_id in (select id from expanded_users)
union all select 'public.premarket_asset_signatures', count(*) from public.premarket_asset_signatures where user_id in (select id from expanded_users)
union all select 'public.kyc_reviews', count(*) from public.kyc_reviews where user_id in (select id from expanded_users)
union all select 'public.notifications', count(*) from public.notifications where user_id in (select id from expanded_users)
union all select 'public.support_tickets', count(*) from public.support_tickets where client_id in (select id from expanded_users) or lower(coalesce(contact_email, '')) like '%hayk%' or lower(coalesce(contact_email, '')) like '%galstyan%'
union all select 'public.messages', count(*) from public.messages where client_id in (select id from expanded_users)
union all select 'public.client_files', count(*) from public.client_files where client_id in (select id from expanded_users) or uploaded_by in (select id from expanded_users)
union all select 'public.call_logs', count(*) from public.call_logs where client_id in (select id from expanded_users)
union all select 'public.tasks', count(*) from public.tasks where client_id in (select id from expanded_users) or lead_id in (select id from target_leads)
union all select 'public.lead_stage_history', count(*) from public.lead_stage_history where lead_id in (select id from target_leads)
union all select 'public.lead_assignment_log', count(*) from public.lead_assignment_log where lead_id in (select id from target_leads)
union all select 'storage.objects', count(*) from storage.objects where bucket_id in ('client-files', 'kyc-documents', 'premarket-contracts') and exists (select 1 from expanded_users eu where name like eu.id::text || '/%')
order by table_name;

with
target_users as (
  select *
  from public.users
  where
    lower(coalesce(email, '')) like '%hayk%'
    or lower(coalesce(email, '')) like '%galstyan%'
    or lower(coalesce(full_name, '')) like '%hayk%galstyan%'
    or lower(coalesce(display_name, '')) like '%hayk%galstyan%'
    or lower(coalesce(username, '')) like '%hayk%galstyan%'
    or lower(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) like '%hayk%galstyan%'
)
select id, email, full_name, display_name, first_name, last_name, role, kyc_status, created_at
from target_users
order by created_at nulls last;

select id, email, name, first_name, last_name, stage, created_at
from public.leads
where
  lower(coalesce(email, '')) like '%hayk%'
  or lower(coalesce(email, '')) like '%galstyan%'
  or lower(coalesce(name, '')) like '%hayk%galstyan%'
  or lower(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) like '%hayk%galstyan%'
order by created_at nulls last;

select id, user_id, email, full_name, status, created_at
from public.clients
where
  lower(coalesce(email, '')) like '%hayk%'
  or lower(coalesce(email, '')) like '%galstyan%'
  or lower(coalesce(full_name, '')) like '%hayk%galstyan%'
order by created_at nulls last;
