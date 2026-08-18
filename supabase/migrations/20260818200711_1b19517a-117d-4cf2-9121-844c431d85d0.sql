CREATE INDEX IF NOT EXISTS idx_bulls_name_trgm ON public.bulls USING gin (name gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_bulls(q text, limit_count integer DEFAULT 20)
 RETURNS TABLE(id uuid, code text, name text, registration text, birth_date date, company text, sire_naab text, mgs_naab text, mmgs_naab text, hhp_dollar numeric, tpi numeric, nm_dollar numeric, cm_dollar numeric, fm_dollar numeric, gm_dollar numeric, f_sav numeric, ptam numeric, cfp numeric, ptaf numeric, ptaf_pct numeric, ptap numeric, ptap_pct numeric, pl numeric, dpr numeric, liv numeric, scs numeric, mast numeric, met numeric, rp numeric, da numeric, ket numeric, mf numeric, ptat numeric, udc numeric, flc numeric, sce numeric, dce numeric, ssb numeric, dsb numeric, h_liv numeric, ccr numeric, hcr numeric, fi numeric, bwc numeric, sta numeric, str numeric, dfm numeric, rua numeric, rls numeric, rtp numeric, ftl numeric, rw numeric, rlr numeric, fta numeric, fls numeric, fua numeric, ruh numeric, ruw numeric, ucl numeric, udp numeric, ftp numeric, rfi numeric, beta_casein text, kappa_casein text, gfi numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  trimmed text;
  expanded text;
  all_variants text[];
BEGIN
  trimmed := TRIM(q);
  IF trimmed = '' THEN
    RETURN;
  END IF;

  expanded := public.expand_naab_query(trimmed);
  IF expanded IS NOT NULL THEN
    all_variants := public.naab_variants(expanded);
  ELSE
    all_variants := ARRAY[]::text[];
  END IF;

  RETURN QUERY
  WITH matches AS (
    -- exact/variant NAAB matches (btree on code_normalized)
    SELECT b.id, 1 AS rk
    FROM public.bulls b
    WHERE array_length(all_variants, 1) > 0
      AND b.code_normalized = ANY(all_variants)
    UNION
    -- NAAB prefix matches (btree range scan on code_normalized)
    SELECT b.id, 3 AS rk
    FROM public.bulls b
    WHERE expanded IS NOT NULL
      AND b.code_normalized >= expanded
      AND b.code_normalized < expanded || CHR(255)
    UNION
    -- name matches (gin trigram)
    SELECT b.id,
           CASE WHEN b.name ILIKE trimmed || '%' THEN 2 ELSE 4 END AS rk
    FROM public.bulls b
    WHERE b.name ILIKE '%' || trimmed || '%'
  ),
  ranked AS (
    SELECT m.id, MIN(m.rk) AS rk
    FROM matches m
    GROUP BY m.id
  )
  SELECT
    bd.id, bd.code, bd.name, bd.registration, bd.birth_date, bd.company,
    bd.sire_naab, bd.mgs_naab, bd.mmgs_naab,
    bd.hhp_dollar, bd.tpi, bd.nm_dollar, bd.cm_dollar, bd.fm_dollar, bd.gm_dollar,
    bd.f_sav, bd.ptam, bd.cfp, bd.ptaf, bd.ptaf_pct, bd.ptap, bd.ptap_pct,
    bd.pl, bd.dpr, bd.liv, bd.scs, bd.mast, bd.met, bd.rp, bd.da, bd.ket, bd.mf,
    bd.ptat, bd.udc, bd.flc, bd.sce, bd.dce, bd.ssb, bd.dsb, bd.h_liv,
    bd.ccr, bd.hcr, bd.fi, bd.bwc, bd.sta, bd.str, bd.dfm, bd.rua, bd.rls,
    bd.rtp, bd.ftl, bd.rw, bd.rlr, bd.fta, bd.fls, bd.fua, bd.ruh, bd.ruw,
    bd.ucl, bd.udp, bd.ftp, bd.rfi, bd.beta_casein, bd.kappa_casein, bd.gfi
  FROM ranked r
  JOIN public.bulls_denorm bd ON bd.id = r.id
  ORDER BY r.rk, bd.tpi DESC NULLS LAST
  LIMIT limit_count;
END;
$function$;