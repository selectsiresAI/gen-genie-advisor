-- P2 observability: real, queryable log of import/upload errors. The existing audit
-- tables (upload_audit, bulls_import_log, error_reports, service_order_audit_log) all
-- have the right shape but nothing in the codebase writes to them (confirmed: 0 rows
-- each, no application code references beyond generated types). This is the table the
-- edge functions actually write to (starting with import-females).
CREATE TABLE public.app_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL CHECK (level IN ('error','warn','info')),
  source text NOT NULL,               -- e.g. 'import-females', 'upload-results'
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,  -- farm_id, batch_id, row counts, etc.
  user_id uuid
);
CREATE INDEX idx_app_logs_created_at ON public.app_logs (created_at DESC);
CREATE INDEX idx_app_logs_source_level ON public.app_logs (source, level);

ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;
-- Only service_role writes (edge functions); staff can read for diagnostics.
CREATE POLICY "staff_reads_app_logs" ON public.app_logs
  FOR SELECT TO authenticated
  USING (
    public.has_role_v2(auth.uid(), 'admin') OR public.has_role_v2(auth.uid(), 'superadmin')
    OR public.has_role_v2(auth.uid(), 'tecnico')
  );
REVOKE ALL ON public.app_logs FROM anon, authenticated;
GRANT SELECT ON public.app_logs TO authenticated;
GRANT ALL ON public.app_logs TO service_role;

-- Read-only role for a NEW, separate (non-harness) Grafana instance on the Mac Mini.
-- Password set out-of-band via apply_migration, not stored in this file.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'grafana_readonly') THEN
    CREATE ROLE grafana_readonly LOGIN;
  END IF;
END $$;
GRANT CONNECT ON DATABASE postgres TO grafana_readonly;
GRANT USAGE ON SCHEMA public TO grafana_readonly;
GRANT SELECT ON public.app_logs, public.upload_audit, public.bulls_import_log, public.service_order_audit_log TO grafana_readonly;
ALTER ROLE grafana_readonly SET statement_timeout = '10s';
