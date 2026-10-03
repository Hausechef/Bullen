-- Platform's crypto deposit wallet (connected by an admin via MetaMask in the
-- admin panel). Singleton row (id is fixed to 1). Address/chain/token are
-- read by every client's deposit screen, so SELECT is open to any
-- authenticated user; only admin/trade_admin may change them.
CREATE TABLE public.platform_wallet_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  chain text NOT NULL DEFAULT 'ethereum',
  chain_id text NOT NULL DEFAULT '0x1',
  address text,
  token_symbol text NOT NULL DEFAULT 'USDT',
  -- Official Tether USD contract on Ethereum Mainnet.
  token_contract text NOT NULL DEFAULT '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  token_decimals smallint NOT NULL DEFAULT 6,
  updated_by uuid REFERENCES public.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_wallet_settings (id) VALUES (1);

ALTER TABLE public.platform_wallet_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_wallet_settings_read ON public.platform_wallet_settings
FOR SELECT TO authenticated
USING (true);

CREATE POLICY platform_wallet_settings_admin_write ON public.platform_wallet_settings
FOR UPDATE TO authenticated
USING (get_my_role() = ANY (ARRAY['admin','trade_admin']))
WITH CHECK (get_my_role() = ANY (ARRAY['admin','trade_admin']));
