-- ── 08: Advertisers, referral codes, and user attribution ─────────────────────

-- ── 1. Add attribution columns to users ──────────────────────────────────────
alter table public.users
  add column if not exists referral_code text,
  add column if not exists attribution   jsonb;

create index if not exists users_referral_code_idx
  on public.users(referral_code)
  where referral_code is not null;

-- ── 2. Advertisers ────────────────────────────────────────────────────────────
create table if not exists public.advertisers (
  id          uuid        default gen_random_uuid() primary key,
  name        text        not null,
  description text,
  is_active   boolean     default true not null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

alter table public.advertisers enable row level security;

create policy "advertisers_crm_admin"
  on public.advertisers for all
  using  (public.get_my_role() in ('admin', 'director', 'trade_admin'))
  with check (public.get_my_role() in ('admin', 'director', 'trade_admin'));

-- ── 3. Referral codes ─────────────────────────────────────────────────────────
create table if not exists public.referral_codes (
  id             uuid        default gen_random_uuid() primary key,
  code           text        not null unique,
  advertiser_id  uuid        not null references public.advertisers(id) on delete cascade,
  campaign_name  text,
  created_at     timestamptz default now() not null
);

create index if not exists referral_codes_advertiser_idx
  on public.referral_codes(advertiser_id);

create index if not exists referral_codes_code_idx
  on public.referral_codes(code);

alter table public.referral_codes enable row level security;

-- Admin/director/trade_admin — full access
create policy "referral_codes_crm_admin"
  on public.referral_codes for all
  using  (public.get_my_role() in ('admin', 'director', 'trade_admin'))
  with check (public.get_my_role() in ('admin', 'director', 'trade_admin'));

-- Authenticated users can read codes (needed to validate ref= param at registration)
create policy "referral_codes_authenticated_read"
  on public.referral_codes for select
  using (auth.uid() is not null);
