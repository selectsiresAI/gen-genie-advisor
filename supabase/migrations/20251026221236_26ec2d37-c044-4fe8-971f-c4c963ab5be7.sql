
-- ========================================
-- CORREÇÃO COMPLETA DO SISTEMA DE SUPORTE
-- ========================================

-- 1. LIMPAR TODAS AS POLÍTICAS ANTIGAS (duplicadas e conflitantes)
DROP POLICY IF EXISTS "Admins can create responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Only admins can create responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Users and admins can view ticket responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Users can view their ticket responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "responses_delete_admins" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "responses_insert_admins" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "responses_select_admins" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "responses_select_ticket_owner_public" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "responses_update_admins" ON public.support_ticket_responses;

DROP POLICY IF EXISTS "Admins and users can view their tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Anyone can create support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Only admins can update tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_insert_owner" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_select_admins" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_select_owner" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_update_admins" ON public.support_tickets;

-- 2. CRIAR POLÍTICAS CONSOLIDADAS E CORRETAS PARA support_tickets

-- Admins veem TODOS os tickets, usuários veem apenas os seus
CREATE POLICY "tickets_select_policy"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR user_id = auth.uid()
  OR user_id IS NULL
);

-- Qualquer pessoa autenticada ou anônima pode criar ticket
CREATE POLICY "tickets_insert_policy"
ON public.support_tickets
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Apenas admins podem atualizar tickets
CREATE POLICY "tickets_update_policy"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar tickets
CREATE POLICY "tickets_delete_policy"
ON public.support_tickets
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. CRIAR POLÍTICAS CONSOLIDADAS E CORRETAS PARA support_ticket_responses

-- Admins veem todas as respostas, usuários veem apenas respostas públicas dos seus tickets
CREATE POLICY "responses_select_policy"
ON public.support_ticket_responses
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    NOT is_internal 
    AND EXISTS (
      SELECT 1 FROM public.support_tickets st 
      WHERE st.id = ticket_id 
      AND st.user_id = auth.uid()
    )
  )
);

-- Apenas admins podem criar respostas
CREATE POLICY "responses_insert_policy"
ON public.support_ticket_responses
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar respostas
CREATE POLICY "responses_update_policy"
ON public.support_ticket_responses
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar respostas
CREATE POLICY "responses_delete_policy"
ON public.support_ticket_responses
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. ADICIONAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id 
ON public.support_tickets(user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status 
ON public.support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at 
ON public.support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_ticket_id 
ON public.support_ticket_responses(ticket_id);

CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_created_at 
ON public.support_ticket_responses(created_at);

-- 5. GARANTIR TRIGGER DE updated_at
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- 6. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.support_tickets IS 'Tickets de suporte criados por usuários';
COMMENT ON TABLE public.support_ticket_responses IS 'Respostas dos admins aos tickets de suporte';

COMMENT ON COLUMN public.support_tickets.message IS 'Descrição detalhada do problema reportado';
COMMENT ON COLUMN public.support_ticket_responses.is_internal IS 'Se true, a resposta é visível apenas para admins';
