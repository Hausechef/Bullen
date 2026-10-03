-- AI Call Scenario: a stateful, multi-turn call-planning session for a human
-- agent. The AI never dials or talks to the client itself (no telephony
-- provider is integrated in this build) -- it proposes one line at a time,
-- the agent relays it and reports the client's reply, and the AI proposes
-- the next line. This table is the audit trail of that planning session.

CREATE TABLE IF NOT EXISTS public.ai_call_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.users(id),
  call_log_id uuid REFERENCES public.call_logs(id) ON DELETE SET NULL,
  objective text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status = ANY (ARRAY['in_progress','completed','opted_out','escalated','abandoned'])),
  stage text NOT NULL DEFAULT 'opening'
    CHECK (stage = ANY (ARRAY['opening','discovery','pitch','objection_handling','closing','outcome'])),
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_call_scenarios ENABLE ROW LEVEL SECURITY;

-- Mirrors call_logs: agents see/manage their own sessions, managers+ see all.
CREATE POLICY "Agents see own call scenarios" ON public.ai_call_scenarios
FOR SELECT TO authenticated
USING (agent_id = auth.uid());

CREATE POLICY "Managers see all call scenarios" ON public.ai_call_scenarios
FOR SELECT TO authenticated
USING ((SELECT users.role FROM public.users WHERE users.id = auth.uid()) = ANY (ARRAY['manager','director','admin']));

CREATE POLICY "Agents can insert own call scenarios" ON public.ai_call_scenarios
FOR INSERT TO authenticated
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own call scenarios" ON public.ai_call_scenarios
FOR UPDATE TO authenticated
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());
