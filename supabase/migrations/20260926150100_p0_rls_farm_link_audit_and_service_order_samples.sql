-- P0: farm_link_audit had RLS fully disabled (advisor ERROR, exposed to anon/authenticated).
-- service_order_samples had RLS enabled with zero policies (full block, not a leak, but broke
-- legitimate reads). Applied directly to odactdxpecpiyiyaqfgi on 2026-09-26; versioned here.

ALTER TABLE public.farm_link_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_reads_farm_link_audit" ON public.farm_link_audit
  FOR SELECT TO authenticated
  USING (
    public.has_role_v2(auth.uid(), 'admin') OR public.has_role_v2(auth.uid(), 'superadmin')
    OR public.has_role_v2(auth.uid(), 'tecnico')
  );

CREATE POLICY "farm_member_reads_own_service_order_samples" ON public.service_order_samples
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = service_order_samples.service_order_id
        AND public.can_access_farm(so.client_id)
    )
  );
