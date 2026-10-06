-- ============================================================
-- Migration 25: CRM production compatibility indexes
--
-- Adds the legacy workflows."trigger" column expected by the CRM UI
-- and creates indexes only for columns that exist in the live schema.
-- ============================================================

do $$
begin
  if to_regclass('public.workflows') is not null then
    alter table public.workflows
      add column if not exists "trigger" text;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'workflows'
        and column_name = 'trigger_type'
    ) then
      update public.workflows
      set "trigger" = coalesce("trigger", trigger_type)
      where "trigger" is null;

      update public.workflows
      set trigger_type = coalesce(trigger_type, "trigger")
      where trigger_type is null;
    end if;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.users') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'role'
    ) then
      create index if not exists idx_users_role on public.users(role);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'kyc_status'
    ) then
      create index if not exists idx_users_kyc_status on public.users(kyc_status);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'created_at'
    ) then
      create index if not exists idx_users_created_at on public.users(created_at desc);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'role'
    ) and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'created_at'
    ) then
      create index if not exists idx_users_role_created_at on public.users(role, created_at desc);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'assigned_agent_id'
    ) then
      create index if not exists idx_users_assigned_agent_id on public.users(assigned_agent_id);
    end if;
  end if;

  if to_regclass('public.leads') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'leads' and column_name = 'stage'
    ) and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'leads' and column_name = 'created_at'
    ) then
      create index if not exists idx_leads_stage_created_at on public.leads(stage, created_at desc);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'leads' and column_name = 'assigned_agent_id'
    ) then
      create index if not exists idx_leads_assigned_agent_id on public.leads(assigned_agent_id);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'leads' and column_name = 'email'
    ) then
      create index if not exists idx_leads_email on public.leads(email);
    end if;
  end if;
end
$$;

notify pgrst, 'reload schema';
