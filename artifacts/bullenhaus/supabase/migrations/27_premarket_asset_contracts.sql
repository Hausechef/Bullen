-- Migration 27: Premarket Asset Contracts

ALTER TABLE public.premarket_assets ADD COLUMN IF NOT EXISTS contract_url TEXT;

CREATE TABLE IF NOT EXISTS public.premarket_asset_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.premarket_assets(id) ON DELETE CASCADE,
    agreed_at TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    UNIQUE(user_id, asset_id)
);

ALTER TABLE public.premarket_asset_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asset signatures" 
ON public.premarket_asset_signatures 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION sign_premarket_asset_contract(p_asset_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.premarket_asset_signatures (user_id, asset_id)
  VALUES (auth.uid(), p_asset_id)
  ON CONFLICT (user_id, asset_id) DO NOTHING;
END;
$$;
