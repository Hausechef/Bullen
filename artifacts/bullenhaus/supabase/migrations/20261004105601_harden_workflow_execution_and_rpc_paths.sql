-- Close the remaining Security Advisor findings without changing records.

begin;

-- Workflow execution is a privileged manual CRM action. An authenticated user
-- may only record their own execution and only if they hold a workflow-owner
-- role. The referenced workflow must exist as enforced by the foreign key.
drop policy if exists "system_insert_executions" on public.workflow_executions;
create policy "workflow_owners_insert_executions"
  on public.workflow_executions
  for insert
  to authenticated
  with check (
    triggered_by = (select auth.uid())
    and exists (
      select 1
      from public.users staff
      where staff.id = (select auth.uid())
        and staff.role in ('admin', 'crm_admin', 'director')
    )
  );

-- The function uses public objects by unqualified name. Pin resolution so a
-- caller's role/session search_path cannot affect a SECURITY DEFINER call.
alter function public.sign_premarket_asset_contract(uuid)
  set search_path = pg_catalog, public;

commit;
