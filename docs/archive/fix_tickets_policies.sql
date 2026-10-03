-- Drop existing ticket_comments policies that reference t.client_id
DROP POLICY IF EXISTS "ticket_comments_read" ON public.ticket_comments;
DROP POLICY IF EXISTS "ticket_comments_insert" ON public.ticket_comments;

-- Recreate with simpler RLS — CRM workers see all comments
CREATE POLICY "ticket_comments_read" ON public.ticket_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
      AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin','client'))
  );

CREATE POLICY "ticket_comments_insert" ON public.ticket_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
      AND u.role IN ('agent','manager','director','admin','trade_admin','crm_admin','client'))
  );
