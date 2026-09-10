-- Amplia recalc_placeholder_bulls(): quando a média da safra fixa (2020/2017)
-- não tem uma trait preenchida em NENHUM touro daquele ano (AVG retorna NULL),
-- usa a média de TODOS os touros ativos como fallback pra aquela coluna
-- especifica, via COALESCE. Colunas que já têm valor na safra fixa continuam
-- IDÊNTICAS (COALESCE só age quando o primeiro lado é NULL).
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
      pta_milk        = COALESCE(s.pta_milk, g.pta_milk),
      pta_fat         = COALESCE(s.pta_fat, g.pta_fat),
      pta_fat_pct     = COALESCE(s.pta_fat_pct, g.pta_fat_pct),
      pta_protein     = COALESCE(s.pta_protein, g.pta_protein),
      pta_protein_pct = COALESCE(s.pta_protein_pct, g.pta_protein_pct),
      pta_pl          = COALESCE(s.pta_pl, g.pta_pl),
      pta_scs         = COALESCE(s.pta_scs, g.pta_scs),
      pta_dpr         = COALESCE(s.pta_dpr, g.pta_dpr),
      pta_hcr         = COALESCE(s.pta_hcr, g.pta_hcr),
      pta_ccr         = COALESCE(s.pta_ccr, g.pta_ccr),
      pta_livability  = COALESCE(s.pta_livability, g.pta_livability),
      pta_sce         = COALESCE(s.pta_sce, g.pta_sce),
      pta_sire_sce    = COALESCE(s.pta_sire_sce, g.pta_sire_sce),
      pta_type        = COALESCE(s.pta_type, g.pta_type),
      pta_udder       = COALESCE(s.pta_udder, g.pta_udder),
      pta_feet_legs   = COALESCE(s.pta_feet_legs, g.pta_feet_legs),
      pta_ptat        = COALESCE(s.pta_ptat, g.pta_ptat),
      pta_udc         = COALESCE(s.pta_udc, g.pta_udc),
      pta_flc         = COALESCE(s.pta_flc, g.pta_flc),
      pta_bdc         = COALESCE(s.pta_bdc, g.pta_bdc),
      tpi             = COALESCE(s.tpi, g.tpi),
      nmpf            = COALESCE(s.nmpf, g.nmpf),
      cheese_merit    = COALESCE(s.cheese_merit, g.cheese_merit),
      fluid_merit     = COALESCE(s.fluid_merit, g.fluid_merit),
      grazing_merit   = COALESCE(s.grazing_merit, g.grazing_merit),
      hhp_dollar      = COALESCE(s.hhp_dollar, g.hhp_dollar),
      nm_dollar       = COALESCE(s.nm_dollar, g.nm_dollar),
      cm_dollar       = COALESCE(s.cm_dollar, g.cm_dollar),
      fm_dollar       = COALESCE(s.fm_dollar, g.fm_dollar),
      gm_dollar       = COALESCE(s.gm_dollar, g.gm_dollar),
      f_sav           = COALESCE(s.f_sav, g.f_sav),
      cfp             = COALESCE(s.cfp, g.cfp),
      mast            = COALESCE(s.mast, g.mast),
      met             = COALESCE(s.met, g.met),
      rp              = COALESCE(s.rp, g.rp),
      da              = COALESCE(s.da, g.da),
      ket             = COALESCE(s.ket, g.ket),
      mf_num          = COALESCE(s.mf_num, g.mf_num),
      h_liv           = COALESCE(s.h_liv, g.h_liv),
      ccr_num         = COALESCE(s.ccr_num, g.ccr_num),
      hcr_num         = COALESCE(s.hcr_num, g.hcr_num),
      fi              = COALESCE(s.fi, g.fi),
      gl              = COALESCE(s.gl, g.gl),
      bwc             = COALESCE(s.bwc, g.bwc),
      sta             = COALESCE(s.sta, g.sta),
      str_num         = COALESCE(s.str_num, g.str_num),
      dfm             = COALESCE(s.dfm, g.dfm),
      rua             = COALESCE(s.rua, g.rua),
      rls             = COALESCE(s.rls, g.rls),
      rtp             = COALESCE(s.rtp, g.rtp),
      ftl             = COALESCE(s.ftl, g.ftl),
      rw              = COALESCE(s.rw, g.rw),
      rlr             = COALESCE(s.rlr, g.rlr),
      fta             = COALESCE(s.fta, g.fta),
      fls             = COALESCE(s.fls, g.fls),
      fua             = COALESCE(s.fua, g.fua),
      ruh             = COALESCE(s.ruh, g.ruh),
      ruw             = COALESCE(s.ruw, g.ruw),
      ucl             = COALESCE(s.ucl, g.ucl),
      udp             = COALESCE(s.udp, g.udp),
      ftp             = COALESCE(s.ftp, g.ftp),
      rfi             = COALESCE(s.rfi, g.rfi),
      gfi             = COALESCE(s.gfi, g.gfi),
      ssb             = COALESCE(s.ssb, g.ssb),
      dsb             = COALESCE(s.dsb, g.dsb),
      updated_at      = now()
    FROM (
      SELECT
        AVG(pta_milk) AS pta_milk, AVG(pta_fat) AS pta_fat, AVG(pta_fat_pct) AS pta_fat_pct,
        AVG(pta_protein) AS pta_protein, AVG(pta_protein_pct) AS pta_protein_pct, AVG(pta_pl) AS pta_pl,
        AVG(pta_scs) AS pta_scs, AVG(pta_dpr) AS pta_dpr, AVG(pta_hcr) AS pta_hcr, AVG(pta_ccr) AS pta_ccr,
        AVG(pta_livability) AS pta_livability, AVG(pta_sce) AS pta_sce, AVG(pta_sire_sce) AS pta_sire_sce,
        AVG(pta_type) AS pta_type, AVG(pta_udder) AS pta_udder, AVG(pta_feet_legs) AS pta_feet_legs,
        AVG(pta_ptat) AS pta_ptat, AVG(pta_udc) AS pta_udc, AVG(pta_flc) AS pta_flc, AVG(pta_bdc) AS pta_bdc,
        AVG(tpi) AS tpi, AVG(nmpf) AS nmpf, AVG(cheese_merit) AS cheese_merit, AVG(fluid_merit) AS fluid_merit,
        AVG(grazing_merit) AS grazing_merit, AVG(hhp_dollar) AS hhp_dollar, AVG(nm_dollar) AS nm_dollar,
        AVG(cm_dollar) AS cm_dollar, AVG(fm_dollar) AS fm_dollar, AVG(gm_dollar) AS gm_dollar, AVG(f_sav) AS f_sav,
        AVG(cfp) AS cfp, AVG(mast) AS mast, AVG(met) AS met, AVG(rp) AS rp, AVG(da) AS da, AVG(ket) AS ket,
        AVG(mf_num) AS mf_num, AVG(h_liv) AS h_liv, AVG(ccr_num) AS ccr_num, AVG(hcr_num) AS hcr_num,
        AVG(fi) AS fi, AVG(gl) AS gl, AVG(bwc) AS bwc, AVG(sta) AS sta, AVG(str_num) AS str_num, AVG(dfm) AS dfm,
        AVG(rua) AS rua, AVG(rls) AS rls, AVG(rtp) AS rtp, AVG(ftl) AS ftl, AVG(rw) AS rw, AVG(rlr) AS rlr,
        AVG(fta) AS fta, AVG(fls) AS fls, AVG(fua) AS fua, AVG(ruh) AS ruh, AVG(ruw) AS ruw, AVG(ucl) AS ucl,
        AVG(udp) AS udp, AVG(ftp) AS ftp, AVG(rfi) AS rfi, AVG(gfi) AS gfi, AVG(ssb) AS ssb, AVG(dsb) AS dsb
      FROM public.bulls
      WHERE ativo = true
        AND birth_date IS NOT NULL
        AND EXTRACT(YEAR FROM birth_date) = cohort_year
        AND naab_code NOT IN ('007HO00001','007HO00002')
    ) s
    CROSS JOIN (
      -- Fallback global: quando NENHUM touro da safra fixa tem a trait
      -- preenchida (comum em índices novos como F SAV/H LIV/GL/RFI/DCE, que
      -- não existiam nas provas de 2017/2020), usa a média de todos os touros
      -- ativos do banco, independente do ano de nascimento.
      SELECT
        AVG(pta_milk) AS pta_milk, AVG(pta_fat) AS pta_fat, AVG(pta_fat_pct) AS pta_fat_pct,
        AVG(pta_protein) AS pta_protein, AVG(pta_protein_pct) AS pta_protein_pct, AVG(pta_pl) AS pta_pl,
        AVG(pta_scs) AS pta_scs, AVG(pta_dpr) AS pta_dpr, AVG(pta_hcr) AS pta_hcr, AVG(pta_ccr) AS pta_ccr,
        AVG(pta_livability) AS pta_livability, AVG(pta_sce) AS pta_sce, AVG(pta_sire_sce) AS pta_sire_sce,
        AVG(pta_type) AS pta_type, AVG(pta_udder) AS pta_udder, AVG(pta_feet_legs) AS pta_feet_legs,
        AVG(pta_ptat) AS pta_ptat, AVG(pta_udc) AS pta_udc, AVG(pta_flc) AS pta_flc, AVG(pta_bdc) AS pta_bdc,
        AVG(tpi) AS tpi, AVG(nmpf) AS nmpf, AVG(cheese_merit) AS cheese_merit, AVG(fluid_merit) AS fluid_merit,
        AVG(grazing_merit) AS grazing_merit, AVG(hhp_dollar) AS hhp_dollar, AVG(nm_dollar) AS nm_dollar,
        AVG(cm_dollar) AS cm_dollar, AVG(fm_dollar) AS fm_dollar, AVG(gm_dollar) AS gm_dollar, AVG(f_sav) AS f_sav,
        AVG(cfp) AS cfp, AVG(mast) AS mast, AVG(met) AS met, AVG(rp) AS rp, AVG(da) AS da, AVG(ket) AS ket,
        AVG(mf_num) AS mf_num, AVG(h_liv) AS h_liv, AVG(ccr_num) AS ccr_num, AVG(hcr_num) AS hcr_num,
        AVG(fi) AS fi, AVG(gl) AS gl, AVG(bwc) AS bwc, AVG(sta) AS sta, AVG(str_num) AS str_num, AVG(dfm) AS dfm,
        AVG(rua) AS rua, AVG(rls) AS rls, AVG(rtp) AS rtp, AVG(ftl) AS ftl, AVG(rw) AS rw, AVG(rlr) AS rlr,
        AVG(fta) AS fta, AVG(fls) AS fls, AVG(fua) AS fua, AVG(ruh) AS ruh, AVG(ruw) AS ruw, AVG(ucl) AS ucl,
        AVG(udp) AS udp, AVG(ftp) AS ftp, AVG(rfi) AS rfi, AVG(gfi) AS gfi, AVG(ssb) AS ssb, AVG(dsb) AS dsb
      FROM public.bulls
      WHERE ativo = true
        AND naab_code NOT IN ('007HO00001','007HO00002')
    ) g
    WHERE b.naab_code = target_naab;
  END LOOP;
END;
$$;

SELECT public.recalc_placeholder_bulls();
