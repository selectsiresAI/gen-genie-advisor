
-- 1) client_botijoes
ALTER TABLE public.client_botijoes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_botijoes TO authenticated;
GRANT ALL ON public.client_botijoes TO service_role;
CREATE POLICY "client_botijoes_member_read" ON public.client_botijoes
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_farms uf WHERE uf.client_id = client_botijoes.client_id AND uf.user_id = auth.uid())
  );
CREATE POLICY "client_botijoes_member_write" ON public.client_botijoes
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_farms uf WHERE uf.client_id = client_botijoes.client_id AND uf.user_id = auth.uid() AND uf.role IN ('owner','editor'))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_farms uf WHERE uf.client_id = client_botijoes.client_id AND uf.user_id = auth.uid() AND uf.role IN ('owner','editor'))
  );

-- 2) client_botijao_itens
ALTER TABLE public.client_botijao_itens ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_botijao_itens TO authenticated;
GRANT ALL ON public.client_botijao_itens TO service_role;
CREATE POLICY "client_botijao_itens_member_read" ON public.client_botijao_itens
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_farms uf WHERE uf.client_id = client_botijao_itens.client_id AND uf.user_id = auth.uid())
  );
CREATE POLICY "client_botijao_itens_member_write" ON public.client_botijao_itens
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_farms uf WHERE uf.client_id = client_botijao_itens.client_id AND uf.user_id = auth.uid() AND uf.role IN ('owner','editor'))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_farms uf WHERE uf.client_id = client_botijao_itens.client_id AND uf.user_id = auth.uid() AND uf.role IN ('owner','editor'))
  );

-- 3) client_nitrogen_records
ALTER TABLE public.client_nitrogen_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_nitrogen_records TO authenticated;
GRANT ALL ON public.client_nitrogen_records TO service_role;
CREATE POLICY "client_nitrogen_records_member_read" ON public.client_nitrogen_records
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_farms uf WHERE uf.client_id = client_nitrogen_records.client_id AND uf.user_id = auth.uid())
  );
CREATE POLICY "client_nitrogen_records_member_write" ON public.client_nitrogen_records
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_farms uf WHERE uf.client_id = client_nitrogen_records.client_id AND uf.user_id = auth.uid() AND uf.role IN ('owner','editor'))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_farms uf WHERE uf.client_id = client_nitrogen_records.client_id AND uf.user_id = auth.uid() AND uf.role IN ('owner','editor'))
  );

-- 4) Technicians: replace open SELECT with admin or linked-farm member
DROP POLICY IF EXISTS "technicians_auth_read" ON public.technicians;
CREATE POLICY "technicians_admin_or_member_read" ON public.technicians
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.farm_technician_links ftl
      JOIN public.user_farms uf ON uf.client_id = ftl.farm_id
      WHERE ftl.technician_id = technicians.id AND uf.user_id = auth.uid()
    )
  );

-- 5) Support tickets: admin read-all policy
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 6) Storage policies for order-results bucket (private) + management for genomic-files
CREATE POLICY "order-results: admin read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'order-results'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['superadmin'::app_role,'admin'::app_role,'representante'::app_role,'coordenador'::app_role]))
  );
CREATE POLICY "order-results: admin upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'order-results'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['superadmin'::app_role,'admin'::app_role]))
  );
CREATE POLICY "order-results: admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'order-results'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['superadmin'::app_role,'admin'::app_role]))
  );
CREATE POLICY "order-results: admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'order-results'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['superadmin'::app_role,'admin'::app_role]))
  );
CREATE POLICY "genomic-files: admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'genomic-files'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['superadmin'::app_role,'admin'::app_role]))
  );
CREATE POLICY "genomic-files: admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'genomic-files'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['superadmin'::app_role,'admin'::app_role]))
  );
