-- ============================================================
-- Migration 04: Диагностика и исправление доступа CRM работников
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ШАГ 1: Посмотри что есть в auth.users (CRM аккаунты)
-- Эта таблица должна показать всех созданных пользователей
select
  au.email,
  au.email_confirmed_at is not null as email_confirmed,
  au.raw_user_meta_data->>'role'      as meta_role,
  au.raw_user_meta_data->>'full_name' as meta_name,
  pu.role  as db_role,
  pu.id is not null as has_public_users_row
from auth.users au
left join public.users pu on pu.id = au.id
order by au.created_at desc
limit 30;

-- ============================================================
-- ШАГ 2: Автоматически создать/обновить записи в public.users
-- для ВСЕХ CRM работников что есть в auth.users
-- ============================================================

insert into public.users (id, email, full_name, display_name, role, kyc_status)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
  coalesce(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as display_name,
  coalesce(au.raw_user_meta_data->>'role', 'agent')                            as role,
  'VERIFIED'
from auth.users au
where
  -- Только те у кого роль в metadata = CRM роль
  au.raw_user_meta_data->>'role' in ('agent', 'manager', 'director', 'admin')
  -- И нет записи в public.users
  and not exists (select 1 from public.users pu where pu.id = au.id)
on conflict (id) do update set
  role         = excluded.role,
  kyc_status   = 'VERIFIED',
  updated_at   = now();

-- ============================================================
-- ШАГ 3: Подтвердить email всем пользователям (если ещё не сделал)
-- ============================================================

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

-- ============================================================
-- ШАГ 4: Финальная проверка — должны видеть все CRM работники
-- с правильными ролями
-- ============================================================

select
  pu.email,
  pu.role,
  pu.kyc_status,
  au.email_confirmed_at is not null as email_confirmed
from public.users pu
join auth.users au on au.id = pu.id
where pu.role in ('agent', 'manager', 'director', 'admin')
order by
  case pu.role
    when 'admin'    then 1
    when 'director' then 2
    when 'manager'  then 3
    when 'agent'    then 4
  end,
  pu.email;
