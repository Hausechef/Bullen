-- ── Add last_seen_at for real online status tracking ─────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- ── Add assigned_agent_id to users (client assignments) ──────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS assigned_agent_id uuid
  REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_assigned_agent_idx ON public.users(assigned_agent_id);

-- ── RLS: CRM workers (manager/director/admin) can assign clients ──────────────
CREATE POLICY "CRM managers can assign client users"
  ON public.users FOR UPDATE
  USING (
    role = 'client'
    AND (SELECT role FROM public.users WHERE id = auth.uid())
      IN ('manager', 'director', 'admin')
  )
  WITH CHECK (
    role = 'client'
    AND (SELECT role FROM public.users WHERE id = auth.uid())
      IN ('manager', 'director', 'admin')
  );

-- ── RLS: CRM workers can reassign leads ──────────────────────────────────────
-- (policy already exists from migration 06 for update; this adds assignment awareness)
-- No additional policy needed — existing "CRM workers can update leads" covers it.
