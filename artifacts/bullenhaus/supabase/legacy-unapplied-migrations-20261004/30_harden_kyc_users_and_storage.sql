-- Migration 30: Harden KYC user updates and storage setup

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "kyc_select_admin" on storage.objects;

create policy "kyc_select_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'kyc-documents'
    and public.get_my_role() in ('admin', 'trade_admin', 'crm_admin', 'manager', 'director')
  );

create or replace function public.prevent_unsafe_self_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if auth.uid() is null then
    return new;
  end if;

  actor_role := public.get_my_role();
  if actor_role in ('admin', 'trade_admin', 'crm_admin') then
    return new;
  end if;

  if old.id = auth.uid() and new.id = old.id then
    if new.role is distinct from old.role
      or new.balance is distinct from old.balance
      or new.realized_pnl is distinct from old.realized_pnl
      or new.margin_used is distinct from old.margin_used
      or new.assigned_agent_id is distinct from old.assigned_agent_id
      or new.referral_code is distinct from old.referral_code
    then
      raise exception 'Self update of protected user fields is not allowed';
    end if;

    if new.kyc_status is distinct from old.kyc_status and new.kyc_status <> 'PENDING' then
      raise exception 'Self update of kyc_status is limited to PENDING submissions';
    end if;

    if new.kyc_documents is distinct from old.kyc_documents and new.kyc_status <> 'PENDING' then
      raise exception 'Self update of kyc_documents must submit KYC for review';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists users_prevent_unsafe_self_update on public.users;

create trigger users_prevent_unsafe_self_update
  before update on public.users
  for each row
  execute function public.prevent_unsafe_self_user_update();
