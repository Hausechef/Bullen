-- ============================================================================
-- BullenHaus × TRAPAY — cloud DB verification script (production-safe).
--
-- Run against the CLOUD Supabase project (psql or Supabase SQL Editor):
--
--   psql "$SUPABASE_DB_URL" -f scripts/sql/verify_trapay_cloud.sql
--
-- The whole script is ONE plpgsql block executed as ONE transaction: every
-- fixture (extra company, deposit, credit) is rolled back when the block ends
-- — no data is created, changed or left behind, on success AND on failure.
--
-- Verifies:
--   1. exactly-once credit (sequential double call of credit_trapay_deposit)
--   2. amount/currency mismatch refusal (no credit)
--   3. refusal to credit a CANCELLED deposit
--   4. credit allowed from PROVIDER_CREATE_PENDING (unknown create outcome)
--   5. RLS company isolation: client sees only own deposits, cannot read
--      settings/events/audit, cannot insert or update deposits
--   6. credit_trapay_deposit not executable by anon/authenticated
--   7. parallel-credit recipe (two manual psql sessions) — see comment at the
--      bottom of this file.
--
-- Output: NOTICE lines "PASS <name>" / "FAIL <name>".
-- SUCCESS ends with error "ROLLBACK-ON-PURPOSE: verification completed
-- successfully" (the raise guarantees the rollback). Any FAIL also aborts.
-- ============================================================================

do $verify$
declare
  v_company uuid;
  v_user uuid;
  v_deposit uuid;
  v_deposit_b uuid;
  v_balance_before numeric;
  v_result jsonb;
  v_bool boolean;
  v_rows int := 0;
  v_credit_count int;
  v_5a boolean; v_5b boolean; v_5c boolean; v_5d boolean;
  v_5e boolean := false; v_5f boolean := false;
  r record;
