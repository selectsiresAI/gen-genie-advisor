-- 5 of the 6 indexes declared in migrations backfilled into the ledger as "already
-- applied" (2026-09-26 reconciliation) but never actually created live, per independent
-- verification. Performance-only (no unique constraints, no security impact).
-- A 6th (idx_error_reports_status) is skipped: error_reports has no `status` column live,
-- confirming that specific migration's original CREATE TABLE assumption never matched
-- reality — needs a product decision, not a mechanical index add.
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON public.error_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON public.error_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulls_sire_naab ON public.bulls(sire_naab);
CREATE INDEX IF NOT EXISTS idx_technical_glossary_category ON public.technical_glossary(category);
