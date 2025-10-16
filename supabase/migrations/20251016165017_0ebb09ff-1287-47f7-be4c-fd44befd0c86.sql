-- ============================================
-- FIX REMAINING FUNCTIONS WITHOUT SET search_path
-- Complete the security hardening for all functions
-- ============================================

-- Fix ag_* analytical functions
CREATE OR REPLACE FUNCTION public.ag_percentile_disc(p_index text, p numeric, p_scope text, p_farm uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select percentile_disc(p) within group (
           order by nullif(to_jsonb(f)->>p_index,'')::numeric
         )
  from public.females_denorm f
  where (p_scope = 'farm' and f.farm_id = p_farm)
    and public.ag_is_numeric(to_jsonb(f)->>p_index);
$function$;

CREATE OR REPLACE FUNCTION public.ag_is_numeric(p text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select coalesce($1 ~ '^-?[0-9]+(\.[0-9]+)?$', false);
$function$;

CREATE OR REPLACE FUNCTION public.ag_age_group(p_birth_ts timestamp without time zone, p_parity integer)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  age_months int;
begin
  if p_parity is not null and p_parity >= 3 then
    return 'Multípara';
  elsif p_parity = 2 then
    return 'Secundípara';
  elsif p_parity = 1 then
    return 'Primípara';
  else
    age_months := (
      date_part('year', age(current_date, p_birth_ts::date)) * 12
      + date_part('month', age(current_date, p_birth_ts::date))
    )::int;

    if age_months < 12 then
      return 'Bezerra';
    else
      return 'Novilha';
    end if;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ag_age_group(p_birth_tstz timestamp with time zone, p_parity integer)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select public.ag_age_group($1::timestamp, $2)
$function$;

CREATE OR REPLACE FUNCTION public.ag_age_group(p_birth_date date, p_parity integer)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select public.ag_age_group($1::timestamp, $2)
$function$;

CREATE OR REPLACE FUNCTION public.ag_col_exists(p_col text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists(
    select 1
    from information_schema.columns
    where table_schema='public'
      and table_name='females_denorm'
      and column_name = p_col
  );
$function$;

CREATE OR REPLACE FUNCTION public.ag_pick_col(p_candidates text[])
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare c text;
begin
  foreach c in array p_candidates loop
    if ag_col_exists(c) then
      return c;
    end if;
  end loop;
  return null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ag_mean_generic(p_farm uuid, p_col text, p_year integer DEFAULT NULL::integer)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  v_sql text;
  v_val numeric;
begin
  v_sql := format(
    'select avg((to_jsonb(f)->>%s)::numeric)
       from public.females_denorm f
      where f.farm_id = $1
        and (to_jsonb(f)->>%s) is not null
        and ($2 is null or extract(year from f.birth_date) = $2)',
    quote_literal(p_col), quote_literal(p_col)
  );

  execute v_sql into v_val using p_farm, p_year;
  return v_val;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ag_parentesco_triad(p_farm uuid, p_year_from integer DEFAULT NULL::integer, p_year_to integer DEFAULT NULL::integer)
 RETURNS TABLE(status text, total integer, pct numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_sire  text := ag_pick_col(array['sire_id','sire_naab','sire_short_name']);
  v_mgs   text := ag_pick_col(array['mgs_id','mgs_naab','mgs_short_name']);
  v_mmgs  text := ag_pick_col(array['mmgs_id','mmgs_naab','mmgs_short_name']);
  v_cols  text[];
  v_all_not_null text;
  v_all_null     text;
  v_sql   text;
begin
  v_cols := array_remove(array[v_sire, v_mgs, v_mmgs], null);

  if array_length(v_cols,1) is null then
    return;
  end if;

  v_all_not_null := array_to_string( array(
    select format('%s is not null', quote_ident(c)) from unnest(v_cols) c
  ), ' AND ');

  v_all_null := array_to_string( array(
    select format('%s is null', quote_ident(c)) from unnest(v_cols) c
  ), ' AND ');

  v_sql := format($f$
    with base as (
      select *
      from public.females_denorm f
      where f.farm_id = $1
        and ($2 is null or extract(year from f.birth_date) >= $2)
        and ($3 is null or extract(year from f.birth_date) <= $3)
    ),
    cls as (
      select case
        when %1$s then 'Completo'
        when %2$s then 'Desconhecido'
        else 'Incompleto'
      end as status
      from base
    )
    select status, count(*)::int total,
           100.0 * count(*)/nullif((select count(*) from base),0) pct
    from cls
    group by status
    order by status
  $f$, v_all_not_null, v_all_null);

  return query execute v_sql using p_farm, p_year_from, p_year_to;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ag_parentesco_relacao_ano(p_farm uuid, p_relacao text, p_year_from integer DEFAULT NULL::integer, p_year_to integer DEFAULT NULL::integer)
 RETURNS TABLE(birth_year integer, status text, total integer, pct numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_col text;
  v_sql text;
begin
  if lower(p_relacao) = 'sire'  then
    v_col := ag_pick_col(array['sire_id','sire_naab','sire_short_name']);
  elsif lower(p_relacao) = 'mgs' then
    v_col := ag_pick_col(array['mgs_id','mgs_naab','mgs_short_name']);
  elsif lower(p_relacao) = 'mmgs' then
    v_col := ag_pick_col(array['mmgs_id','mmgs_naab','mmgs_short_name']);
  else
    v_col := null;
  end if;

  if v_col is null then
    return;
  end if;

  v_sql := format($f$
    with base as (
      select extract(year from f.birth_date)::int as birth_year,
             case when %1$s is not null then 'Reconhecido' else 'Não reconhecido' end as status
      from public.females_denorm f
      where f.farm_id = $1
        and ($2 is null or extract(year from f.birth_date) >= $2)
        and ($3 is null or extract(year from f.birth_date) <= $3)
    )
    select birth_year, status, count(*)::int total,
           100.0 * count(*)/nullif(sum(count(*)) over (partition by birth_year),0) pct
    from base
    group by birth_year, status
    order by birth_year, status
  $f$, quote_ident(v_col));

  return query execute v_sql using p_farm, p_year_from, p_year_to;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ag_progress_compare(p_farm uuid, p_traits text[], p_grouping text)
 RETURNS TABLE(trait_key text, group_label text, slope_per_year numeric, n_years integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  v_group_expr text;
  v_sql text;
begin
  if lower(p_grouping) = 'category' then
    v_group_expr := 'coalesce(f.category, ''Sem Categoria'')';
  else
    v_group_expr := 'ag_age_group(f.birth_date, f.parity_order)';
  end if;

  v_sql := format($sql$
    with vals as (
      select %1$s as group_label,
             extract(year from f.birth_date)::int as year,
             t as trait_key,
             nullif(to_jsonb(f)->>t,'')::numeric as value
      from public.females_denorm f
      cross join unnest($2::text[]) t
      where f.farm_id = $1
        and nullif(to_jsonb(f)->>t,'') ~ '^-?[0-9]+(\.[0-9]+)?$'
    ),
    yearly as (
      select group_label, trait_key, year, avg(value) as y
      from vals
      group by group_label, trait_key, year
    )
    select trait_key, group_label,
           regr_slope(y, year::numeric)::numeric as slope_per_year,
           count(distinct year)::int as n_years
    from yearly
    group by trait_key, group_label
    order by trait_key, group_label
  $sql$, v_group_expr);

  return query execute v_sql using p_farm, p_traits;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ag_get_pta_series(p_farm_id uuid, p_tipo_pta text)
 RETURNS TABLE(ano integer, media_ponderada_ano numeric, n_total_ano integer, media_geral numeric, slope numeric, intercept numeric, r2 numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with serie as (
    select ano, media_ponderada_ano, n_total_ano
    from public.ag_pta_ponderada_anual
    where farm_id = p_farm_id
      and tipo_pta = upper(trim(p_tipo_pta))
  ),
  mgeral as (
    select (sum(media_ponderada_ano * n_total_ano)::numeric
       / nullif(sum(n_total_ano),0))::numeric as media_geral
    from serie
  ),
  reg as (
    select
      case when count(*) >= 2 then regr_slope(media_ponderada_ano, ano)::numeric end as slope,
      case when count(*) >= 2 then regr_intercept(media_ponderada_ano, ano)::numeric end as intercept,
      case when count(*) >= 3 then regr_r2(media_ponderada_ano, ano)::numeric end       as r2
    from serie
  )
  select s.ano, s.media_ponderada_ano, s.n_total_ano, mg.media_geral,
         r.slope, r.intercept, r.r2
  from serie s
  cross join mgeral mg
  cross join reg r
  order by s.ano;
$function$;

CREATE OR REPLACE FUNCTION public.ag_get_pta_media_anual(p_farm_id uuid, p_tipo_pta text)
 RETURNS TABLE(ano integer, media_anual numeric, media_geral numeric, slope numeric, intercept numeric, r2 numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with serie as (
    select ano, media_anual
    from public.ag_pta_media_anual
    where farm_id = p_farm_id
      and tipo_pta = upper(trim(p_tipo_pta))
    order by ano
  ),
  mgeral as (
    select avg(media_anual)::numeric as media_geral
    from serie
  ),
  reg as (
    select
      case when count(*) >= 2 then regr_slope(media_anual, ano)::numeric end as slope,
      case when count(*) >= 2 then regr_intercept(media_anual, ano)::numeric end as intercept,
      case when count(*) >= 3 then regr_r2(media_anual, ano)::numeric end as r2
    from serie
  )
  select s.ano, s.media_anual, mg.media_geral,
         r.slope, r.intercept, r.r2
  from serie s
  cross join mgeral mg
  cross join reg r
  order by s.ano;
$function$;

CREATE OR REPLACE FUNCTION public.nx3_normalize_trait(p_trait text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  t text := lower(trim(p_trait));
begin
  if t in ('nm$', 'nm_dollar','nm') then return 'nm_dollar';
  elsif t in ('hhp$', 'hhp_dollar','hhp') then return 'hhp_dollar';
  elsif t in ('dwp$', 'dwp_dollar','dwp') then return 'dwp_dollar';
  else return t;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_naab(input_naab text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
    normalized TEXT;
BEGIN
    IF input_naab IS NULL OR input_naab = '' THEN
        RETURN NULL;
    END IF;
    
    normalized := UPPER(REPLACE(REPLACE(TRIM(input_naab), ' ', ''), '-', ''));
    normalized := regexp_replace(normalized, '^0+([1-9][0-9]*[A-Z]+)', '\1');
    normalized := regexp_replace(normalized, '^0+([A-Z]+)', '\1');
    
    RETURN normalized;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select coalesce(
    current_setting('request.jwt.claims', true)::jsonb ? 'role'
    and (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin',
  false);
$function$;

CREATE OR REPLACE FUNCTION public.has_farm_membership()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.user_farms uf where uf.user_id = auth.uid());
$function$;

CREATE OR REPLACE FUNCTION public.is_jsonb(text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM $1::jsonb;
  RETURN TRUE;
EXCEPTION WHEN others THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin new.updated_at = now(); return new; end; $function$;

CREATE OR REPLACE FUNCTION public.ag_farm_trait_coverage(p_farm uuid, p_traits text[])
 RETURNS TABLE(trait_key text, n_with_value integer, n_total integer, coverage_pct numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with base as (
    select t as trait_key,
           nullif(to_jsonb(f)->>t,'') as raw
    from public.females_denorm f
    cross join unnest($2::text[]) t
    where f.farm_id = $1
  )
  select trait_key,
         count(*) filter (where raw ~ '^-?[0-9]+(\.[0-9]+)?$') as n_with_value,
         count(*) as n_total,
         case when count(*)=0 then 0
              else 100.0*count(*) filter (where raw ~ '^-?[0-9]+(\.[0-9]+)?$')/count(*)
         end::numeric as coverage_pct
  from base
  group by trait_key
  order by trait_key;
$function$;