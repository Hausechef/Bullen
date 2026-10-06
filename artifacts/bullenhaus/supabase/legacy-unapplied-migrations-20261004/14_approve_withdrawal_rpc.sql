-- Atomic withdrawal approval: status transition + balance debit in one DB transaction.
-- Uses FOR UPDATE row lock so concurrent approvals cannot double-debit the balance.
-- SECURITY DEFINER executes as function owner to bypass row-level security on the
-- underlying tables, but the function enforces its own caller-role check first.

CREATE OR REPLACE FUNCTION public.approve_withdrawal(p_transaction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx   RECORD;
  v_role text;
BEGIN
  -- Explicit caller authorization: only admin and trade_admin may approve withdrawals.
  v_role := public.get_my_role();
  IF v_role NOT IN ('admin', 'trade_admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  -- Lock the transaction row for the duration of this transaction.
  -- Any concurrent call for the same id will block here until we commit,
  -- guaranteeing exactly-once debit even under simultaneous approvals.
  SELECT id, user_id, amount, status, type
  INTO v_tx
  FROM public.transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  -- Safety guard: only Withdrawal rows may be approved via this function.
  IF v_tx.type != 'Withdrawal' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_a_withdrawal');
  END IF;

  -- Idempotency guard: if already in a final approved state, do nothing.
  IF v_tx.status IN ('Completed', 'Approved') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_approved', 'amount', v_tx.amount);
  END IF;

  -- Transition status to Completed (exactly once, protected by the row lock above).
  UPDATE public.transactions
  SET status = 'Completed', updated_at = now()
  WHERE id = p_transaction_id;

  -- Decrement the client's balance atomically (arithmetic in SQL, no read-then-write).
  UPDATE public.users
  SET balance = balance - v_tx.amount
  WHERE id = v_tx.user_id;

  RETURN jsonb_build_object('ok', true, 'amount', v_tx.amount, 'user_id', v_tx.user_id);
END;
$$;

-- Grant execute to authenticated role; the internal role check above restricts
-- actual execution to admin/trade_admin callers only.
GRANT EXECUTE ON FUNCTION public.approve_withdrawal(uuid) TO authenticated;
