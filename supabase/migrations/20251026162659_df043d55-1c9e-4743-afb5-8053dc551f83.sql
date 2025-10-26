-- Adicionar campos de status e timestamps em support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_support_tickets_updated_at_trigger ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at_trigger
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_support_tickets_updated_at();

-- Tabela para respostas aos tickets
CREATE TABLE IF NOT EXISTS public.support_ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS para support_ticket_responses
ALTER TABLE public.support_ticket_responses ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as respostas
CREATE POLICY "Admins can view all responses"
ON public.support_ticket_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Admins podem criar respostas
CREATE POLICY "Admins can create responses"
ON public.support_ticket_responses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Usuários podem ver respostas não-internas dos seus próprios tickets
CREATE POLICY "Users can view their ticket responses"
ON public.support_ticket_responses
FOR SELECT
TO authenticated
USING (
  NOT is_internal AND
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE support_tickets.id = support_ticket_responses.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- Atualizar política de SELECT para admins verem todos os tickets
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Admins podem atualizar tickets
DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;
CREATE POLICY "Admins can update tickets"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Grants para support_ticket_responses
GRANT SELECT ON public.support_ticket_responses TO authenticated;
GRANT INSERT ON public.support_ticket_responses TO authenticated;
GRANT UPDATE ON public.support_ticket_responses TO authenticated;