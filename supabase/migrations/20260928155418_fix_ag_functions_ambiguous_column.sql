-- Fix: ag_top_parents, ag_parentage_overview and ag_quartis_overview raised
-- `42702 column reference "<x>" is ambiguous` on every call, because their
-- RETURNS TABLE(...) OUT parameter names (parent_label/daughters_count/
-- trait_mean; role/status; group_label/trait_key) collide with identically
-- named columns produced by the CTEs in the function body. PL/pgSQL's
-- default variable_conflict=error setting raises on this collision at
-- RUNTIME (not at CREATE FUNCTION time), so the function compiled fine and
-- only failed when actually invoked.
--
-- Effect in the frontend: Step2TopParents.tsx / Step1Parentesco.tsx call
-- these RPCs, get `error` back, console.error it, and setRows([]) -- so the
-- Auditoria Genetica "Top pais" and "Parentesco" tabs render as fully
-- empty regardless of farm data. Reported by Beth (fazenda TONI,
-- client_id d26d0c7e-d0de-4a0b-a24b-c27e235a5019) on 2026-09-28; TONI has
-- 146/146 females with sire_naab filled -- confirms this was never a data
-- problem. ag_quartis_overview has the identical pattern and was found and
-- fixed opportunistically (same file, same bug class, not separately
-- reported yet).
--
-- Fix: add `#variable_conflict use_column` as the function's first
-- statement, which tells PL/pgSQL to prefer the SQL column over the
-- identically-named OUT parameter on ambiguous reference -- no logic or
-- output-column changes, matches the RETURNS TABLE contract exactly as
-- authored in 20260926152048_p0_lock_security_definer_farm_functions.sql.

CREATE OR REPLACE FUNCTION public.ag_parentage_overview(p_farm uuid)
 RETURNS TABLE(role text, status text, n integer, pct numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
BEGIN
  IF NOT public.can_access_farm(p_farm) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  RETURN QUERY
  WITH base AS (
    SELECT r.role,
      CASE
        WHEN (to_jsonb(f)->>(r.role||'_short_name')) IS NULL AND (to_jsonb(f)->>(r.role||'_naab')) IS NULL THEN 'Desconhecido'
        WHEN ((to_jsonb(f)->>(r.role||'_short_name')) IS NULL) <> ((to_jsonb(f)->>(r.role||'_naab')) IS NULL) THEN 'Incompleto'
        ELSE 'Completo'
      END AS status
    FROM public.females_denorm f
    CROSS JOIN (VALUES ('sire'),('mgs'),('mmgs')) AS r(role)
    WHERE f.farm_id = p_farm
  )
  SELECT role, status, count(*)::int AS n,
    round(100.0*count(*)/sum(count(*)) OVER (PARTITION BY role), 1) AS pct
  FROM base GROUP BY role, status ORDER BY role, status;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ag_top_parents(p_farm uuid, p_parent_type text, p_year_from integer, p_year_to integer, p_limit integer, p_order_trait text, p_age_filter text)
 RETURNS TABLE(parent_label text, daughters_count integer, trait_mean numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
BEGIN
  IF NOT public.can_access_farm(p_farm) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  RETURN QUERY
  WITH base AS (
    SELECT
      CASE WHEN lower(p_parent_type) = 'sire' THEN
        coalesce(nullif(trim(concat_ws(' - ', nullif(to_jsonb(f)->>'sire_short_name',''), nullif(to_jsonb(f)->>'sire_naab',''))),''),
          nullif(trim(to_jsonb(f)->>'sire_name'),''), nullif(trim(to_jsonb(f)->>'sire'),''), 'Desconhecido')
      ELSE
        coalesce(nullif(trim(concat_ws(' - ', nullif(to_jsonb(f)->>'mgs_short_name',''), nullif(to_jsonb(f)->>'mgs_naab',''))),''),
          nullif(trim(concat_ws(' - ', nullif(to_jsonb(f)->>'maternal_grandsire_short_name',''), nullif(to_jsonb(f)->>'maternal_grandsire_naab',''))),''),
          nullif(trim(to_jsonb(f)->>'mgs_name'),''), nullif(trim(to_jsonb(f)->>'maternal_grandsire'),''), 'Desconhecido')
      END AS parent_label,
      (to_jsonb(f)->>p_order_trait) AS trait_raw
    FROM public.females_denorm f
    WHERE f.farm_id = p_farm
      AND extract(year FROM f.birth_date)::int BETWEEN p_year_from AND p_year_to
      AND (coalesce(p_age_filter, 'Todas') = 'Todas' OR public.ag_age_group(f.birth_date, f.parity_order) = p_age_filter)
  ),
  agg AS (
    SELECT parent_label, count(*)::int AS daughters_count,
      CASE WHEN p_order_trait IS NOT NULL
        THEN avg(CASE WHEN public.ag_is_numeric(trait_raw) THEN trait_raw::numeric END)
      END::numeric AS trait_mean
    FROM base GROUP BY parent_label
  )
  SELECT parent_label, daughters_count, trait_mean FROM agg
  ORDER BY daughters_count DESC, parent_label ASC LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ag_quartis_overview(p_farm uuid, p_index text, p_traits text[])
 RETURNS TABLE(group_label text, trait_key text, mean_value numeric, n integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
BEGIN
  IF NOT public.can_access_farm(p_farm) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  RETURN QUERY
  WITH thresholds AS (
    SELECT public.ag_percentile_disc(p_index, 0.75, 'farm', p_farm) AS p75,
           public.ag_percentile_disc(p_index, 0.25, 'farm', p_farm) AS p25
  ),
  vals AS (
    SELECT
      CASE WHEN public.ag_is_numeric(to_jsonb(f)->>p_index) AND (to_jsonb(f)->>p_index)::numeric >= (SELECT p75 FROM thresholds) THEN 'Top25'
           WHEN public.ag_is_numeric(to_jsonb(f)->>p_index) AND (to_jsonb(f)->>p_index)::numeric <= (SELECT p25 FROM thresholds) THEN 'Bottom25'
           ELSE null END AS group_label,
      t AS trait_key, (to_jsonb(f)->>t)::numeric AS value
    FROM public.females_denorm f CROSS JOIN unnest(p_traits) t
    WHERE f.farm_id = p_farm AND public.ag_is_numeric(to_jsonb(f)->>t)
  )
  SELECT group_label, trait_key, avg(value)::numeric AS mean_value, count(*)::int AS n
  FROM vals WHERE group_label IS NOT NULL GROUP BY group_label, trait_key ORDER BY group_label, trait_key;
END;
$function$;
