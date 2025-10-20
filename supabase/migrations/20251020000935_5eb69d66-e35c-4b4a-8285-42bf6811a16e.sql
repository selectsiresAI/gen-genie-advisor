-- Criar farms faltantes
INSERT INTO public.farms (name, owner_name, created_by, metadata, staging_raw_id)
SELECT 
  COALESCE(sf.name, sf.owner_name, 'Fazenda sem nome'),
  sf.owner_name,
  COALESCE(
    (SELECT p.id FROM profiles p WHERE p.email = sf.created_by_email LIMIT 1),
    (SELECT p.id FROM profiles p ORDER BY created_at LIMIT 1)
  ),
  COALESCE(sf.metadata, '{}'::jsonb),
  sf.raw_id
FROM staging_farms sf
WHERE NOT EXISTS (
  SELECT 1 FROM farms f WHERE f.staging_raw_id = sf.raw_id
);

-- Adicionar owners (com cast correto)
INSERT INTO public.user_farms (user_id, farm_id, role)
SELECT DISTINCT
  COALESCE(
    (SELECT p.id FROM profiles p WHERE p.email = sf.created_by_email LIMIT 1),
    (SELECT p.id FROM profiles p ORDER BY created_at LIMIT 1)
  ),
  f.id,
  'owner'::farm_role
FROM staging_farms sf
JOIN farms f ON f.staging_raw_id = sf.raw_id
WHERE NOT EXISTS (
  SELECT 1 FROM user_farms uf 
  WHERE uf.farm_id = f.id 
);

-- Marcar staging_farms
UPDATE staging_farms SET imported_at = now() WHERE imported_at IS NULL;

-- Migrar females restantes
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
  f.id,
  COALESCE(sf.name, 'Sem nome'),
  sf.identifier,
  COALESCE(sf.cdcb_id, sf.numero_registro),
  public.parse_flexible_date(sf.birth_date),
  CASE WHEN sf.parity_order ~ '^\d+$' THEN sf.parity_order::integer END,
  sf.category,
  sf.sire_naab,
  sf.mgs_naab,
  sf.mmgs_naab,
  sf.beta_casein,
  sf.kappa_casein,
  'Importação Staging',
  sf.hhp_dollar, sf.tpi, sf.nm_dollar, sf.cm_dollar, sf.fm_dollar, sf.gm_dollar,
  sf.fsav, sf.ptam, sf.cfp, sf.ptaf, sf.ptaf_pct, sf.ptap, sf.ptap_pct,
  sf.dpr, sf.liv, sf.scs, sf.mast, sf.met, sf.rp, sf.da, sf.ket, sf.mf,
  sf.ptat, sf.udc, sf.flc, sf.sce, sf.dce, sf.ssb, sf.dsb, sf.hliv,
  sf.ccr, sf.hcr, sf.fi, sf.gl, sf.bwc, sf.sta, sf.str, sf.dfm,
  sf.rua, sf.rls, sf.rtp, sf.ftl, sf.rw, sf.rlr, sf.fta, sf.fls, sf.fua,
  sf.ruh, sf.ruw, sf.ucl, sf.udp, sf.ftp, sf.rfi, sf.gfi
FROM public.staging_females sf
JOIN public.farms f ON f.staging_raw_id = sf.farm_id
WHERE sf.imported_at IS NULL;

-- Marcar todas staging_females como importadas
UPDATE staging_females SET imported_at = now() WHERE imported_at IS NULL;