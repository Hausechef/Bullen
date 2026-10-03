-- Migration 23: Premarket Contracts

CREATE TABLE IF NOT EXISTS public.premarket_contract_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    contract_version TEXT NOT NULL,
    agreed_at TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    UNIQUE(user_id, contract_version)
);

ALTER TABLE public.premarket_contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signatures" ON public.premarket_contract_signatures FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION sign_premarket_contract(version TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.premarket_contract_signatures (user_id, contract_version)
  VALUES (auth.uid(), version)
  ON CONFLICT (user_id, contract_version) DO NOTHING;
END;
$$;
