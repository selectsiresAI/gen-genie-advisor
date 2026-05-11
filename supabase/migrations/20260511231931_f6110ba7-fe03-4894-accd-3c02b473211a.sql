
-- Fix: coordenadores email exposure - restrict SELECT to internal staff only
DROP POLICY IF EXISTS "coordenadores: authenticated read" ON public.coordenadores;
CREATE POLICY "coordenadores: internal read"
ON public.coordenadores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role, 'representante'::app_role, 'coordenador'::app_role])
  )
);

-- Fix: bulls_import_log - restrict to uploader or admins, not all authenticated
DROP POLICY IF EXISTS "Authenticated can read bull import log" ON public.bulls_import_log;

CREATE POLICY "bulls_import_log: own or admin read"
ON public.bulls_import_log
FOR SELECT
TO authenticated
USING (
  uploader_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role])
  )
);

CREATE POLICY "bulls_import_log: admin write"
ON public.bulls_import_log
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role])
  )
);
