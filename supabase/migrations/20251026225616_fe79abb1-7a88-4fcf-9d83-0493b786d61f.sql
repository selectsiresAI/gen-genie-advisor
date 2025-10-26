-- Remove todas as políticas RLS existentes da tabela error_reports
DROP POLICY IF EXISTS "Users can create error reports" ON public.error_reports;
DROP POLICY IF EXISTS "Usuários autenticados podem criar relatórios de erro" ON public.error_reports;
DROP POLICY IF EXISTS "Users can view their own error reports" ON public.error_reports;
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios relatórios" ON public.error_reports;
DROP POLICY IF EXISTS "Admins podem visualizar todos os relatórios" ON public.error_reports;

-- Cria 3 políticas novas e otimizadas

-- A) INSERT Policy - Permite usuários autenticados criarem reports
CREATE POLICY "authenticated_can_insert_error_reports"
ON public.error_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- B) SELECT Policy - Admins veem tudo (usando has_role_v2)
CREATE POLICY "admins_can_view_all_error_reports"
ON public.error_reports
FOR SELECT
TO authenticated
USING (public.has_role_v2(auth.uid(), 'admin'::app_role));

-- C) SELECT Policy - Usuários veem apenas seus próprios reports
CREATE POLICY "users_can_view_own_error_reports"
ON public.error_reports
FOR SELECT
TO authenticated
USING (user_id = auth.uid());