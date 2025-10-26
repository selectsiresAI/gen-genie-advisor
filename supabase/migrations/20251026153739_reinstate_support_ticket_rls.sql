-- Ensure support_tickets table allows anonymous inserts
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create support tickets" ON public.support_tickets;
CREATE POLICY "Anyone can create support tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own support tickets" ON public.support_tickets;
CREATE POLICY "Users can view their own support tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
