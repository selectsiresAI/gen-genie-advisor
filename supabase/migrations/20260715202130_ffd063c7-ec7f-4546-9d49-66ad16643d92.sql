
-- 1) Restrict public catalog tables to authenticated users
DROP POLICY IF EXISTS bulls_ss_anon_read ON public.bulls_ss;
DROP POLICY IF EXISTS bulls_cdcb_anon_read ON public.bulls_cdcb;
REVOKE SELECT ON public.bulls_ss FROM anon;
REVOKE SELECT ON public.bulls_cdcb FROM anon;

-- 2) Convert views to security_invoker so caller RLS applies
ALTER VIEW public.bulls_denorm SET (security_invoker = true);
ALTER VIEW public.farm_dashboard_kpis SET (security_invoker = true);
ALTER VIEW public.farm_technicians SET (security_invoker = true);
ALTER VIEW public.females_denorm SET (security_invoker = true);
ALTER VIEW public.females_public_by_farm_view SET (security_invoker = true);
ALTER VIEW public.semen_inventory SET (security_invoker = true);

-- 3) Set immutable search_path on our own functions
ALTER FUNCTION public.accept_pending_invites(uuid, text) SET search_path = public;
ALTER FUNCTION public.ag_boxplot_stats(uuid, text) SET search_path = public;
ALTER FUNCTION public.ag_trait_histogram(uuid, text, integer) SET search_path = public;
ALTER FUNCTION public.generate_temp_password(bigint) SET search_path = public;
ALTER FUNCTION public.get_user_role() SET search_path = public;
ALTER FUNCTION public.is_farm_member(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.is_member_of_farm(uuid) SET search_path = public;
ALTER FUNCTION public.is_rep_of_manager(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.link_order_to_client(uuid, text) SET search_path = public;
ALTER FUNCTION public.log_storage_object_insert() SET search_path = public;
ALTER FUNCTION public.normalize_bull_code_and_sire() SET search_path = public;
ALTER FUNCTION public.normalize_text(text) SET search_path = public;
ALTER FUNCTION public.nx3_list_pta_traits() SET search_path = public;
ALTER FUNCTION public.parse_flexible_date(text) SET search_path = public;
ALTER FUNCTION public.parse_staging_date(text) SET search_path = public;
ALTER FUNCTION public.set_updated_at_ag() SET search_path = public;
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
ALTER FUNCTION public.trg_accept_invites_on_signup() SET search_path = public;
ALTER FUNCTION public.update_support_tickets_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 4) Revoke public execute on internal SECURITY DEFINER helpers/triggers
-- Trigger functions never need direct API execute
REVOKE ALL ON FUNCTION public.log_storage_object_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.normalize_bull_code_and_sire() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_accept_invites_on_signup() FROM PUBLIC, anon, authenticated;
-- Internal invite acceptance is called by trigger only
REVOKE ALL ON FUNCTION public.accept_pending_invites(uuid, text) FROM PUBLIC, anon, authenticated;
-- Rep/manager relationship helper - used only by RLS/policies (SECURITY DEFINER),
-- not intended as a public API entrypoint
REVOKE ALL ON FUNCTION public.is_rep_of_manager(uuid, uuid) FROM PUBLIC, anon;
-- get_user_role and nx3_list_pta_traits: keep executable for authenticated only
REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
REVOKE ALL ON FUNCTION public.nx3_list_pta_traits() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nx3_list_pta_traits() TO authenticated;
