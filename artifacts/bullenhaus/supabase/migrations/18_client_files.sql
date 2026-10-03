-- ============================================================
-- Migration 08: Client file attachments (CRM)
--
-- Adds the ability for senior CRM staff to attach files to a
-- client (a public.users row with role = 'client').
--
-- Authorization model (role-based, enforced in the DATABASE):
--   Allowed roles : superadmin, admin, director, manager
--   Excluded      : agent, client, trade_admin (see notes below)
--
-- NOTE on 'superadmin':
--   'superadmin' is NOT part of the current users_role_check
--   constraint, so such a row cannot exist yet. It is included in
--   every allow-list below for forward-compatibility only. If the
--   role is ever introduced, the constraint must be widened in a
--   separate migration first.
--
-- NOTE on 'trade_admin':
--   'trade_admin' exists in the schema (migration 07) and is an
--   admin-tier role, but it is intentionally EXCLUDED here because
--   the feature spec restricts access to exactly the four roles
--   above. Revisit with the team if trade_admin should be granted.
--
-- Storage:
--   Private bucket 'client-files'. Object path = "{client_id}/{file}".
--   Bucket-level mime + size limits act as a first line of defense.
-- ============================================================


-- ============================================================
-- 1. TABLE: public.client_files
-- ============================================================

create table if not exists public.client_files (
  id            uuid primary key default gen_random_uuid(),
  -- The CRM client this file is attached to. The live CRM UI treats
  -- a "client" as a public.users row with role = 'client', so the FK
  -- targets public.users (not public.clients).
  client_id     uuid not null references public.users(id) on delete cascade,
  file_name     text not null,
  storage_path  text not null unique,
  content_type  text,
  size_bytes    bigint,
  uploaded_by   uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists client_files_client_id_idx  on public.client_files(client_id);
create index if not exists client_files_created_at_idx on public.client_files(created_at desc);

-- Reuse the existing set_updated_at() trigger function (migration 01/02).
drop trigger if exists client_files_set_updated_at on public.client_files;
create trigger client_files_set_updated_at
  before update on public.client_files
  for each row execute function public.set_updated_at();


-- ============================================================
-- 2. ROW LEVEL SECURITY: public.client_files
--    Only superadmin / admin / director / manager may read,
--    create, or delete client file records.
-- ============================================================

alter table public.client_files enable row level security;

drop policy if exists "client_files_select_staff" on public.client_files;
create policy "client_files_select_staff"
  on public.client_files for select
  using (public.get_my_role() in ('superadmin', 'admin', 'director', 'manager'));

drop policy if exists "client_files_insert_staff" on public.client_files;
create policy "client_files_insert_staff"
  on public.client_files for insert
  with check (public.get_my_role() in ('superadmin', 'admin', 'director', 'manager'));

drop policy if exists "client_files_delete_staff" on public.client_files;
create policy "client_files_delete_staff"
  on public.client_files for delete
  using (public.get_my_role() in ('superadmin', 'admin', 'director', 'manager'));


-- ============================================================
-- 3. STORAGE BUCKET: client-files (private)
--    file_size_limit and allowed_mime_types provide bucket-level
--    validation in addition to app-level checks.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-files',
  'client-files',
  false,
  15728640, -- 15 MB
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
-- 4. STORAGE RLS — storage.objects for bucket 'client-files'
--    Mirrors the table policies: only the four allowed roles.
--    name = "{client_id}/{filename}", folder[1] = client_id.
-- ============================================================

-- Upload (insert)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'client_files_upload_staff'
  ) then
    create policy "client_files_upload_staff"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'client-files'
        and public.get_my_role() in ('superadmin', 'admin', 'director', 'manager')
      );
  end if;
end $$;

-- Read (select) — required for createSignedUrl
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'client_files_select_staff'
  ) then
    create policy "client_files_select_staff"
      on storage.objects for select
      to authenticated
      using (
        bucket_id = 'client-files'
        and public.get_my_role() in ('superadmin', 'admin', 'director', 'manager')
      );
  end if;
end $$;

-- Delete
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'client_files_delete_staff'
  ) then
    create policy "client_files_delete_staff"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'client-files'
        and public.get_my_role() in ('superadmin', 'admin', 'director', 'manager')
      );
  end if;
end $$;
