-- ============================================================================
-- Migration: Company payments — TRAPAY deposit vertical
--
-- Adds the minimum company model the platform lacked (it is single-company,
-- but every payment setting/deposit is still scoped by company_id and resolved
-- server-side, never from client input), the per-company TRAPAY configuration,
-- provider-managed online deposits, an immutable financial ledger, the TRAPAY
-- webhook event log and a payment audit log.
--
-- Balance-affecting logic lives in credit_trapay_deposit(): a SECURITY DEFINER
-- RPC with FOR UPDATE row locking, mirroring the existing approve_deposit
-- pattern (status transition + balance credit + ledger row in ONE transaction,
-- exactly-once even under concurrent webhooks).
--
-- TRAPAY facts used here are ONLY the publicly documented sandbox payment
-- creation (POST {sandbox_base_url}/api/payments/create). Production base URL,
-- webhook signature scheme, provider status vocabulary and amount units are NOT
-- documented publicly — they are left unguessed and flagged
-- TRAPAY_DOCUMENTATION_REQUIRED in code and in the admin UI.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- updated_at trigger helper (exists on live DB since the early schema; created
-- here only if missing so this migration is self-sufficient on a fresh DB,
-- without clobbering the search_path-pinned live version).
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'set_updated_at') then
    create function public.set_updated_at() returns trigger
    language plpgsql as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- companies — minimal legal-entity model for the single active company.
-- ----------------------------------------------------------------------------
create table if not exists public.companies (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  legal_name          text,
  country             text,
  registration_number text,
  vat_number          text,
  legal_address       text,
  support_email       text,
  support_phone       text,
  website             text,
  base_currency       text not null default 'USD',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

insert into public.companies (name, base_currency)
select 'BullenHaus', 'USD'
where not exists (select 1 from public.companies);

alter table public.companies enable row level security;

drop policy if exists "companies_select_staff" on public.companies;
create policy "companies_select_staff" on public.companies
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'director', 'trade_admin', 'crm_admin', 'manager', 'agent'));

-- No client-facing write policies: company profile is edited server-side only.

-- Resolves the platform's current (single active) company server-side.
create or replace function public.get_current_company()
returns public.companies
language sql
security definer
stable
set search_path = public
as $$
  select * from public.companies order by created_at asc limit 1;
$$;

revoke execute on function public.get_current_company() from anon;

-- ----------------------------------------------------------------------------
-- company_payment_settings — per-company TRAPAY configuration.
-- RLS: deny-all for anon/authenticated (the secret column must never be
-- readable from the browser); every read/write goes through the service-role
-- API layer, which masks the secret in responses.
-- ----------------------------------------------------------------------------
create table if not exists public.company_payment_settings (
  id                      uuid primary key default gen_random_uuid(),
  company_id              uuid not null unique references public.companies(id) on delete cascade,
  provider                text not null default 'TRAPAY' check (provider = 'TRAPAY'),
  enabled                 boolean not null default false,
  environment             text not null default 'SANDBOX' check (environment in ('SANDBOX', 'PRODUCTION')),
  public_key              text,
  secret_encrypted        text,
  sandbox_base_url        text not null default 'https://demo.trapay.uk',
  production_base_url     text,
  card_enabled            boolean not null default false,
  bank_transfer_enabled   boolean not null default false,
  card_gateway_id         text,
  bank_transfer_gateway_id text,
  default_currency        text not null default 'USD',
  supported_currencies    text[] not null default '{USD}',
  minimum_deposit         numeric(18, 2) not null default 50 check (minimum_deposit > 0),
  maximum_deposit         numeric(18, 2) not null default 100000 check (maximum_deposit > 0),
  webhook_configured      boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  updated_by              uuid references public.users(id) on delete set null,
  constraint payment_settings_limits_order check (minimum_deposit <= maximum_deposit)
);

create trigger company_payment_settings_set_updated_at
  before update on public.company_payment_settings
  for each row execute function public.set_updated_at();

alter table public.company_payment_settings enable row level security;
-- Deliberately NO policies: anon/authenticated get nothing (deny-all).

-- ----------------------------------------------------------------------------
-- deposits — provider-managed online deposits (TRAPAY hosted checkout).
-- Distinct from public.transactions (the manual request/approval flow), which
-- keeps its own lifecycle untouched.
-- ----------------------------------------------------------------------------
create table if not exists public.deposits (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id),
  user_id             uuid not null references public.users(id) on delete cascade,
  order_id            text not null unique,
  provider            text not null default 'TRAPAY' check (provider = 'TRAPAY'),
  provider_payment_id text,
  method              text not null check (method in ('CARD', 'BANK_TRANSFER')),
  amount              numeric(18, 2) not null check (amount > 0),
  currency            text not null,
  status              text not null default 'CREATED'
                        check (status in ('CREATED', 'PROVIDER_CREATE_PENDING', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'CHARGEBACK')),
  checkout_url        text,
  provider_status     text,
  failure_reason      text,
  paid_source         text check (paid_source in ('WEBHOOK', 'MANUAL_ADMIN')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  paid_at             timestamptz,
  failed_at           timestamptz
);

