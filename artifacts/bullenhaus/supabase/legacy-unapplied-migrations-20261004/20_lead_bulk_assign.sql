-- ============================================================
-- Migration 20: Bulk lead assignment (RPC + audit log)
--
-- Adds:
--   * public.lead_assignment_log  — audit of each assignment
--   * public.assign_leads_bulk()  — SECURITY DEFINER RPC that enforces
--     role (manager/director/admin) server-side, reassigns leads, writes
--     audit, and returns a partial-success JSON result.
--
-- Roles allowed: manager, director, admin, crm_admin (+super-admin fwd-compat).
-- Agent is intentionally excluded.
-- MVP scope: manager acts globally (no team model exists yet).
-- ============================================================

create table if not exists public.lead_assignment_log (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null,
  old_agent_id   uuid,
  new_agent_id   uuid,
  performed_by   uuid,
  performed_role text,
  source         text not null default 'bulk_assign',
  batch_id       uuid,
  performed_at   timestamptz not null default now()
);
create index if not exists lead_assignment_log_lead_idx  on public.lead_assignment_log(lead_id);
create index if not exists lead_assignment_log_batch_idx on public.lead_assignment_log(batch_id);

alter table public.lead_assignment_log enable row level security;
drop policy if exists "lal_select_staff" on public.lead_assignment_log;
create policy "lal_select_staff" on public.lead_assignment_log for select
  using (public.get_my_role() in ('manager','director','admin','crm_admin','super-admin','superadmin'));
-- No INSERT policy: rows are written only by the SECURITY DEFINER function.

create or replace function public.assign_leads_bulk(p_agent_id uuid, p_lead_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role      text;
  v_uid       uuid := auth.uid();
  v_batch     uuid := gen_random_uuid();
  v_requested int  := coalesce(array_length(p_lead_ids, 1), 0);
  v_assigned  int  := 0;
  v_skipped   jsonb;
  v_agent_ok  boolean;
  r           record;
begin
  v_role := public.get_my_role();
  if v_role is null or v_role not in ('manager','director','admin','crm_admin','super-admin','superadmin') then
    raise exception 'insufficient_privileges' using errcode = '42501';
  end if;
  if v_requested = 0 then
    raise exception 'empty_selection' using errcode = '22023';
  end if;
  if v_requested > 500 then
    raise exception 'limit_exceeded' using errcode = '22023';
  end if;

  select exists(select 1 from public.users u where u.id = p_agent_id and u.role = 'agent') into v_agent_ok;
  if not v_agent_ok then
    raise exception 'invalid_agent' using errcode = '22023';
  end if;

  for r in select l.id, l.assigned_agent_id from public.leads l where l.id = any(p_lead_ids) loop
    update public.leads set assigned_agent_id = p_agent_id, updated_at = now() where id = r.id;
    insert into public.lead_assignment_log(lead_id, old_agent_id, new_agent_id, performed_by, performed_role, source, batch_id)
      values (r.id, r.assigned_agent_id, p_agent_id, v_uid, v_role, 'bulk_assign', v_batch);
    v_assigned := v_assigned + 1;
  end loop;

  v_skipped := (
    select coalesce(jsonb_agg(jsonb_build_object('lead_id', x, 'reason', 'not_found')), '[]'::jsonb)
    from unnest(p_lead_ids) as x
    where not exists (select 1 from public.leads l where l.id = x)
  );

  return jsonb_build_object(
    'batch_id',  v_batch,
    'agent_id',  p_agent_id,
    'requested', v_requested,
    'assigned',  v_assigned,
    'skipped',   v_skipped,
    'summary',   jsonb_build_object('assigned', v_assigned, 'skipped', v_requested - v_assigned)
  );
end;
$$;

revoke execute on function public.assign_leads_bulk(uuid, uuid[]) from anon;
grant  execute on function public.assign_leads_bulk(uuid, uuid[]) to authenticated;
