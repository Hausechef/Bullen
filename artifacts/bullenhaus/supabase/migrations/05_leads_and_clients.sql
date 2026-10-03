-- ── leads table ──────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id                uuid default gen_random_uuid() primary key,
  name              text,
  first_name        text,
  last_name         text,
  email             text,
  phone             text,
  stage             text not null default 'NEW_INQUIRY'
                      check (stage in ('NEW_INQUIRY','IN_DISCUSSION','PENDING_KYC','FUNDED')),
  capacity          text,
  timezone          text,
  notes             text,
  acquisition_source jsonb default '{}',
  assigned_agent_id  uuid references public.users(id) on delete set null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists leads_stage_idx             on public.leads(stage);
create index if not exists leads_assigned_agent_idx    on public.leads(assigned_agent_id);
create index if not exists leads_created_at_idx        on public.leads(created_at desc);

-- ── clients table ─────────────────────────────────────────────────────────────
create table if not exists public.clients (
  id                uuid default gen_random_uuid() primary key,
  full_name         text,
  email             text,
  phone             text,
  country           text,
  balance           numeric(16,2) default 0,
  kyc_status        text default 'PENDING'
                      check (kyc_status in ('PENDING','VERIFIED','REJECTED')),
  assigned_agent_id  uuid references public.users(id) on delete set null,
  user_id           uuid references public.users(id) on delete set null,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists clients_assigned_agent_idx  on public.clients(assigned_agent_id);
create index if not exists clients_created_at_idx      on public.clients(created_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.leads   enable row level security;
alter table public.clients enable row level security;

-- CRM workers (agent/manager/director/admin) can read all leads
create policy "CRM workers can view leads"
  on public.leads for select
  using (
    (select role from public.users where id = auth.uid())
      in ('agent','manager','director','admin')
  );

create policy "CRM workers can insert leads"
  on public.leads for insert
  with check (
    (select role from public.users where id = auth.uid())
      in ('agent','manager','director','admin')
  );

create policy "CRM workers can update leads"
  on public.leads for update
  using (
    (select role from public.users where id = auth.uid())
      in ('agent','manager','director','admin')
  );

-- CRM workers can read all clients
create policy "CRM workers can view clients"
  on public.clients for select
  using (
    (select role from public.users where id = auth.uid())
      in ('agent','manager','director','admin')
  );

create policy "CRM workers can insert clients"
  on public.clients for insert
  with check (
    (select role from public.users where id = auth.uid())
      in ('agent','manager','director','admin')
  );

create policy "CRM workers can update clients"
  on public.clients for update
  using (
    (select role from public.users where id = auth.uid())
      in ('agent','manager','director','admin')
  );