create trigger deposits_set_updated_at
  before update on public.deposits
  for each row execute function public.set_updated_at();

create index if not exists deposits_user_created_idx     on public.deposits (user_id, created_at desc);
create index if not exists deposits_company_created_idx  on public.deposits (company_id, created_at desc);
create index if not exists deposits_status_idx           on public.deposits (status);
create index if not exists deposits_provider_payment_idx on public.deposits (provider_payment_id) where provider_payment_id is not null;

-- Hard server-side double-click / rapid-retry guard: at most one active
-- online deposit per user at any moment. PROVIDER_CREATE_PENDING counts as
-- active on purpose: a provider call with unknown outcome may still have
-- created a real payment, so a retry must never spawn a duplicate.
create unique index if not exists deposits_one_active_per_user_idx
  on public.deposits (user_id)
  where status in ('CREATED', 'PROVIDER_CREATE_PENDING', 'PENDING', 'PROCESSING');

alter table public.deposits enable row level security;

drop policy if exists "deposits_select_own" on public.deposits;
create policy "deposits_select_own" on public.deposits
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.get_my_role() in ('admin', 'director', 'trade_admin', 'crm_admin')
  );
-- No insert/update/delete policies: deposits are created and transitioned only
-- by the trusted service-role API path.

-- ----------------------------------------------------------------------------
-- ledger_entries — immutable financial ledger. One CREDIT per deposit,
-- enforced by a partial unique index, so a balance credit can never happen
-- twice even if both the RPC guard and the caller fail.
-- ----------------------------------------------------------------------------
create table if not exists public.ledger_entries (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id),
  user_id     uuid not null references public.users(id) on delete cascade,
  deposit_id  uuid not null references public.deposits(id) on delete restrict,
  type        text not null default 'DEPOSIT' check (type = 'DEPOSIT'),
  direction   text not null check (direction in ('CREDIT', 'DEBIT')),
  amount      numeric(18, 2) not null check (amount > 0),
  currency    text not null,
  source      text not null check (source in ('WEBHOOK', 'MANUAL_ADMIN')),
  created_at  timestamptz not null default now()
);

create index if not exists ledger_entries_user_created_idx on public.ledger_entries (user_id, created_at desc);
create index if not exists ledger_entries_deposit_idx      on public.ledger_entries (deposit_id);

create unique index if not exists ledger_entries_one_credit_per_deposit_idx
  on public.ledger_entries (deposit_id)
  where direction = 'CREDIT';

alter table public.ledger_entries enable row level security;

drop policy if exists "ledger_entries_select_own" on public.ledger_entries;
create policy "ledger_entries_select_own" on public.ledger_entries
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.get_my_role() in ('admin', 'director', 'trade_admin', 'crm_admin')
  );
-- Immutable: no update/delete policies for anyone except service role.

-- ----------------------------------------------------------------------------
-- trapay_events — raw provider webhook event log with idempotency.
-- fingerprint: deterministic hash over the provider payment id, reported
-- status and raw payload; UNIQUE, so provider retries/replays store once.
-- verified stays false until the real webhook verification specification
-- (TRAPAY_DOCUMENTATION_REQUIRED) is provided and implemented.
-- ----------------------------------------------------------------------------
create table if not exists public.trapay_events (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid references public.companies(id),
  deposit_id          uuid references public.deposits(id) on delete set null,
  provider_event_id   text,
  fingerprint         text not null unique,
  event_type          text,
  provider_status     text,
  payload             jsonb,
  verified            boolean not null default false,
  processed           boolean not null default false,
  received_at         timestamptz not null default now(),
  processed_at        timestamptz,
  error               text
);

create index if not exists trapay_events_deposit_idx on public.trapay_events (deposit_id) where deposit_id is not null;
create index if not exists trapay_events_received_idx on public.trapay_events (received_at desc);
create unique index if not exists trapay_events_provider_event_uniq
  on public.trapay_events (provider_event_id) where provider_event_id is not null;

alter table public.trapay_events enable row level security;

drop policy if exists "trapay_events_select_staff" on public.trapay_events;
create policy "trapay_events_select_staff" on public.trapay_events
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'director', 'trade_admin', 'crm_admin'));

