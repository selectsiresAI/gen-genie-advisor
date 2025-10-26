-- Clean up and recreate RLS policies for error_reports
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies to avoid duplicates and conflicts
DROP POLICY IF EXISTS "Users can create error reports" ON public.error_reports;
DROP POLICY IF EXISTS "Users can view their own error reports" ON public.error_reports;
DROP POLICY IF EXISTS "Usuários autenticados podem criar relatórios de erro" ON public.error_reports;
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios relatórios" ON public.error_reports;
DROP POLICY IF EXISTS "Admins podem visualizar todos os relatórios" ON public.error_reports;

-- Allow authenticated users to insert error reports while ensuring a valid user context
CREATE POLICY "authenticated_can_insert_error_reports"
ON public.error_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow administrators to view all error reports using the security definer helper
CREATE POLICY "admins_can_view_all_error_reports"
ON public.error_reports
FOR SELECT
TO authenticated
USING (public.has_role_v2(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to view only their own error reports
CREATE POLICY "users_can_view_own_error_reports"
ON public.error_reports
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
