-- ============================================================
-- Phase 3: KYC Reviews + Workflow Rules
-- ============================================================

-- 1. kyc_reviews table
CREATE TABLE IF NOT EXISTS public.kyc_reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewer_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  decision     TEXT NOT NULL
    CHECK (decision IN ('approved','rejected','needs_more_info','escalated')),
  reason       TEXT,
  risk_flags   JSONB DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kyc_reviews_user ON public.kyc_reviews(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kyc_reviews_decision ON public.kyc_reviews(decision);

ALTER TABLE public.kyc_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_workers_read_kyc_reviews" ON public.kyc_reviews
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')));

CREATE POLICY "compliance_insert_kyc_reviews" ON public.kyc_reviews
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('admin','trade_admin','crm_admin','manager','director')));

CREATE POLICY "compliance_update_kyc_reviews" ON public.kyc_reviews
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('admin','trade_admin','crm_admin','manager','director')));

-- 2. workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  trigger      TEXT NOT NULL
    CHECK (trigger IN ('lead_created','lead_stage_changed','kyc_status_changed','ticket_created','task_overdue','deposit_received')),
  conditions   JSONB DEFAULT '{}'::jsonb,
  actions      JSONB DEFAULT '[]'::jsonb,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  priority     INTEGER NOT NULL DEFAULT 50,
  created_by   UUID REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON public.workflows(trigger, is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON public.workflows(is_active, priority);

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_workers_read_workflows" ON public.workflows
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')));

CREATE POLICY "admins_manage_workflows" ON public.workflows
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('admin','crm_admin','director')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('admin','crm_admin','director')));

-- 3. workflow_executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id  UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  workflow_name TEXT,
  trigger      TEXT,
  triggered_by UUID REFERENCES public.users(id),
  entity_type  TEXT,
  entity_id    UUID,
  status       TEXT NOT NULL DEFAULT 'executed'
    CHECK (status IN ('executed','succeeded','failed','skipped')),
  result       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_executions_workflow ON public.workflow_executions(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_status ON public.workflow_executions(status);

ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_workers_read_executions" ON public.workflow_executions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')));

CREATE POLICY "system_insert_executions" ON public.workflow_executions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 4. Triggers
CREATE TRIGGER workflows_set_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Disable RLS for demo (matching other tables)
ALTER TABLE public.kyc_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions DISABLE ROW LEVEL SECURITY;

-- 6. Seed 5 default workflow rules
INSERT INTO public.workflows (name, description, trigger, conditions, actions, is_active, priority) VALUES
  (
    'No deposit after 24h — create follow-up task',
    'If a client registers but does not deposit within 24 hours, create a call task for their assigned agent.',
    'task_overdue',
    '{"hours_without_deposit": 24}'::jsonb,
    '[{"type":"create_task","task_type":"call","title":"Follow-up call — no deposit after 24h","priority":"high"}]'::jsonb,
    true,
    50
  ),
  (
    'KYC rejected — notify agent',
    'When a client''s KYC is rejected, create a task for the agent to contact the client and explain.',
    'kyc_status_changed',
    '{"to_status":"REJECTED"}'::jsonb,
    '[{"type":"create_task","task_type":"call","title":"KYC rejected — contact client","priority":"high"}]'::jsonb,
    true,
    60
  ),
  (
    'Critical ticket open > 2h — escalate',
    'If a Critical ticket remains open for more than 2 hours, escalate to manager.',
    'ticket_created',
    '{"priority":"critical","hours_open":2}'::jsonb,
    '[{"type":"escalate","escalate_to":"manager"}]'::jsonb,
    true,
    70
  ),
  (
    'VIP client — assign senior agent',
    'When a new VIP lead is created, assign to a senior agent automatically.',
    'lead_created',
    '{"is_vip":true}'::jsonb,
    '[{"type":"assign_agent","agent_tier":"senior"}]'::jsonb,
    true,
    80
  ),
  (
    '3 no-answers — move to No Answer stage',
    'When a lead has 3 consecutive no-answer call logs, move to NO_ANSWER stage.',
    'lead_stage_changed',
    '{"no_answer_count":3}'::jsonb,
    '[{"type":"change_stage","to_stage":"NO_ANSWER"}]'::jsonb,
    true,
    55
  )
ON CONFLICT DO NOTHING;
