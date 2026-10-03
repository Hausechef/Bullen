-- ============================================================
-- Migration 28: Sales Scripts + Objection Handling
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sales_scripts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'cold_call'
    CHECK (category IN ('cold_call','follow_up','objection_handling','closing','kyc_help','general')),
  stage        TEXT
    CHECK (stage IS NULL OR stage IN ('NEW','NO_ANSWER','IN_PROGRESS','AWAITING_DEPOSIT','DEPOSITED','CLOSED','LOST')),
  body         TEXT NOT NULL,
  objections   JSONB DEFAULT '[]'::jsonb,
  tags         TEXT[] DEFAULT '{}',
  created_by   UUID REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scripts_category ON public.sales_scripts(category);
CREATE INDEX IF NOT EXISTS idx_scripts_stage ON public.sales_scripts(stage);
CREATE INDEX IF NOT EXISTS idx_scripts_tags ON public.sales_scripts USING GIN(tags);

ALTER TABLE public.sales_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_workers_read_scripts" ON public.sales_scripts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin')));

CREATE POLICY "crm_managers_manage_scripts" ON public.sales_scripts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('manager','director','admin','crm_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
    AND u.role IN ('manager','director','admin','crm_admin')));

CREATE TRIGGER sales_scripts_set_updated_at
  BEFORE UPDATE ON public.sales_scripts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed 6 objection-handling scripts (most common objections)
INSERT INTO public.sales_scripts (title, category, stage, body, objections, tags) VALUES
  (
    'Objection: "I need to think about it"',
    'objection_handling',
    'IN_PROGRESS',
    'I completely understand, {name}. Taking time to think is smart. Let me ask — what specifically would you like to think about? Is it the deposit amount, the platform features, or something else? I can address any concerns right now while you have me on the phone. Most of our successful clients had the same hesitation, and once they saw the platform demo, they felt confident. Would a 5-minute walkthrough help?',
    '["think","consider","decide later","not sure"]'::jsonb,
    '{"objection","hesitation","think"}'
  ),
  (
    'Objection: "I don''t have money right now"',
    'objection_handling',
    'AWAITING_DEPOSIT',
    'I hear you, {name}. Many of our clients started with the minimum deposit of $250. Think of it as an investment in your financial future, not an expense. We also offer a demo account so you can practice risk-free first. Would you like to try the demo while you save up for the initial deposit? I can set that up today.',
    '["no money","expensive","cannot afford","budget"]'::jsonb,
    '{"objection","money","budget","afford"}'
  ),
  (
    'Objection: "I don''t trust the platform"',
    'objection_handling',
    'IN_PROGRESS',
    'I appreciate your honesty, {name}. Trust is everything in trading. Let me share — Bullenhaus is regulated, we use bank-grade encryption, and your funds are held in segregated accounts. Over 50,000 clients trade with us. I can send you our compliance documentation and client testimonials. Would you like to speak with one of our existing clients as a reference?',
    '["trust","scam","legit","safe","regulated"]'::jsonb,
    '{"objection","trust","security","legitimate"}'
  ),
  (
    'Objection: "I already trade with another broker"',
    'objection_handling',
    'IN_PROGRESS',
    'That''s great that you''re already trading, {name}! It means you understand the value. Many of our clients trade with multiple brokers to diversify. What does your current broker offer? Bullenhaus provides tighter spreads, 24/7 support, and a personal account manager. Would you like to compare side-by-side? I can show you where you''d save on fees.',
    '["another broker","already trade","competitor","switch"]'::jsonb,
    '{"objection","competitor","comparison","switch"}'
  ),
  (
    'Objection: "Call me back later"',
    'objection_handling',
    'NEW',
    'Of course, {name}. I respect your time. When would be the best time to reach you — tomorrow morning or afternoon? I want to make sure I catch you at a good moment. In the meantime, can I send you a quick email with our platform overview so you have the information ready when we speak?',
    '["later","busy","call back","not now","timing"]'::jsonb,
    '{"objection","timing","callback","busy"}'
  ),
  (
    'Objection: "I don''t understand how it works"',
    'objection_handling',
    'IN_PROGRESS',
    'That''s completely normal, {name}. Trading can seem complex at first. Let me simplify it — think of it like buying currency at a bank, but you can profit whether prices go up OR down. Our platform is designed for beginners, with built-in tutorials and a personal coach (that''s me!). I''ll walk you through your first trade step-by-step. Shall we start with a 5-minute demo?',
    '["don''t understand","confused","complicated","how it works","beginner"]'::jsonb,
    '{"objection","education","beginner","confused"}'
  )
ON CONFLICT DO NOTHING;

-- Cold call script
INSERT INTO public.sales_scripts (title, category, stage, body, tags) VALUES
  (
    'Cold Call Opening — New Lead',
    'cold_call',
    'NEW',
    'Hello, is this {name}? This is [Your Name] from Bullenhaus Trading. You recently registered on our platform — thank you for that! I''m calling to personally welcome you and help you get started. Do you have 2 minutes? I''d like to understand your trading experience and show you how our platform can help you achieve your financial goals. ... Great! First, have you traded before — stocks, crypto, forex?',
    '{"cold_call","opening","new_lead","intro"}'
  ),
  (
    'Follow-up After No Answer',
    'follow_up',
    'NO_ANSWER',
    'Hi {name}, this is [Your Name] from Bullenhaus Trading. I tried reaching you earlier but couldn''t connect. I wanted to follow up on your registration and answer any questions you might have. I''ll send you a quick email with my contact details — feel free to reply or call me back at [number]. Looking forward to speaking with you!',
    '{"follow_up","no_answer","voicemail"}'
  ),
  (
    'Closing — Request the Deposit',
    'closing',
    'AWAITING_DEPOSIT',
    'Excellent, {name}! So we''ve covered the platform, your account is verified, and you''re ready to start. The next step is your initial deposit. The minimum is $250, but most clients start with $500 to take full advantage of our trading signals. I can walk you through the deposit process right now — it takes less than 2 minutes. Shall we do that?',
    '{"closing","deposit","ftd","ask"}'
  )
ON CONFLICT DO NOTHING;