begin
  -- Pre-flight: the TRAPAY migration must be applied first.
  if to_regclass('public.deposits') is null or to_regclass('public.company_payment_settings') is null
     or to_regclass('public.trapay_events') is null then
    raise exception 'TRAPAY migration (20261005120000) is not applied yet — apply it first';
  end if;

  create temp table _verify_assertions (name text, ok boolean)
    on commit drop;

  -- Current (real) company.
  select id into v_company from public.companies order by created_at asc limit 1;
  if v_company is null then
    raise exception 'FATAL: no company row exists — run the migration first';
  end if;

  -- Use an existing real user without an active online deposit. The fixture is
  -- rolled back, so their balance is never actually changed.
  select u.id into v_user
  from public.users u
  where not exists (
    select 1 from public.deposits d
    where d.user_id = u.id
      and d.status in ('CREATED', 'PROVIDER_CREATE_PENDING', 'PENDING', 'PROCESSING')
  )
  order by u.created_at asc
  limit 1;
  if v_user is null then
    raise exception 'FATAL: no user without an active deposit found for fixtures';
  end if;

  -- Ensure the fixture user's role allows the RLS checks below.
  update public.users set role = 'client' where id = v_user;

  select balance into v_balance_before from public.users where id = v_user;

  -- ------------------------------------------------------------------ test 1
  -- Exactly-once credit: second call must be refused, only one ledger CREDIT,
  -- balance increased exactly once.
  insert into public.deposits (company_id, user_id, order_id, method, amount, currency, status)
  values (v_company, v_user, 'VERIFY-RACE-1', 'CARD', 100.00, 'USD', 'PENDING')
  returning id into v_deposit;

  select public.credit_trapay_deposit(v_deposit, 100.00, 'USD', 'WEBHOOK') into v_result;
  insert into _verify_assertions
  select '1a first credit ok', (v_result->>'ok')::boolean;

  select public.credit_trapay_deposit(v_deposit, 100.00, 'USD', 'WEBHOOK') into v_result;
  -- Idempotent redelivery: no-op SUCCESS with already_paid=true (no second
  -- credit). Combined with 1c/1d this proves exactly-once semantics.
  insert into _verify_assertions
  select '1b second credit is idempotent no-op',
    (v_result->>'ok')::boolean = true
    and coalesce((v_result->>'already_paid')::boolean, false) = true;

  select count(*) into v_credit_count
  from public.ledger_entries where deposit_id = v_deposit and direction = 'CREDIT';
  insert into _verify_assertions select '1c ledger CREDIT count = 1', v_credit_count = 1;

  insert into _verify_assertions
  select '1d balance credited exactly once',
    (select balance from public.users where id = v_user) = v_balance_before + 100.00;

  insert into _verify_assertions
  select '1e deposit is PAID', (select status from public.deposits where id = v_deposit) = 'PAID';

  -- ------------------------------------------------------------------ test 2
  -- Amount/currency mismatch refusal: no ledger row, no status change.
  insert into public.deposits (company_id, user_id, order_id, method, amount, currency, status)
  values (v_company, v_user, 'VERIFY-MISMATCH-1', 'CARD', 50.00, 'USD', 'PENDING')
  returning id into v_deposit_b;

  select public.credit_trapay_deposit(v_deposit_b, 60.00, 'USD', 'WEBHOOK') into v_result;
  insert into _verify_assertions
  select '2a amount mismatch refused', (v_result->>'ok')::boolean = false;

  select public.credit_trapay_deposit(v_deposit_b, 50.00, 'EUR', 'WEBHOOK') into v_result;
  insert into _verify_assertions
  select '2b currency mismatch refused', (v_result->>'ok')::boolean = false;

  insert into _verify_assertions
  select '2c no credit for mismatched deposits',
    (select count(*) from public.ledger_entries where deposit_id = v_deposit_b) = 0
    and (select status from public.deposits where id = v_deposit_b) = 'PENDING';

  -- ------------------------------------------------------------------ test 3
  -- CANCELLED deposits can never be credited.
  update public.deposits set status = 'CANCELLED' where id = v_deposit_b;
  select public.credit_trapay_deposit(v_deposit_b, 50.00, 'USD', 'WEBHOOK') into v_result;
  insert into _verify_assertions
  select '3 credit refused for CANCELLED', (v_result->>'ok')::boolean = false;

  -- ------------------------------------------------------------------ test 4
  -- PROVIDER_CREATE_PENDING deposits ARE creditable (unknown create outcome,
  -- verified settlement afterwards).
  insert into public.deposits (company_id, user_id, order_id, method, amount, currency, status)
  values (v_company, v_user, 'VERIFY-PCP-1', 'BANK_TRANSFER', 75.00, 'USD', 'PROVIDER_CREATE_PENDING')
  returning id into v_deposit_b;

  select public.credit_trapay_deposit(v_deposit_b, 75.00, 'USD', 'WEBHOOK') into v_result;
  insert into _verify_assertions
  select '4 credit ok from PROVIDER_CREATE_PENDING', (v_result->>'ok')::boolean;

  -- ------------------------------------------------------------------ test 5
  -- Company isolation under RLS, acting as the fixture CLIENT. The client
  -- runs the probes; results are captured in variables and recorded AFTER
  -- switching back (temp-table writes under `authenticated` are avoided).
  set local role authenticated;
  -- SET cannot take an expression in plpgsql; set_config(is_local=true) is the
  -- transaction-local equivalent (released automatically by the rollback).
  perform set_config('request.jwt.claims', json_build_object('sub', v_user)::text, true);

  select (select count(*) from public.deposits where user_id <> v_user) = 0 into v_5a;
  select (select count(*) from public.company_payment_settings) = 0 into v_5b;
  select (select count(*) from public.trapay_events) = 0 into v_5c;
  select (select count(*) from public.company_payment_audit) = 0 into v_5d;

  begin
    insert into public.deposits (company_id, user_id, order_id, method, amount, currency, status)
    values (v_company, v_user, 'VERIFY-CLIENT-INSERT', 'CARD', 1.00, 'USD', 'PENDING');
  exception
    when insufficient_privilege or check_violation then v_5e := true;
    when others then v_5e := true;
  end;

  v_rows := 0;
  begin
    update public.deposits set status = 'PAID' where id = v_deposit_b and user_id = v_user;
    get diagnostics v_rows = row_count;
    -- With correct RLS this either errors (no UPDATE policy) or silently
    -- affects 0 rows. Any affected row means the client can mutate deposits.
    v_5f := (v_rows = 0);
  exception
    when insufficient_privilege or check_violation then v_5f := true;
    when others then v_5f := true;
  end;

  perform set_config('request.jwt.claims', '', true);
  reset role;

  insert into _verify_assertions select '5a client sees only own deposits', v_5a;
  insert into _verify_assertions select '5b client cannot read payment settings', v_5b;
  insert into _verify_assertions select '5c client cannot read trapay_events', v_5c;
  insert into _verify_assertions select '5d client cannot read payment audit', v_5d;
  insert into _verify_assertions select '5e client cannot insert deposits', v_5e;
  insert into _verify_assertions select '5f client cannot update deposits', v_5f;

  -- ------------------------------------------------------------------ test 6
  -- The credit RPC is not executable by anon/authenticated.
  select not has_function_privilege('authenticated', 'public.credit_trapay_deposit(uuid,numeric,text,text)', 'EXECUTE')
     and not has_function_privilege('anon', 'public.credit_trapay_deposit(uuid,numeric,text,text)', 'EXECUTE')
    into v_bool;

  insert into _verify_assertions
  select '6 credit RPC denied to anon/authenticated', v_bool;

  -- ------------------------------------------------------------------ report
  v_rows := 0;
  for r in select name, ok from _verify_assertions order by name loop
    raise notice '%  %', case when r.ok then 'PASS' else 'FAIL' end, r.name;
    if not r.ok then v_rows := v_rows + 1; end if;
  end loop;

  if v_rows > 0 then
    raise exception 'VERIFICATION FAILED: % assertion(s) failed — ROLLBACK issued, nothing committed', v_rows;
  else
    -- Aborting here is deliberate: it guarantees the fixture transaction is
    -- fully rolled back. This message is the SUCCESS indicator.
    raise exception 'ROLLBACK-ON-PURPOSE: verification completed successfully';
  end if;
