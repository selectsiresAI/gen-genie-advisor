-- Limpar políticas duplicadas
DROP POLICY IF EXISTS "Users can create their own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can insert support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;

-- CRITICAL: Adicionar permissões GRANT que estavam faltando
GRANT INSERT ON public.support_tickets TO anon;
GRANT INSERT ON public.support_tickets TO authenticated;
GRANT SELECT ON public.support_tickets TO anon;
GRANT SELECT ON public.support_tickets TO authenticated;
GRANT UPDATE ON public.support_tickets TO authenticated;

-- Recriar política de INSERT (apenas uma, sem duplicatas)
DROP POLICY IF EXISTS "Anyone can create support tickets" ON public.support_tickets;
CREATE POLICY "Anyone can create support tickets" 
ON public.support_tickets 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);