-- ----------------------------------------------------------------------------
-- company_payment_audit — append-only audit for payment configuration changes
-- and manual financial actions. No secret values are ever written here.
-- ----------------------------------------------------------------------------
create table if not exists public.company_payment_audit (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references public.companies(id) on delete set null,
  admin_id    uuid references public.users(id) on delete set null,
  action      text not null,
  field_name  text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists company_payment_audit_company_created_idx
  on public.company_payment_audit (company_id, created_at desc);

alter table public.company_payment_audit enable row level security;

drop policy if exists "company_payment_audit_select_staff" on public.company_payment_audit;
create policy "company_payment_audit_select_staff" on public.company_payment_audit
  for select
  to authenticated
  using (public.get_my_role() in ('admin', 'director', 'trade_admin', 'crm_admin'));
-- No insert/update/delete policies: written by the service-role API path only.

-- ----------------------------------------------------------------------------
-- credit_trapay_deposit — the ONLY path that turns a TRAPAY deposit into a
-- balance credit. SECURITY DEFINER, single transaction, row-locked, idempotent.
--
-- Steps (all-or-nothing):
--   1. Lock the deposit row (concurrent webhook/manual calls serialize here).
--   2. Re-verify expected amount + currency (mismatch = security error, no
--      credit).
--   3. Already PAID -> no-op success (idempotent redelivery).
--   4. Status must be PENDING/PROCESSING.
--   5. deposit -> PAID, users.balance += amount, ledger CREDIT (partial unique
--      index is the last-resort exactly-once guarantee), user notification,
--      audit entry.
-- Callable by service_role only (the API layer authenticates callers first).
-- ----------------------------------------------------------------------------
create or replace function public.credit_trapay_deposit(
  p_deposit_id       uuid,
  p_expected_amount  numeric,
  p_expected_currency text,
  p_source           text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deposit public.deposits%rowtype;
  v_balance numeric;
begin
  if p_source not in ('WEBHOOK', 'MANUAL_ADMIN') then
    return jsonb_build_object('ok', false, 'error', 'invalid_source');
  end if;

  select * into v_deposit
  from public.deposits
  where id = p_deposit_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  -- Security guard: the credited amount/currency must match what BullenHaus
  -- recorded at creation time. Any drift means the provider event does not
  -- correspond to this deposit — never credit.
  if p_expected_amount is null or p_expected_currency is null
     or v_deposit.amount <> p_expected_amount
     or upper(v_deposit.currency) <> upper(p_expected_currency) then
    return jsonb_build_object('ok', false, 'error', 'amount_mismatch',
      'deposit_amount', v_deposit.amount, 'deposit_currency', v_deposit.currency);
  end if;

  -- Idempotency guard: redelivery of an already-credited deposit.
  if v_deposit.status = 'PAID' then
    return jsonb_build_object('ok', true, 'already_paid', true, 'deposit_id', v_deposit.id);
  end if;

  -- PROVIDER_CREATE_PENDING is creditable: a verified provider settlement for
  -- such a deposit proves the provider DID create and complete the payment
  -- even though our create-call outcome was unknown.
  if v_deposit.status not in ('PENDING', 'PROCESSING', 'PROVIDER_CREATE_PENDING') then
    return jsonb_build_object('ok', false, 'error', 'invalid_state', 'status', v_deposit.status);
  end if;

  update public.deposits
    set status = 'PAID', paid_at = now(), paid_source = p_source, failure_reason = null
    where id = v_deposit.id;

  update public.users
    set balance = balance + v_deposit.amount
    where id = v_deposit.user_id
    returning balance into v_balance;

  insert into public.ledger_entries (company_id, user_id, deposit_id, direction, amount, currency, source)
    values (v_deposit.company_id, v_deposit.user_id, v_deposit.id, 'CREDIT', v_deposit.amount, v_deposit.currency, p_source);

  insert into public.notifications (user_id, type, title, message, data)
    values (
      v_deposit.user_id,
      'deposit',
      'Deposit completed',
      format('Your deposit of %s %s has been credited to your account.', to_char(v_deposit.amount, 'FM9999999999999990.00'), v_deposit.currency),
      jsonb_build_object('deposit_id', v_deposit.id, 'order_id', v_deposit.order_id, 'amount', v_deposit.amount, 'currency', v_deposit.currency, 'method', v_deposit.method)
    );

  insert into public.company_payment_audit (company_id, admin_id, action, field_name, details)
    values (
      v_deposit.company_id,
      null,
      case when p_source = 'WEBHOOK' then 'DEPOSIT_CREDITED_WEBHOOK' else 'DEPOSIT_CREDITED_MANUAL' end,
      'deposits.status',
      jsonb_build_object('deposit_id', v_deposit.id, 'order_id', v_deposit.order_id, 'amount', v_deposit.amount, 'currency', v_deposit.currency, 'user_id', v_deposit.user_id)
    );

  return jsonb_build_object('ok', true, 'deposit_id', v_deposit.id, 'balance', v_balance);
end;
$$;

revoke execute on function public.credit_trapay_deposit(uuid, numeric, text, text) from public, anon, authenticated;
grant execute on function public.credit_trapay_deposit(uuid, numeric, text, text) to service_role;

notify pgrst, 'reload schema';
