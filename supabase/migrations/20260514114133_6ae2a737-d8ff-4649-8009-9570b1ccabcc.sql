
-- representantes: replace permissive read with role-restricted read
DROP POLICY IF EXISTS "representantes: authenticated read" ON public.representantes;
CREATE POLICY "representantes: internal read"
ON public.representantes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role, 'representante'::app_role, 'coordenador'::app_role])
  )
);

-- coordenador_representante: restrict to internal staff
DROP POLICY IF EXISTS "coord_rep: authenticated read" ON public.coordenador_representante;
CREATE POLICY "coord_rep: internal read"
ON public.coordenador_representante
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role, 'representante'::app_role, 'coordenador'::app_role])
  )
);

-- farm_invites: restrict to inviter, invitee, or admin
DROP POLICY IF EXISTS "Authenticated can read farm invites" ON public.farm_invites;
CREATE POLICY "farm_invites: scoped read"
ON public.farm_invites
FOR SELECT
TO authenticated
USING (
  invited_by = auth.uid()
  OR invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role])
  )
);

-- admin_notes: restrict to admin/superadmin
DROP POLICY IF EXISTS "Authenticated can manage admin notes" ON public.admin_notes;
CREATE POLICY "admin_notes: admin only"
ON public.admin_notes
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

-- bulls_import_staging: own rows or admin
DROP POLICY IF EXISTS "Authenticated can manage bull import staging" ON public.bulls_import_staging;
CREATE POLICY "bulls_import_staging: own or admin"
ON public.bulls_import_staging
FOR ALL
TO authenticated
USING (
  uploader_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role])
  )
)
WITH CHECK (
  uploader_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role])
  )
);

-- import_staging_females: own rows or admin
DROP POLICY IF EXISTS "Authenticated can manage female import staging" ON public.import_staging_females;
CREATE POLICY "import_staging_females: own or admin"
ON public.import_staging_females
FOR ALL
TO authenticated
USING (
  uploader_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role])
  )
)
WITH CHECK (
  uploader_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role])
  )
);

-- upload_audit: own rows or admin
DROP POLICY IF EXISTS "Authenticated can read upload audit" ON public.upload_audit;
CREATE POLICY "upload_audit: own or admin"
ON public.upload_audit
FOR ALL
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role])
  )
)
WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role])
  )
);

-- team_locations: restrict read to internal staff (was effectively public)
DROP POLICY IF EXISTS "team_locations: internal read" ON public.team_locations;
CREATE POLICY "team_locations: internal read"
ON public.team_locations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role, 'representante'::app_role, 'coordenador'::app_role])
  )
);

-- storage: genomic-files read restricted to internal staff
DROP POLICY IF EXISTS "genomic-files: authenticated read" ON storage.objects;
CREATE POLICY "genomic-files: internal read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'genomic-files'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['superadmin'::app_role, 'admin'::app_role, 'representante'::app_role, 'coordenador'::app_role])
  )
);
