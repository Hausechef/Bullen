-- The CRM Workflow Rules page queried workflows.is_active and
-- workflows.priority, neither of which exist (real column is `status`
-- text, no priority column at all) -- "column workflows.is_active does
-- not exist". Also workflow_executions (used by the Log panel and the
-- manual "Run now" trigger) was never created at all.

ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES public.workflows(id) ON DELETE CASCADE,
  workflow_name text NOT NULL,
  trigger text,
  triggered_by uuid REFERENCES public.users(id),
  status text NOT NULL DEFAULT 'succeeded',
  result text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- Mirrors workflows' existing admin/crm_admin-only scope.
CREATE POLICY "Admins can read workflow executions" ON public.workflow_executions
FOR SELECT TO authenticated
USING (get_my_role() = ANY (ARRAY['admin','crm_admin']));

CREATE POLICY "Admins can insert workflow executions" ON public.workflow_executions
FOR INSERT TO authenticated
WITH CHECK (get_my_role() = ANY (ARRAY['admin','crm_admin']));
