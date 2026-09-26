-- grafana_readonly has no write privileges and only explicit SELECT grants on a handful
-- of tables. BYPASSRLS is required for any RLS-enabled-but-zero-policy tables it might
-- need later; harmless for tables that already have permissive policies.
ALTER ROLE grafana_readonly BYPASSRLS;