end;
$verify$;

-- ----------------------------------------------------------------------------
-- TRUE PARALLEL RACE RECIPE (run manually in TWO psql sessions, then clean up):
-- ----------------------------------------------------------------------------
-- Session A:
--   begin;
--   select public.credit_trapay_deposit('<DEPOSIT_ID>', 100.00, 'USD', 'MANUAL_ADMIN');
--   -- row lock held; now run Session B:
-- Session B:
--   begin;
--   select public.credit_trapay_deposit('<DEPOSIT_ID>', 100.00, 'USD', 'MANUAL_ADMIN');
--   -- Session B blocks until A commits.
-- Session A:
--   commit;
--   -- Session B now unblocks and returns {"ok": true, "already_paid": true}
--   -- or ok=false invalid_state — either way ONLY ONE credit happened.
-- Session B:
--   rollback;
-- Expected: balance increased once, ledger CREDIT count = 1, deposit = PAID.
--
-- To create the test deposit for the race recipe (rolled back afterwards):
--   begin;
--   insert into public.deposits (company_id, user_id, order_id, method, amount, currency, status)
--     select c.id, u.id, 'VERIFY-RACE-MANUAL', 'CARD', 100.00, 'USD', 'PENDING'
--     from public.companies c, public.users u
--     where c.base_currency = 'USD' and u.role = 'client'
--     limit 1
--   returning id;
--   -- use the returned id above; rollback when done
--   rollback;
