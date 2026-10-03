-- Allow CRM workers (agent/manager/director/admin) to read client user profiles
-- Uses get_my_role() security-definer function to avoid RLS infinite recursion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='users'
      AND policyname='CRM workers can view client profiles'
  ) THEN
    CREATE POLICY "CRM workers can view client profiles"
      ON public.users FOR SELECT
      USING (
        (public.get_my_role() IN ('agent','manager','director','admin') AND role = 'client')
        OR auth.uid() = id
      );
  END IF;

  -- CRM workers can view all transactions (for client history)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='transactions'
      AND policyname='CRM workers can view all transactions'
  ) THEN
    CREATE POLICY "CRM workers can view all transactions"
      ON public.transactions FOR SELECT
      USING (
        public.get_my_role() IN ('agent','manager','director','admin')
        OR auth.uid() = user_id
      );
  END IF;
END
$$;
