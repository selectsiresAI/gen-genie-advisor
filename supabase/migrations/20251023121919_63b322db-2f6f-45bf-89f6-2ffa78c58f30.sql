CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert support tickets" ON public.support_tickets;
CREATE POLICY "Users can insert support tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;
CREATE POLICY "Users can view own support tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);