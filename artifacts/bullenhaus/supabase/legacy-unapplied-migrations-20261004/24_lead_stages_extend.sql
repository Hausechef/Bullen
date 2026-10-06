-- ============================================================
-- Migration 24: Extend lead stages to 7-stage sales pipeline
-- Allows: NEW, NO_ANSWER, IN_PROGRESS, AWAITING_DEPOSIT, DEPOSITED, CLOSED, LOST
-- ============================================================

-- 1. Migrate existing data to new stage values
UPDATE leads SET stage = 'NEW'           WHERE stage = 'NEW_INQUIRY';
UPDATE leads SET stage = 'IN_PROGRESS'   WHERE stage = 'IN_DISCUSSION';
UPDATE leads SET stage = 'AWAITING_DEPOSIT' WHERE stage = 'PENDING_KYC';
UPDATE leads SET stage = 'DEPOSITED'     WHERE stage = 'FUNDED';

-- 2. Drop old CHECK constraint (name is auto-generated, find it first)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'leads'::regclass AND contype = 'c';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE leads DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;
END $$;

-- 3. Add new CHECK constraint with 7 stages
ALTER TABLE leads ADD CONSTRAINT leads_stage_check
  CHECK (stage IN ('NEW','NO_ANSWER','IN_PROGRESS','AWAITING_DEPOSIT','DEPOSITED','CLOSED','LOST'));

-- 4. Default to NEW for future inserts
ALTER TABLE leads ALTER COLUMN stage SET DEFAULT 'NEW';

-- ============================================================
-- lead_stage_history — audit trail for stage transitions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_stage_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_stage   TEXT,
  to_stage     TEXT NOT NULL,
  changed_by   UUID REFERENCES auth.users(id),
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_stage_history_lead_id
  ON public.lead_stage_history(lead_id, changed_at DESC);

ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_workers_can_read_stage_history" ON public.lead_stage_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')
    )
  );

CREATE POLICY "crm_workers_can_insert_stage_history" ON public.lead_stage_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')
    )
  );
