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
-- ============================================================
-- Migration 25: Tasks — follow-ups, calls, KYC checks, etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'manual'
                 CHECK (type IN ('call','email','deposit_check','kyc','follow_up','manual')),
  client_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  lead_id      UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  assignee_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by   UUID REFERENCES public.users(id),
  due_at       TIMESTAMPTZ,
  priority     TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low','medium','high')),
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','in_progress','completed','cancelled')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status
  ON public.tasks(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at
  ON public.tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id
  ON public.tasks(client_id);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Agents see tasks assigned to them or created by them
CREATE POLICY "agents_see_own_tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    assignee_id = auth.uid() OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('manager','director','admin','crm_admin')
    )
  );

CREATE POLICY "crm_workers_can_insert_tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('agent','manager','director','admin','crm_admin')
    )
  );

CREATE POLICY "crm_workers_can_update_tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    assignee_id = auth.uid() OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('manager','director','admin','crm_admin')
    )
  );

CREATE POLICY "crm_workers_can_delete_tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('manager','director','admin','crm_admin')
    )
  );

-- Trigger: set updated_at
CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration 26: Support tickets (missing from original schema)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  message      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new','open','pending','resolved','closed')),
  priority     TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low','medium','high','critical')),
  assignee_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by   UUID REFERENCES public.users(id),
  sla_due_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON public.support_tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_client ON public.support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_sla ON public.support_tickets(sla_due_at);

-- Comments thread on tickets
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket
  ON public.ticket_comments(ticket_id, created_at);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Clients can see their own tickets; CRM workers see all
CREATE POLICY "clients_see_own_tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')
    )
  );

CREATE POLICY "clients_create_own_tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "crm_workers_update_tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')
    )
  );

-- Comments: clients see comments on their tickets; CRM workers see all
CREATE POLICY "ticket_comments_read" ON public.ticket_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
      AND (t.client_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')
      ))
    )
  );

CREATE POLICY "ticket_comments_insert" ON public.ticket_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
      AND (t.client_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')
      ))
    )
  );

-- Triggers
CREATE TRIGGER support_tickets_set_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
