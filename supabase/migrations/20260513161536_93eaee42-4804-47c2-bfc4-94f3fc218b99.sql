-- 1) Função que recalcula PTAs dos placeholders como média da geração
CREATE OR REPLACE FUNCTION public.recalc_placeholder_bulls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cohort_year integer;
  target_naab text;
BEGIN
  FOR cohort_year, target_naab IN
    SELECT * FROM (VALUES (2020, '007HO00001'::text), (2017, '007HO00002'::text)) AS t(y, n)
  LOOP
    UPDATE public.bulls b
    SET
      pta_milk        = s.pta_milk,
      pta_fat         = s.pta_fat,
      pta_fat_pct     = s.pta_fat_pct,
      pta_protein     = s.pta_protein,
      pta_protein_pct = s.pta_protein_pct,
      pta_pl          = s.pta_pl,
      pta_scs         = s.pta_scs,
      pta_dpr         = s.pta_dpr,
      pta_hcr         = s.pta_hcr,
      pta_ccr         = s.pta_ccr,
      pta_livability  = s.pta_livability,
      pta_sce         = s.pta_sce,
      pta_sire_sce    = s.pta_sire_sce,
      pta_type        = s.pta_type,
      pta_udder       = s.pta_udder,
      pta_feet_legs   = s.pta_feet_legs,
      pta_ptat        = s.pta_ptat,
      pta_udc         = s.pta_udc,
      pta_flc         = s.pta_flc,
      pta_bdc         = s.pta_bdc,
      tpi             = s.tpi,
      nmpf            = s.nmpf,
      cheese_merit    = s.cheese_merit,
      fluid_merit     = s.fluid_merit,
      grazing_merit   = s.grazing_merit,
      hhp_dollar      = s.hhp_dollar,
      nm_dollar       = s.nm_dollar,
      cm_dollar       = s.cm_dollar,
      fm_dollar       = s.fm_dollar,
      gm_dollar       = s.gm_dollar,
      f_sav           = s.f_sav,
      cfp             = s.cfp,
      mast            = s.mast,
      met             = s.met,
      rp              = s.rp,
      da              = s.da,
      ket             = s.ket,
      mf_num          = s.mf_num,
      h_liv           = s.h_liv,
      ccr_num         = s.ccr_num,
      hcr_num         = s.hcr_num,
      fi              = s.fi,
      gl              = s.gl,
      bwc             = s.bwc,
      sta             = s.sta,
      str_num         = s.str_num,
      dfm             = s.dfm,
      rua             = s.rua,
      rls             = s.rls,
      rtp             = s.rtp,
      ftl             = s.ftl,
      rw              = s.rw,
      rlr             = s.rlr,
      fta             = s.fta,
      fls             = s.fls,
      fua             = s.fua,
      ruh             = s.ruh,
      ruw             = s.ruw,
      ucl             = s.ucl,
      udp             = s.udp,
      ftp             = s.ftp,
      rfi             = s.rfi,
      gfi             = s.gfi,
      ssb             = s.ssb,
      dsb             = s.dsb,
      updated_at      = now()
    FROM (
      SELECT
        AVG(pta_milk)        AS pta_milk,
        AVG(pta_fat)         AS pta_fat,
        AVG(pta_fat_pct)     AS pta_fat_pct,
        AVG(pta_protein)     AS pta_protein,
        AVG(pta_protein_pct) AS pta_protein_pct,
        AVG(pta_pl)          AS pta_pl,
        AVG(pta_scs)         AS pta_scs,
        AVG(pta_dpr)         AS pta_dpr,
        AVG(pta_hcr)         AS pta_hcr,
        AVG(pta_ccr)         AS pta_ccr,
        AVG(pta_livability)  AS pta_livability,
        AVG(pta_sce)         AS pta_sce,
        AVG(pta_sire_sce)    AS pta_sire_sce,
        AVG(pta_type)        AS pta_type,
        AVG(pta_udder)       AS pta_udder,
        AVG(pta_feet_legs)   AS pta_feet_legs,
        AVG(pta_ptat)        AS pta_ptat,
        AVG(pta_udc)         AS pta_udc,
        AVG(pta_flc)         AS pta_flc,
        AVG(pta_bdc)         AS pta_bdc,
        AVG(tpi)             AS tpi,
        AVG(nmpf)            AS nmpf,
        AVG(cheese_merit)    AS cheese_merit,
        AVG(fluid_merit)     AS fluid_merit,
        AVG(grazing_merit)   AS grazing_merit,
        AVG(hhp_dollar)      AS hhp_dollar,
        AVG(nm_dollar)       AS nm_dollar,
        AVG(cm_dollar)       AS cm_dollar,
        AVG(fm_dollar)       AS fm_dollar,
        AVG(gm_dollar)       AS gm_dollar,
        AVG(f_sav)           AS f_sav,
        AVG(cfp)             AS cfp,
        AVG(mast)            AS mast,
        AVG(met)             AS met,
        AVG(rp)              AS rp,
        AVG(da)              AS da,
        AVG(ket)             AS ket,
        AVG(mf_num)          AS mf_num,
        AVG(h_liv)           AS h_liv,
        AVG(ccr_num)         AS ccr_num,
        AVG(hcr_num)         AS hcr_num,
        AVG(fi)              AS fi,
        AVG(gl)              AS gl,
        AVG(bwc)             AS bwc,
        AVG(sta)             AS sta,
        AVG(str_num)         AS str_num,
        AVG(dfm)             AS dfm,
        AVG(rua)             AS rua,
        AVG(rls)             AS rls,
        AVG(rtp)             AS rtp,
        AVG(ftl)             AS ftl,
        AVG(rw)              AS rw,
        AVG(rlr)             AS rlr,
        AVG(fta)             AS fta,
        AVG(fls)             AS fls,
        AVG(fua)             AS fua,
        AVG(ruh)             AS ruh,
        AVG(ruw)             AS ruw,
        AVG(ucl)             AS ucl,
        AVG(udp)             AS udp,
        AVG(ftp)             AS ftp,
        AVG(rfi)             AS rfi,
        AVG(gfi)             AS gfi,
        AVG(ssb)             AS ssb,
        AVG(dsb)             AS dsb
      FROM public.bulls
      WHERE ativo = true
        AND birth_date IS NOT NULL
        AND EXTRACT(YEAR FROM birth_date) = cohort_year
        AND naab_code NOT IN ('007HO00001','007HO00002')
    ) s
    WHERE b.naab_code = target_naab;
  END LOOP;
END;
$$;

-- 2) Inserir os dois touros placeholder (idempotente)
INSERT INTO public.bulls (naab_code, name, short_name, breed, birth_date, ativo, company)
VALUES
  ('007HO00001', 'Média Geração 2020 (MGS Placeholder)',  'AVG2020', 'HO', '2020-01-01', false, 'SSB Internal'),
  ('007HO00002', 'Média Geração 2017 (MGGS Placeholder)', 'AVG2017', 'HO', '2017-01-01', false, 'SSB Internal')
ON CONFLICT DO NOTHING;

-- 3) Popular médias agora
SELECT public.recalc_placeholder_bulls();