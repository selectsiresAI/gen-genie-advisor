-- Corrigir a política de INSERT para validar user_id
DROP POLICY IF EXISTS "authenticated_can_insert_error_reports" ON public.error_reports;

CREATE POLICY "authenticated_can_insert_error_reports"
ON public.error_reports
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());