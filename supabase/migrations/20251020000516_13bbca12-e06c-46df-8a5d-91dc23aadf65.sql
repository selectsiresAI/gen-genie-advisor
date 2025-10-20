-- Processar lote restante de females
INSERT INTO public.females (
  farm_id, name, identifier, cdcb_id, birth_date, parity_order,
  category, sire_naab, mgs_naab, mmgs_naab, beta_casein, kappa_casein,
  fonte, hhp_dollar, tpi, nm_dollar, cm_dollar, fm_dollar, gm_dollar,
  f_sav, ptam, cfp, ptaf, ptaf_pct, ptap, ptap_pct, dpr, liv,
  scs, mast, met, rp, da, ket, mf, ptat, udc, flc, sce, dce,
  ssb, dsb, h_liv, ccr, hcr, fi, gl, bwc, sta, str, dfm,
  rua, rls, rtp, ftl, rw, rlr, fta, fls, fua, ruh, ruw, ucl,
  udp, ftp, rfi, gfi
)
SELECT 
  f.id as farm_id,
  COALESCE(sf.name, 'Sem nome') as name,
  sf.identifier,
  COALESCE(sf.cdcb_id, sf.numero_registro) as cdcb_id,
  public.parse_staging_date(sf.birth_date) as birth_date,
  CASE WHEN sf.parity_order ~ '^\d+$' THEN sf.parity_order::integer ELSE NULL END as parity_order,
  sf.category,
  sf.sire_naab,
  sf.mgs_naab,
  sf.mmgs_naab,
  sf.beta_casein,
  sf.kappa_casein,
  'Importação Staging' as fonte,
  sf.hhp_dollar, sf.tpi, sf.nm_dollar, sf.cm_dollar, sf.fm_dollar, sf.gm_dollar,
  sf.fsav, sf.ptam, sf.cfp, sf.ptaf, sf.ptaf_pct, sf.ptap, sf.ptap_pct,
  sf.dpr, sf.liv, sf.scs, sf.mast, sf.met, sf.rp, sf.da, sf.ket, sf.mf,
  sf.ptat, sf.udc, sf.flc, sf.sce, sf.dce, sf.ssb, sf.dsb, sf.hliv,
  sf.ccr, sf.hcr, sf.fi, sf.gl, sf.bwc, sf.sta, sf.str, sf.dfm,
  sf.rua, sf.rls, sf.rtp, sf.ftl, sf.rw, sf.rlr, sf.fta, sf.fls, sf.fua,
  sf.ruh, sf.ruw, sf.ucl, sf.udp, sf.ftp, sf.rfi, sf.gfi
FROM public.staging_females sf
JOIN public.farms f ON f.staging_raw_id = sf.farm_id
WHERE sf.imported_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.females fem
    WHERE fem.farm_id = f.id
      AND sf.cdcb_id IS NOT NULL 
      AND fem.cdcb_id = sf.cdcb_id
  )
LIMIT 50000;