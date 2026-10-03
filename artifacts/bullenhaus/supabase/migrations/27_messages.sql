-- ============================================================
-- Migration 27: Messages + Message Templates (Omnichannel)
-- Channels: email, sms, whatsapp, telegram
-- ============================================================

CREATE TABLE IF NOT EXISTS public.message_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  channel      TEXT NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email','sms','whatsapp','telegram')),
  category     TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general','welcome','follow_up','deposit','kyc','retention','win_back')),
  body         TEXT NOT NULL,
  created_by   UUID REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_channel ON public.message_templates(channel);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.message_templates(category);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_workers_read_templates" ON public.message_templates
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')));

CREATE POLICY "crm_managers_manage_templates" ON public.message_templates
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('manager','director','admin','crm_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('manager','director','admin','crm_admin')));

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email','sms','whatsapp','telegram')),
  direction    TEXT NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('inbound','outbound')),
  subject      TEXT,
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('draft','sent','delivered','failed','received')),
  template_id  UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  sent_by      UUID REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_client ON public.messages(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.messages(channel);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_workers_see_messages" ON public.messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin'))
    OR client_id = auth.uid());

CREATE POLICY "crm_workers_insert_messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')));

CREATE POLICY "crm_workers_update_messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')));

CREATE TRIGGER messages_set_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default templates
INSERT INTO public.message_templates (name, channel, category, body) VALUES
  ('Welcome Email', 'email', 'welcome', 'Dear {name}, welcome to Bullenhaus! Your trading account is ready. Complete your KYC to start trading.'),
  ('Deposit Follow-up', 'email', 'deposit', 'Hi {name}, we noticed you haven''t made your first deposit yet. Fund your account today and start trading with as little as $250.'),
  ('KYC Reminder', 'sms', 'kyc', 'Hi {name}, please complete your KYC verification to activate your account. Upload your documents at https://bullenhaus.com/kyc'),
  ('Win-back Offer', 'whatsapp', 'win_back', 'Hi {name}, we miss you! Get 20% bonus on your next deposit. Limited time offer. Reply STOP to unsubscribe.'),
  ('Retention Check-in', 'telegram', 'retention', 'Hello {name}, your account manager wanted to check in. Do you have any questions about your portfolio?')
ON CONFLICT DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
