-- ── Extend users with separate name fields and country ────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name  text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country    text;

-- ── Telephony numbers table for admin/director management ─────────────────────
CREATE TABLE IF NOT EXISTS public.telephony_numbers (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number     text NOT NULL UNIQUE,
  label            text,
  provider         text DEFAULT 'manual',
  assigned_agent_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telephony_numbers_agent_idx ON public.telephony_numbers(assigned_agent_id);

ALTER TABLE public.telephony_numbers ENABLE ROW LEVEL SECURITY;

-- Admin & director can fully manage telephony numbers
CREATE POLICY "Admin/director manage telephony"
  ON public.telephony_numbers FOR ALL
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'director')
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'director')
  );

-- Agents can see their own assigned number
CREATE POLICY "Agents see own telephony number"
  ON public.telephony_numbers FOR SELECT
  USING (assigned_agent_id = auth.uid());
