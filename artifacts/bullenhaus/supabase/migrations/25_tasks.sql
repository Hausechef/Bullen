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
