-- P3 observability: error_reports currently only has an own-row ALL policy (the earlier
-- admin-view-all policy was dropped by later migration evolution, confirmed during the
-- 2026-09-26 ledger reconciliation verification). Staff need to see every frontend error,
-- not just their own, and Grafana needs read access to build a panel.
CREATE POLICY "error_reports: staff read all" ON public.error_reports
  FOR SELECT
  USING (
    has_role_v2(auth.uid(), 'admin'::app_role)
    OR has_role_v2(auth.uid(), 'superadmin'::app_role)
    OR has_role_v2(auth.uid(), 'tecnico'::app_role)
  );

GRANT SELECT ON public.error_reports TO grafana_readonly;
