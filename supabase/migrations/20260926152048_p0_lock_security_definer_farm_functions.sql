-- P0: add can_access_farm() guard to 9 SECURITY DEFINER functions that received
-- farm_id/client_id as a raw parameter with zero ownership check (cross-tenant leak/write).
-- Applied directly to project odactdxpecpiyiyaqfgi on 2026-09-26; this file makes the
-- change reproducible/versioned. See RORDENS audit session 2026-09-26 for full findings.

CREATE OR REPLACE FUNCTION public.ag_genetic_benchmark(p_farm uuid, p_traits text[], p_region text DEFAULT 'BR'::text, p_top integer DEFAULT 5)
 RETURNS TABLE(trait_key text, farm_value numeric, benchmark_top numeric, benchmark_avg numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.can_access_farm(p_farm) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  RETURN QUERY
  WITH params AS (SELECT greatest(1, least(50, coalesce(p_top,5)))::numeric AS top_pct),
  farm_vals AS (
    SELECT t AS trait_key, nullif(to_jsonb(f)->>t,'')::numeric AS value
    FROM public.females_denorm f CROSS JOIN unnest(p_traits) t
    WHERE f.farm_id = p_farm AND nullif(to_jsonb(f)->>t,'') ~ '^-?[0-9]+(\.[0-9]+)?$'
  ),
  pop_vals AS (
    SELECT t AS trait_key, nullif(to_jsonb(f)->>t,'')::numeric AS value
    FROM public.females_denorm f CROSS JOIN unnest(p_traits) t
    WHERE nullif(to_jsonb(f)->>t,'') ~ '^-?[0-9]+(\.[0-9]+)?$'
  ),
  thr AS (
    SELECT p.trait_key, percentile_disc(1 - (pa.top_pct/100.0)) WITHIN GROUP (ORDER BY p.value) AS pctl
    FROM pop_vals p CROSS JOIN params pa GROUP BY p.trait_key, pa.top_pct
  ),
  bench AS (
    SELECT p.trait_key, avg(p.value) AS benchmark_avg,
      avg(p.value) filter (WHERE p.value >= t.pctl) AS benchmark_top
    FROM pop_vals p JOIN thr t USING(trait_key) GROUP BY p.trait_key
  ),
  farm AS (SELECT trait_key, avg(value) AS farm_value FROM farm_vals GROUP BY trait_key)
  SELECT b.trait_key, f.farm_value, b.benchmark_top, b.benchmark_avg
  FROM bench b LEFT JOIN farm f USING(trait_key) ORDER BY b.trait_key;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ag_linear_means(p_farm uuid, p_traits text[], p_mode text, p_normalize boolean, p_scope text, p_scope_id uuid)
 RETURNS TABLE(trait_key text, group_label text, mean_value numeric, n integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.can_access_farm(p_farm) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  RETURN QUERY
  WITH base AS (
    SELECT
      CASE WHEN lower(p_mode) = 'coarse' THEN
        CASE WHEN public.ag_age_group(f.birth_date, f.parity_order) IN ('Bezerra','Novilha') THEN 'Novilhas' ELSE 'Vacas' END
      ELSE public.ag_age_group(f.birth_date, f.parity_order) END AS group_label,
      t AS trait_key, (to_jsonb(f)->>t)::numeric AS value
    FROM public.females_denorm f CROSS JOIN unnest(p_traits) t
    WHERE f.farm_id = p_farm AND public.ag_is_numeric(to_jsonb(f)->>t)
  ),
  overall AS (
    SELECT b2.trait_key, avg(b2.value)::numeric AS mean_farm FROM base b2 GROUP BY b2.trait_key
  )
  SELECT b.trait_key, b.group_label,
    CASE WHEN p_normalize THEN avg(b.value - o.mean_farm) ELSE avg(b.value) END::numeric AS mean_value,
    count(*)::int AS n
  FROM base b JOIN overall o ON o.trait_key = b.trait_key
  GROUP BY b.trait_key, b.group_label ORDER BY b.trait_key, b.group_label;
END; $function$;

CREATE OR REPLACE FUNCTION public.ag_parentage_overview(p_farm uuid)
 RETURNS TABLE(role text, status text, n integer, pct numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

CREATE OR REPLACE FUNCTION public.ag_quartis_indices_compare(p_farm uuid, p_index_a text, p_index_b text, p_traits text[])
 RETURNS TABLE(index_label text, group_label text, trait_key text, mean_value numeric, n integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE a75 numeric; a25 numeric; b75 numeric; b25 numeric;
BEGIN
  IF NOT public.can_access_farm(p_farm) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  a75 := public.ag_percentile_disc(p_index_a, 0.75, 'farm', p_farm);
  a25 := public.ag_percentile_disc(p_index_a, 0.25, 'farm', p_farm);
  b75 := public.ag_percentile_disc(p_index_b, 0.75, 'farm', p_farm);
  b25 := public.ag_percentile_disc(p_index_b, 0.25, 'farm', p_farm);

  RETURN QUERY
  WITH base AS (SELECT f.* FROM public.females_denorm f WHERE f.farm_id = p_farm),
  a_vals AS (
    SELECT 'IndexA'::text AS idx,
      CASE WHEN public.ag_is_numeric(to_jsonb(f)->>p_index_a) AND (to_jsonb(f)->>p_index_a)::numeric >= a75 THEN 'Top25'
           WHEN public.ag_is_numeric(to_jsonb(f)->>p_index_a) AND (to_jsonb(f)->>p_index_a)::numeric <= a25 THEN 'Bottom25'
           ELSE null END AS group_label,
      t AS trait_key, (to_jsonb(f)->>t)::numeric AS value
    FROM base f CROSS JOIN unnest(p_traits) t WHERE public.ag_is_numeric(to_jsonb(f)->>t)
  ),
  b_vals AS (
    SELECT 'IndexB'::text AS idx,
      CASE WHEN public.ag_is_numeric(to_jsonb(f)->>p_index_b) AND (to_jsonb(f)->>p_index_b)::numeric >= b75 THEN 'Top25'
           WHEN public.ag_is_numeric(to_jsonb(f)->>p_index_b) AND (to_jsonb(f)->>p_index_b)::numeric <= b25 THEN 'Bottom25'
           ELSE null END AS group_label,
      t AS trait_key, (to_jsonb(f)->>t)::numeric AS value
    FROM base f CROSS JOIN unnest(p_traits) t WHERE public.ag_is_numeric(to_jsonb(f)->>t)
  ),
  all_vals AS (SELECT * FROM a_vals UNION ALL SELECT * FROM b_vals)
  SELECT v.idx AS index_label, v.group_label, v.trait_key,
    avg(v.value)::numeric AS mean_value, count(*)::int AS n
  FROM all_vals v WHERE v.group_label IS NOT NULL
  GROUP BY v.idx, v.group_label, v.trait_key ORDER BY v.idx, v.group_label, v.trait_key;
END; $function$;

CREATE OR REPLACE FUNCTION public.ag_quartis_overview(p_farm uuid, p_index text, p_traits text[])
 RETURNS TABLE(group_label text, trait_key text, mean_value numeric, n integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

CREATE OR REPLACE FUNCTION public.ag_top_parents(p_farm uuid, p_parent_type text, p_year_from integer, p_year_to integer, p_limit integer, p_order_trait text, p_age_filter text)
 RETURNS TABLE(parent_label text, daughters_count integer, trait_mean numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

CREATE OR REPLACE FUNCTION public.nx3_mothers_yearly_avg(p_trait text, p_farm uuid)
 RETURNS TABLE(birth_year integer, avg_value numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.can_access_farm(p_farm) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'females_denorm'
      AND column_name = p_trait AND data_type IN ('numeric','integer','double precision','real')
  ) THEN RAISE EXCEPTION 'Invalid trait: %', p_trait; END IF;
  RETURN QUERY EXECUTE format(
    'SELECT EXTRACT(YEAR FROM birth_date)::integer AS birth_year, AVG(%I)::numeric AS avg_value
     FROM public.females_denorm WHERE farm_id = $1 AND birth_date IS NOT NULL AND %I IS NOT NULL
     GROUP BY EXTRACT(YEAR FROM birth_date) ORDER BY birth_year', p_trait, p_trait
  ) USING p_farm;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.ag_genetic_benchmark(uuid, text[], text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ag_linear_means(uuid, text[], text, boolean, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ag_parentage_overview(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ag_quartis_indices_compare(uuid, text, text, text[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ag_quartis_overview(uuid, text, text[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ag_top_parents(uuid, text, integer, integer, integer, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.nx3_mothers_yearly_avg(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ag_genetic_benchmark(uuid, text[], text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ag_linear_means(uuid, text[], text, boolean, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ag_parentage_overview(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ag_quartis_indices_compare(uuid, text, text, text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ag_quartis_overview(uuid, text, text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ag_top_parents(uuid, text, integer, integer, integer, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.nx3_mothers_yearly_avg(text, uuid) TO authenticated, service_role;
