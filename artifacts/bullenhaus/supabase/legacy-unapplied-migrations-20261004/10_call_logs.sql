-- ── Call logs table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.call_logs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  phone_number    text NOT NULL,
  direction       text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  status          text NOT NULL CHECK (status IN ('initiated', 'ringing', 'answered', 'no_answer', 'busy', 'failed', 'completed')) DEFAULT 'initiated',
  duration_seconds int DEFAULT 0,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS call_logs_agent_id_idx  ON public.call_logs(agent_id);
CREATE INDEX IF NOT EXISTS call_logs_client_id_idx ON public.call_logs(client_id);
CREATE INDEX IF NOT EXISTS call_logs_created_at_idx ON public.call_logs(created_at DESC);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Agents see only their own calls
CREATE POLICY "Agents see own call logs"
  ON public.call_logs FOR SELECT
  USING (agent_id = auth.uid());

-- Managers / directors / admin / superadmin see all
CREATE POLICY "Managers see all call logs"
  ON public.call_logs FOR SELECT
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid())
    IN ('manager', 'director', 'admin')
  );

-- Agents can insert own call logs
CREATE POLICY "Agents can insert call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (agent_id = auth.uid());

-- Agents can update own call logs (duration, status, notes)
CREATE POLICY "Agents can update own call logs"
  ON public.call_logs FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());
