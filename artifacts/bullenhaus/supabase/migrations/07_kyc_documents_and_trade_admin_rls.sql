-- ============================================================
-- Migration 07: KYC documents column + trade_admin RLS + Storage policies
--
-- Fixes three gaps found during audit:
--   1. kyc_documents JSONB column was missing from schema
--   2. trade_admin role not recognised by any RLS policy
--   3. No Storage bucket policies for kyc-documents
-- ============================================================


-- ============================================================
-- 1. ADD kyc_documents COLUMN (idempotent)
-- ============================================================

alter table public.users
  add column if not exists kyc_documents jsonb default '[]'::jsonb;


-- ============================================================
-- 2. EXTEND role CHECK constraint to include trade_admin
--    Drop old constraint, add new one that covers all 6 roles
-- ============================================================

alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
    check (role in ('client', 'agent', 'manager', 'director', 'admin', 'trade_admin'));


-- ============================================================
-- 3. UPDATE users-table RLS policies to include trade_admin
--    Must DROP+RECREATE because ALTER POLICY cannot change USING
-- ============================================================

-- SELECT: admin / trade_admin / manager can read all user rows
drop policy if exists "users_select_admin_manager" on public.users;
create policy "users_select_admin_manager"
  on public.users for select
  using (get_my_role() in ('admin', 'trade_admin', 'manager'));

-- UPDATE: admin and trade_admin can update any user
drop policy if exists "users_update_admin" on public.users;
create policy "users_update_admin"
  on public.users for update
  using (get_my_role() in ('admin', 'trade_admin'));


-- ============================================================
-- 4. UPDATE transactions RLS policies to include trade_admin
-- ============================================================

-- SELECT
drop policy if exists "transactions_select_admin_manager" on public.transactions;
create policy "transactions_select_admin_manager"
  on public.transactions for select
  using (get_my_role() in ('admin', 'trade_admin', 'manager'));

-- INSERT
drop policy if exists "transactions_insert_admin" on public.transactions;
create policy "transactions_insert_admin"
  on public.transactions for insert
  with check (get_my_role() in ('admin', 'trade_admin'));

-- UPDATE
drop policy if exists "transactions_update_admin" on public.transactions;
create policy "transactions_update_admin"
  on public.transactions for update
  using (get_my_role() in ('admin', 'trade_admin'));


-- ============================================================
-- 5. STORAGE RLS — kyc-documents bucket
--
--    Policies on storage.objects control who can upload/read
--    files. The bucket must already exist (created via Dashboard).
--    name = file path inside the bucket, e.g. "{user_id}/passport_xxx.jpg"
-- ============================================================

-- Clients can upload their own documents
--   path format: {user_id}/{doc_type}_{timestamp}.{ext}
--   so name starts with auth.uid()::text
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'kyc_upload_own'
  ) then
    create policy "kyc_upload_own"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'kyc-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

-- Clients can view their own uploaded documents
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'kyc_select_own'
  ) then
    create policy "kyc_select_own"
      on storage.objects for select
      to authenticated
      using (
        bucket_id = 'kyc-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

-- Admins and trade_admins can read all documents (needed for createSignedUrl)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'kyc_select_admin'
  ) then
    create policy "kyc_select_admin"
      on storage.objects for select
      to authenticated
      using (
        bucket_id = 'kyc-documents'
        and public.get_my_role() in ('admin', 'trade_admin')
      );
  end if;
end $$;

-- Admins and trade_admins can delete documents (e.g. after rejection)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'kyc_delete_admin'
  ) then
    create policy "kyc_delete_admin"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'kyc-documents'
        and public.get_my_role() in ('admin', 'trade_admin')
      );
  end if;
end $$;
