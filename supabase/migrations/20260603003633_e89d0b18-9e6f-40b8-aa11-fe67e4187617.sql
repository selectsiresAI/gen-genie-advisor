-- 1) Recriar bulls_denorm incluindo gl
DROP VIEW IF EXISTS public.bulls_denorm CASCADE;

CREATE VIEW public.bulls_denorm
WITH (security_invoker = true)
AS
SELECT
  id,
  naab_code AS code,
  name,
  registration,
  birth_date,
  sire_naab,
  mgs_naab,
  mmgs_naab,
  company,
  hhp_dollar,
  tpi,
  nm_dollar,
  cm_dollar,
  fm_dollar,
  gm_dollar,
  f_sav,
  pta_milk        AS ptam,
  cfp,
  pta_fat         AS ptaf,
  pta_fat_pct     AS ptaf_pct,
  pta_protein     AS ptap,
  pta_protein_pct AS ptap_pct,
  pta_pl          AS pl,
  pta_dpr         AS dpr,
  pta_livability  AS liv,
  pta_scs         AS scs,
  mast,
  met,
  rp,
  da,
  ket,
  mf_num          AS mf,
  pta_ptat        AS ptat,
  pta_udc         AS udc,
  pta_flc         AS flc,
  pta_sce         AS sce,
  pta_sire_sce    AS dce,
  ssb,
  dsb,
  h_liv,
  ccr_num         AS ccr,
  hcr_num         AS hcr,
  fi,
  bwc,
  sta,
  str_num         AS str,
  dfm,
  rua,
  rls,
  rtp,
  ftl,
  rw,
  rlr,
  fta,
  fls,
  fua,
  ruh,
  ruw,
  ucl,
  udp,
  ftp,
  rfi,
  beta_casein,
  kappa_casein,
  gfi,
  gl
FROM public.bulls;

GRANT SELECT ON public.bulls_denorm TO authenticated, anon;

-- 2) Recriar get_bull_by_naab incluindo gl no retorno
DROP FUNCTION IF EXISTS public.get_bull_by_naab(text);

CREATE OR REPLACE FUNCTION public.get_bull_by_naab(naab text)
RETURNS TABLE(
  found boolean, bull_id uuid, code text, name text, registration text, birth_date date, company text,
  sire_naab text, mgs_naab text, mmgs_naab text,
  hhp_dollar numeric, tpi numeric, nm_dollar numeric, cm_dollar numeric, fm_dollar numeric, gm_dollar numeric,
  f_sav numeric, ptam numeric, cfp numeric, ptaf numeric, ptaf_pct numeric, ptap numeric, ptap_pct numeric,
  pl numeric, dpr numeric, liv numeric, scs numeric, mast numeric, met numeric, rp numeric, da numeric, ket numeric, mf numeric,
  ptat numeric, udc numeric, flc numeric, sce numeric, dce numeric, ssb numeric, dsb numeric,
  h_liv numeric, ccr numeric, hcr numeric, fi numeric, bwc numeric, sta numeric, str numeric, dfm numeric,
  rua numeric, rls numeric, rtp numeric, ftl numeric, rw numeric, rlr numeric, fta numeric, fls numeric, fua numeric,
  ruh numeric, ruw numeric, ucl numeric, udp numeric, ftp numeric, rfi numeric,
  beta_casein text, kappa_casein text, gfi numeric, gl numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  normalized_input text;
  all_variants text[];
  suffixes text[];
  matched_id uuid;
BEGIN
  normalized_input := public.expand_naab_query(naab);
  IF normalized_input IS NULL THEN RETURN; END IF;

  all_variants := public.naab_variants(normalized_input);

  SELECT b.id INTO matched_id
  FROM public.bulls b
  WHERE b.code_normalized = ANY(all_variants)
  ORDER BY b.tpi DESC NULLS LAST
  LIMIT 1;

  IF matched_id IS NULL THEN
    suffixes := public.naab_breed_number_suffixes(normalized_input);
    IF array_length(suffixes, 1) IS NULL THEN RETURN; END IF;
    SELECT b.id INTO matched_id
    FROM public.bulls b
    WHERE b.breed_number = ANY(suffixes)
    ORDER BY b.tpi DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF matched_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT true, bd.id, bd.code, bd.name, bd.registration, bd.birth_date, bd.company,
    bd.sire_naab, bd.mgs_naab, bd.mmgs_naab,
    bd.hhp_dollar, bd.tpi, bd.nm_dollar, bd.cm_dollar, bd.fm_dollar, bd.gm_dollar,
    bd.f_sav, bd.ptam, bd.cfp, bd.ptaf, bd.ptaf_pct, bd.ptap, bd.ptap_pct,
    bd.pl, bd.dpr, bd.liv, bd.scs, bd.mast, bd.met, bd.rp, bd.da, bd.ket, bd.mf,
    bd.ptat, bd.udc, bd.flc, bd.sce, bd.dce, bd.ssb, bd.dsb,
    bd.h_liv, bd.ccr, bd.hcr, bd.fi, bd.bwc, bd.sta, bd.str, bd.dfm,
    bd.rua, bd.rls, bd.rtp, bd.ftl, bd.rw, bd.rlr, bd.fta, bd.fls, bd.fua,
    bd.ruh, bd.ruw, bd.ucl, bd.udp, bd.ftp, bd.rfi,
    bd.beta_casein, bd.kappa_casein, bd.gfi, bd.gl
  FROM public.bulls_denorm bd WHERE bd.id = matched_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_bull_by_naab(text) TO anon, authenticated;

-- 3) Recriar get_bulls_by_naabs incluindo gl (mantém compatibilidade com chamadores)
DROP FUNCTION IF EXISTS public.get_bulls_by_naabs(text[]);

