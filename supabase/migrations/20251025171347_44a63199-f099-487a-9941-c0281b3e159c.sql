-- Create support_tickets table if not exists
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'other')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create support tickets (even unauthenticated users)
DROP POLICY IF EXISTS "Anyone can create support tickets" ON public.support_tickets;
CREATE POLICY "Anyone can create support tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (true);

-- Policy: Users can view their own support tickets (authenticated users with matching user_id, or tickets without user_id)
DROP POLICY IF EXISTS "Users can view their own support tickets" ON public.support_tickets;
CREATE POLICY "Users can view their own support tickets" 
ON public.support_tickets 
FOR SELECT 
USING ((auth.uid() = user_id) OR (user_id IS NULL));

-- Policy: Admins can view all support tickets
DROP POLICY IF EXISTS "Admins can view all support tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all support tickets" 
ON public.support_tickets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can update support tickets
DROP POLICY IF EXISTS "Admins can update support tickets" ON public.support_tickets;
CREATE POLICY "Admins can update support tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_support_tickets_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);