-- Recovery is a first-class shared domain. It references the existing
-- Supabase identity/profile row; it does not introduce a second user store.

begin;

create table public.recovery_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique default ('BHR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  client_id uuid not null references public.users(id) on delete restrict,
  registration_id uuid references public.recovery_registrations(id) on delete set null,
  category text not null check (category in ('CRYPTO', 'FOREX_CFD', 'INVESTMENT_FRAUD', 'CARD_PHISHING', 'ROMANCE', 'OTHER')),
  status text not null default 'SUBMITTED' check (status in ('SUBMITTED', 'TRIAGE', 'INVESTIGATING', 'AWAITING_CLIENT', 'RESOLVED', 'CLOSED')),
  loss_range text not null,
  incident_date date,
  platform text,
  asset_type text,
  transaction_ref text,
  wallet_address text,
  description text not null check (char_length(description) between 50 and 5000),
  contact_email text,
  assigned_staff_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recovery_cases_client_idx on public.recovery_cases (client_id, updated_at desc);
create index recovery_cases_status_idx on public.recovery_cases (status, updated_at desc);
create index recovery_cases_assigned_staff_idx on public.recovery_cases (assigned_staff_id, updated_at desc);

create table public.recovery_case_timeline (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.recovery_cases(id) on delete cascade,
  author_id uuid references public.users(id) on delete set null,
  event_type text not null check (event_type in ('STATUS_CHANGE', 'NOTE', 'EVIDENCE', 'MESSAGE', 'SYSTEM')),
  title text not null check (char_length(title) between 3 and 140),
  body text,
  visibility text not null default 'CLIENT' check (visibility in ('CLIENT', 'INTERNAL')),
  created_at timestamptz not null default now()
);
create index recovery_case_timeline_case_idx on public.recovery_case_timeline (case_id, created_at);

create table public.recovery_case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.recovery_cases(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 4000),
  read_by_staff boolean not null default false,
  read_by_client boolean not null default false,
  created_at timestamptz not null default now()
);
create index recovery_case_messages_case_idx on public.recovery_case_messages (case_id, created_at);

create table public.recovery_case_evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.recovery_cases(id) on delete cascade,
  uploaded_by_id uuid not null references public.users(id) on delete restrict,
  bucket_id text not null default 'recovery-evidence' check (bucket_id = 'recovery-evidence'),
  object_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 200),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  note text,
  created_at timestamptz not null default now()
);
create index recovery_case_evidence_case_idx on public.recovery_case_evidence (case_id, created_at);

create or replace function public.recovery_case_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.recovery_case_create_submission_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.recovery_case_timeline (case_id, author_id, event_type, title, body, visibility)
  values (new.id, new.client_id, 'SYSTEM', 'Case submitted', 'The client submitted this case through the Recovery intake.', 'CLIENT');
  return new;
end;
$$;

revoke all on function public.recovery_case_create_submission_event() from public, anon, authenticated;

create trigger recovery_cases_set_updated_at
  before update on public.recovery_cases
  for each row execute function public.recovery_case_set_updated_at();
create trigger recovery_cases_create_submission_event
  after insert on public.recovery_cases
  for each row execute function public.recovery_case_create_submission_event();

alter table public.recovery_cases enable row level security;
alter table public.recovery_case_timeline enable row level security;
alter table public.recovery_case_messages enable row level security;
alter table public.recovery_case_evidence enable row level security;

-- Case access: owners see their own cases; authorised staff see all recovery
-- work. Client inserts are intentionally constrained to their own profile and
-- the initial SUBMITTED state.
create policy "recovery_cases_select_client_or_staff" on public.recovery_cases
  for select to authenticated
  using (
    client_id = (select auth.uid())
    or exists (select 1 from public.users staff where staff.id = (select auth.uid()) and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin'))
  );
create policy "recovery_cases_insert_client" on public.recovery_cases
  for insert to authenticated
  with check (client_id = (select auth.uid()) and status = 'SUBMITTED');
create policy "recovery_cases_update_staff" on public.recovery_cases
  for update to authenticated
  using (exists (select 1 from public.users staff where staff.id = (select auth.uid()) and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin')))
  with check (exists (select 1 from public.users staff where staff.id = (select auth.uid()) and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin')));

create policy "recovery_timeline_select_client_or_staff" on public.recovery_case_timeline
  for select to authenticated
  using (
    exists (select 1 from public.recovery_cases c where c.id = case_id and c.client_id = (select auth.uid()) and visibility = 'CLIENT')
    or exists (select 1 from public.users staff where staff.id = (select auth.uid()) and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin'))
  );
create policy "recovery_timeline_insert_staff" on public.recovery_case_timeline
  for insert to authenticated
  with check (exists (select 1 from public.users staff where staff.id = (select auth.uid()) and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin')));

create policy "recovery_messages_select_client_or_staff" on public.recovery_case_messages
  for select to authenticated
  using (
    exists (select 1 from public.recovery_cases c where c.id = case_id and c.client_id = (select auth.uid()))
    or exists (select 1 from public.users staff where staff.id = (select auth.uid()) and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin'))
  );
create policy "recovery_messages_insert_client_or_staff" on public.recovery_case_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (
      exists (select 1 from public.recovery_cases c where c.id = case_id and c.client_id = (select auth.uid()))
      or exists (select 1 from public.users staff where staff.id = (select auth.uid()) and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin'))
    )
  );

create policy "recovery_evidence_select_client_or_staff" on public.recovery_case_evidence
  for select to authenticated
  using (
    exists (select 1 from public.recovery_cases c where c.id = case_id and c.client_id = (select auth.uid()))
    or exists (select 1 from public.users staff where staff.id = (select auth.uid()) and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin'))
  );
create policy "recovery_evidence_insert_client_or_staff" on public.recovery_case_evidence
  for insert to authenticated
  with check (
    uploaded_by_id = (select auth.uid())
    and (
      exists (select 1 from public.recovery_cases c where c.id = case_id and c.client_id = (select auth.uid()))
      or exists (select 1 from public.users staff where staff.id = (select auth.uid()) and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin'))
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recovery-evidence',
  'recovery-evidence',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/csv', 'application/json']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "recovery_evidence_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recovery-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "recovery_evidence_storage_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'recovery-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "recovery_evidence_storage_select_staff" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'recovery-evidence'
    and exists (select 1 from public.users staff where staff.id = (select auth.uid()) and staff.role in ('agent', 'manager', 'director', 'admin', 'crm_admin'))
  );

commit;