CREATE OR REPLACE FUNCTION public.get_bulls_by_naabs(p_naabs text[])
RETURNS TABLE(
  input_naab text, found boolean, bull_id uuid, code text, name text, registration text, birth_date date, company text,
  sire_naab text, mgs_naab text, mmgs_naab text,
  hhp_dollar numeric, tpi numeric, nm_dollar numeric, cm_dollar numeric, fm_dollar numeric, gm_dollar numeric,
  f_sav numeric, ptam numeric, cfp numeric, ptaf numeric, ptaf_pct numeric, ptap numeric, ptap_pct numeric,
  pl numeric, dpr numeric, liv numeric, scs numeric, mast numeric, met numeric, rp numeric, da numeric, ket numeric, mf numeric,
  ptat numeric, udc numeric, flc numeric, sce numeric, dce numeric, ssb numeric, dsb numeric,
  h_liv numeric, ccr numeric, hcr numeric, fi numeric, bwc numeric, sta numeric, str numeric, dfm numeric,
  rua numeric, rls numeric, rtp numeric, ftl numeric, rw numeric, rlr numeric, fta numeric, fls numeric, fua numeric,
  ruh numeric, ruw numeric, ucl numeric, udp numeric, ftp numeric, rfi numeric,
  beta_casein text, kappa_casein text, gfi numeric, gl numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_naab text;
  v_normalized text;
  v_variants text[];
  v_suffixes text[];
  v_id uuid;
BEGIN
  FOREACH v_naab IN ARRAY p_naabs LOOP
    v_normalized := public.expand_naab_query(v_naab);
    v_id := NULL;
    IF v_normalized IS NOT NULL THEN
      v_variants := public.naab_variants(v_normalized);
      SELECT b.id INTO v_id FROM public.bulls b
      WHERE b.code_normalized = ANY(v_variants)
      ORDER BY b.tpi DESC NULLS LAST LIMIT 1;

      IF v_id IS NULL THEN
        v_suffixes := public.naab_breed_number_suffixes(v_normalized);
        IF array_length(v_suffixes, 1) IS NOT NULL THEN
          SELECT b.id INTO v_id FROM public.bulls b
          WHERE b.breed_number = ANY(v_suffixes)
          ORDER BY b.tpi DESC NULLS LAST LIMIT 1;
        END IF;
      END IF;
    END IF;

    IF v_id IS NULL THEN
      RETURN QUERY SELECT v_naab, false, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::date, NULL::text,
        NULL::text, NULL::text, NULL::text,
        NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric,
        NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric,
        NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric,
        NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric,
        NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric,
        NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric,
        NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric,
        NULL::text, NULL::text, NULL::numeric, NULL::numeric;
    ELSE
      RETURN QUERY
      SELECT v_naab, true, bd.id, bd.code, bd.name, bd.registration, bd.birth_date, bd.company,
        bd.sire_naab, bd.mgs_naab, bd.mmgs_naab,
        bd.hhp_dollar, bd.tpi, bd.nm_dollar, bd.cm_dollar, bd.fm_dollar, bd.gm_dollar,
        bd.f_sav, bd.ptam, bd.cfp, bd.ptaf, bd.ptaf_pct, bd.ptap, bd.ptap_pct,
        bd.pl, bd.dpr, bd.liv, bd.scs, bd.mast, bd.met, bd.rp, bd.da, bd.ket, bd.mf,
        bd.ptat, bd.udc, bd.flc, bd.sce, bd.dce, bd.ssb, bd.dsb,
        bd.h_liv, bd.ccr, bd.hcr, bd.fi, bd.bwc, bd.sta, bd.str, bd.dfm,
        bd.rua, bd.rls, bd.rtp, bd.ftl, bd.rw, bd.rlr, bd.fta, bd.fls, bd.fua,
        bd.ruh, bd.ruw, bd.ucl, bd.udp, bd.ftp, bd.rfi,
        bd.beta_casein, bd.kappa_casein, bd.gfi, bd.gl
      FROM public.bulls_denorm bd WHERE bd.id = v_id;
    END IF;
  END LOOP;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_bulls_by_naabs(text[]) TO anon, authenticated;

-- 4) Recalcular placeholders com dados frescos (preenche gl, ccr_num, hcr_num conforme houver dado)
SELECT public.recalc_placeholder_bulls();