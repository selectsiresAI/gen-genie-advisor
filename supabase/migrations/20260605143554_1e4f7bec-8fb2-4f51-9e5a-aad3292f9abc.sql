
-- bulls_cdcb
ALTER TABLE public.bulls_cdcb ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.bulls_cdcb TO authenticated;
GRANT ALL ON public.bulls_cdcb TO service_role;
CREATE POLICY "bulls_cdcb_auth_read" ON public.bulls_cdcb FOR SELECT TO authenticated USING (true);

-- bulls_ss
ALTER TABLE public.bulls_ss ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.bulls_ss TO authenticated;
GRANT ALL ON public.bulls_ss TO service_role;
CREATE POLICY "bulls_ss_auth_read" ON public.bulls_ss FOR SELECT TO authenticated USING (true);

-- technicians
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.technicians FROM anon;
GRANT SELECT ON public.technicians TO authenticated;
GRANT ALL ON public.technicians TO service_role;
CREATE POLICY "technicians_auth_read" ON public.technicians FOR SELECT TO authenticated USING (true);
CREATE POLICY "technicians_admin_write" ON public.technicians FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- farm_technician_links
ALTER TABLE public.farm_technician_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.farm_technician_links FROM anon;
GRANT SELECT ON public.farm_technician_links TO authenticated;
GRANT ALL ON public.farm_technician_links TO service_role;
CREATE POLICY "farm_tech_links_member_read" ON public.farm_technician_links FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_farms uf
      WHERE uf.client_id = farm_technician_links.farm_id
        AND uf.user_id = auth.uid()
    )
  );
CREATE POLICY "farm_tech_links_admin_write" ON public.farm_technician_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- result_notifications
ALTER TABLE public.result_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.result_notifications FROM anon;
GRANT SELECT ON public.result_notifications TO authenticated;
GRANT ALL ON public.result_notifications TO service_role;
CREATE POLICY "result_notif_recipient_or_admin_read" ON public.result_notifications FOR SELECT TO authenticated
  USING (
    recipient_profile_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "result_notif_admin_write" ON public.result_notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- service_order_audit_log (RLS already enabled, add explicit policies)
GRANT SELECT ON public.service_order_audit_log TO authenticated;
GRANT ALL ON public.service_order_audit_log TO service_role;
CREATE POLICY "soa_log_admin_read" ON public.service_order_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- Restrictive policy that blocks writes from authenticated users (service_role bypasses RLS)
CREATE POLICY "soa_log_no_user_writes" ON public.service_order_audit_log AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);
