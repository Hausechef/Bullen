-- ============================================================
-- Migration 24: Workflows table for Automation / Workflow Rules
--
-- Creates public.workflows only when no equivalent workflow table exists.
-- Existing candidates checked: public.workflows, public.workflow_rules,
-- public.automation_rules, public.crm_workflows.
-- ============================================================

do $$
begin
  if to_regclass('public.workflows') is null
     and to_regclass('public.workflow_rules') is null
     and to_regclass('public.automation_rules') is null
     and to_regclass('public.crm_workflows') is null then
    create table public.workflows (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      description text,
      status text not null default 'disabled'
        check (status in ('active', 'disabled', 'draft')),
      trigger_type text,
      trigger_config jsonb not null default '{}'::jsonb,
      conditions jsonb not null default '{}'::jsonb,
      actions jsonb not null default '[]'::jsonb,
      created_by uuid,
      workspace_id uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  end if;
end
$$;

do $$
begin
  if to_regclass('public.workflows') is not null then
    create index if not exists idx_workflows_status
      on public.workflows(status);

    create index if not exists idx_workflows_workspace_id
      on public.workflows(workspace_id);

    create index if not exists idx_workflows_created_by
      on public.workflows(created_by);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.users') is not null
     and to_regclass('public.workflows') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'workflows_created_by_fkey'
         and conrelid = to_regclass('public.workflows')
     ) then
    alter table public.workflows
      add constraint workflows_created_by_fkey
      foreign key (created_by)
      references public.users(id)
      on delete set null;
  end if;

  if to_regclass('public.workspaces') is not null
     and to_regclass('public.workflows') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'workflows_workspace_id_fkey'
         and conrelid = to_regclass('public.workflows')
     ) then
    alter table public.workflows
      add constraint workflows_workspace_id_fkey
      foreign key (workspace_id)
      references public.workspaces(id)
      on delete cascade;
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.workflows') is not null then
    drop trigger if exists trg_workflows_updated_at on public.workflows;

    create trigger trg_workflows_updated_at
      before update on public.workflows
      for each row
      execute function public.set_updated_at();

    alter table public.workflows enable row level security;

    drop policy if exists "workflows_select_admin_crm_admin" on public.workflows;
    create policy "workflows_select_admin_crm_admin"
      on public.workflows for select
      to authenticated
      using (public.get_my_role() in ('admin', 'crm_admin'));

    drop policy if exists "workflows_insert_admin_crm_admin" on public.workflows;
    create policy "workflows_insert_admin_crm_admin"
      on public.workflows for insert
      to authenticated
      with check (public.get_my_role() in ('admin', 'crm_admin'));

    drop policy if exists "workflows_update_admin_crm_admin" on public.workflows;
    create policy "workflows_update_admin_crm_admin"
      on public.workflows for update
      to authenticated
      using (public.get_my_role() in ('admin', 'crm_admin'))
      with check (public.get_my_role() in ('admin', 'crm_admin'));

    drop policy if exists "workflows_delete_admin_crm_admin" on public.workflows;
    create policy "workflows_delete_admin_crm_admin"
      on public.workflows for delete
      to authenticated
      using (public.get_my_role() in ('admin', 'crm_admin'));
  end if;
end
$$;

notify pgrst, 'reload schema';
