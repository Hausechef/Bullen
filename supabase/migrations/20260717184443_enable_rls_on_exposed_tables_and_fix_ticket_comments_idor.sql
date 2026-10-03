-- P0: these tables had RLS policies defined but RLS itself disabled,
-- meaning the policies were never enforced and the tables were fully
-- exposed via PostgREST to any role with a table grant.
ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_scripts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments    ENABLE ROW LEVEL SECURITY;

-- P1: ticket_comments_read allowed ANY authenticated user with role
-- 'client' to read comments on ANY ticket (no ownership check), and
-- ticket_comments_insert let a client insert a comment into ANY
-- ticket_id. Scope both to tickets the caller actually owns for the
-- 'client' role, while staff keep unrestricted access as before.
DROP POLICY IF EXISTS ticket_comments_read ON public.ticket_comments;
CREATE POLICY ticket_comments_read ON public.ticket_comments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = ANY (ARRAY['agent','manager','director','admin','trade_admin','crm_admin'])
  )
  OR EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_comments.ticket_id
      AND st.client_id = auth.uid()
  )
);

DROP POLICY IF EXISTS ticket_comments_insert ON public.ticket_comments;
CREATE POLICY ticket_comments_insert ON public.ticket_comments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = ANY (ARRAY['agent','manager','director','admin','trade_admin','crm_admin'])
  )
  OR EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_comments.ticket_id
      AND st.client_id = auth.uid()
  )
);
