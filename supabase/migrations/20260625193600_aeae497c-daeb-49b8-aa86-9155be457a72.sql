
-- Add BD (Body Depth) as a new dedicated column on females and bulls
ALTER TABLE public.females ADD COLUMN IF NOT EXISTS bd numeric;
ALTER TABLE public.bulls ADD COLUMN IF NOT EXISTS bd numeric;

-- Recreate denorm views to expose bd
DROP VIEW IF EXISTS public.females_denorm CASCADE;
CREATE VIEW public.females_denorm AS
SELECT id, client_id AS farm_id, client_id, name, identifier, ear_tag, cdcb_id,
  registration, birth_date, breed, category, status, parity_order, fonte,
  sire_naab, mgs_naab, mmgs_naab, hhp_dollar, tpi, nm_dollar, cm_dollar,
  fm_dollar, gm_dollar, f_sav, pta_milk AS ptam, cfp, pta_fat AS ptaf,
  pta_fat_pct AS ptaf_pct, pta_protein AS ptap, pta_protein_pct AS ptap_pct,
  pta_pl AS pl, pta_dpr AS dpr, pta_livability AS liv, pta_scs AS scs,
  mast, met, rp, da, ket, mf_num AS mf, pta_ptat AS ptat, pta_udc AS udc,
  pta_flc AS flc, pta_sce AS sce, pta_sire_sce AS dce, ssb, dsb, h_liv,
  pta_ccr AS ccr, pta_hcr AS hcr, fi, gl, efc, bwc, bd, sta, str_num AS str,
  dfm, rua, rls, rtp, ftl, rw, rlr, fta, fls, fua, ruh, ruw, ucl, udp, ftp,
  rfi, beta_casein, kappa_casein, gfi, nmpf, cheese_merit, fluid_merit,
  grazing_merit, genomic_result_id, created_at, updated_at, deleted_at, ptas
FROM public.females;

GRANT SELECT ON public.females_denorm TO authenticated;
GRANT ALL ON public.females_denorm TO service_role;

DROP VIEW IF EXISTS public.bulls_denorm CASCADE;
CREATE VIEW public.bulls_denorm AS
SELECT id, naab_code AS code, name, registration, birth_date, sire_naab,
  mgs_naab, mmgs_naab, company, hhp_dollar, tpi, nm_dollar, cm_dollar,
  fm_dollar, gm_dollar, f_sav, pta_milk AS ptam, cfp, pta_fat AS ptaf,
  pta_fat_pct AS ptaf_pct, pta_protein AS ptap, pta_protein_pct AS ptap_pct,
  pta_pl AS pl, pta_dpr AS dpr, pta_livability AS liv, pta_scs AS scs,
  mast, met, rp, da, ket, mf_num AS mf, pta_ptat AS ptat, pta_udc AS udc,
  pta_flc AS flc, pta_sce AS sce, pta_sire_sce AS dce, ssb, dsb, h_liv,
  pta_ccr AS ccr, pta_hcr AS hcr, fi, bwc, bd, sta, str_num AS str, dfm,
  rua, rls, rtp, ftl, rw, rlr, fta, fls, fua, ruh, ruw, ucl, udp, ftp,
  rfi, beta_casein, kappa_casein, gfi, gl
FROM public.bulls;

GRANT SELECT ON public.bulls_denorm TO authenticated, anon;
GRANT ALL ON public.bulls_denorm TO service_role;

-- Extend import RPCs to handle bd
CREATE OR REPLACE FUNCTION public.import_females_json(p_client_id uuid, p_data jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET "DateStyle" TO 'ISO, DMY'
 SET search_path TO 'public'
AS $function$
DECLARE
  _count integer;
BEGIN
  INSERT INTO females (
    client_id, identifier, name, category, sire_naab, mgs_naab, mmgs_naab,
    cdcb_id, birth_date, fonte, beta_casein, kappa_casein, parity_order,
    hhp_dollar, tpi, nm_dollar, cm_dollar, fm_dollar, gm_dollar,
    f_sav, pta_milk, cfp, pta_fat, pta_fat_pct, pta_protein, pta_protein_pct,
    pta_pl, pta_dpr, pta_livability, pta_scs, mast, met, rp, da, ket, mf_num,
    pta_ptat, pta_udc, pta_flc, pta_sce, pta_sire_sce, ssb, dsb, h_liv,
    pta_ccr, pta_hcr, fi, gl, efc, bwc, bd, sta, str_num, pta_bdc, dfm, rua,
    rw, rls, rlr, fta, fls, fua, ruh, ruw, ucl, udp, ftp, rtp, ftl, rfi, gfi
  )
  SELECT
    p_client_id,
    r->>'identifier', r->>'name', r->>'category', r->>'sire_naab',
    r->>'mgs_naab', r->>'mmgs_naab', r->>'cdcb_id',
    (r->>'birth_date')::date, r->>'fonte', r->>'beta_casein', r->>'kappa_casein',
    (r->>'parity_order')::numeric, (r->>'hhp_dollar')::numeric,
    (r->>'tpi')::numeric, (r->>'nm_dollar')::numeric, (r->>'cm_dollar')::numeric,
    (r->>'fm_dollar')::numeric, (r->>'gm_dollar')::numeric, (r->>'f_sav')::numeric,
    (r->>'pta_milk')::numeric, (r->>'cfp')::numeric, (r->>'pta_fat')::numeric,
    (r->>'pta_fat_pct')::numeric, (r->>'pta_protein')::numeric, (r->>'pta_protein_pct')::numeric,
    (r->>'pta_pl')::numeric, (r->>'pta_dpr')::numeric, (r->>'pta_livability')::numeric,
    (r->>'pta_scs')::numeric, (r->>'mast')::numeric, (r->>'met')::numeric,
    (r->>'rp')::numeric, (r->>'da')::numeric, (r->>'ket')::numeric, (r->>'mf_num')::numeric,
    (r->>'pta_ptat')::numeric, (r->>'pta_udc')::numeric, (r->>'pta_flc')::numeric,
    (r->>'pta_sce')::numeric, (r->>'pta_sire_sce')::numeric, (r->>'ssb')::numeric,
    (r->>'dsb')::numeric, (r->>'h_liv')::numeric, (r->>'pta_ccr')::numeric,
    (r->>'pta_hcr')::numeric, (r->>'fi')::numeric, (r->>'gl')::numeric,
    (r->>'efc')::numeric, (r->>'bwc')::numeric, (r->>'bd')::numeric, (r->>'sta')::numeric,
    (r->>'str_num')::numeric, (r->>'pta_bdc')::numeric, (r->>'dfm')::numeric,
    (r->>'rua')::numeric, (r->>'rw')::numeric, (r->>'rls')::numeric,
    (r->>'rlr')::numeric, (r->>'fta')::numeric, (r->>'fls')::numeric,
    (r->>'fua')::numeric, (r->>'ruh')::numeric, (r->>'ruw')::numeric,
    (r->>'ucl')::numeric, (r->>'udp')::numeric, (r->>'ftp')::numeric,
    (r->>'rtp')::numeric, (r->>'ftl')::numeric, (r->>'rfi')::numeric,
    (r->>'gfi')::numeric
  FROM jsonb_array_elements(p_data) AS r
  ON CONFLICT (client_id, identifier) WHERE identifier IS NOT NULL AND deleted_at IS NULL
  DO UPDATE SET
    name = COALESCE(EXCLUDED.name, females.name),
    category = COALESCE(EXCLUDED.category, females.category),
    sire_naab = COALESCE(EXCLUDED.sire_naab, females.sire_naab),
    mgs_naab = COALESCE(EXCLUDED.mgs_naab, females.mgs_naab),
    mmgs_naab = COALESCE(EXCLUDED.mmgs_naab, females.mmgs_naab),
    cdcb_id = COALESCE(EXCLUDED.cdcb_id, females.cdcb_id),
    birth_date = COALESCE(EXCLUDED.birth_date, females.birth_date),
    fonte = COALESCE(EXCLUDED.fonte, females.fonte),
    beta_casein = COALESCE(EXCLUDED.beta_casein, females.beta_casein),
    kappa_casein = COALESCE(EXCLUDED.kappa_casein, females.kappa_casein),
    parity_order = COALESCE(EXCLUDED.parity_order, females.parity_order),
    hhp_dollar = EXCLUDED.hhp_dollar,
    tpi = COALESCE(EXCLUDED.tpi, females.tpi),
    nm_dollar = COALESCE(EXCLUDED.nm_dollar, females.nm_dollar),
    cm_dollar = COALESCE(EXCLUDED.cm_dollar, females.cm_dollar),
    fm_dollar = COALESCE(EXCLUDED.fm_dollar, females.fm_dollar),
    gm_dollar = COALESCE(EXCLUDED.gm_dollar, females.gm_dollar),
    f_sav = COALESCE(EXCLUDED.f_sav, females.f_sav),
    pta_milk = COALESCE(EXCLUDED.pta_milk, females.pta_milk),
    cfp = COALESCE(EXCLUDED.cfp, females.cfp),
    pta_fat = COALESCE(EXCLUDED.pta_fat, females.pta_fat),
    pta_fat_pct = COALESCE(EXCLUDED.pta_fat_pct, females.pta_fat_pct),
    pta_protein = COALESCE(EXCLUDED.pta_protein, females.pta_protein),
    pta_protein_pct = COALESCE(EXCLUDED.pta_protein_pct, females.pta_protein_pct),
    pta_pl = COALESCE(EXCLUDED.pta_pl, females.pta_pl),
    pta_dpr = COALESCE(EXCLUDED.pta_dpr, females.pta_dpr),
    pta_livability = COALESCE(EXCLUDED.pta_livability, females.pta_livability),
    pta_scs = COALESCE(EXCLUDED.pta_scs, females.pta_scs),
    mast = COALESCE(EXCLUDED.mast, females.mast),
    met = COALESCE(EXCLUDED.met, females.met),
    rp = COALESCE(EXCLUDED.rp, females.rp),
    da = COALESCE(EXCLUDED.da, females.da),
    ket = COALESCE(EXCLUDED.ket, females.ket),
    mf_num = COALESCE(EXCLUDED.mf_num, females.mf_num),
    pta_ptat = COALESCE(EXCLUDED.pta_ptat, females.pta_ptat),
    pta_udc = COALESCE(EXCLUDED.pta_udc, females.pta_udc),
    pta_flc = COALESCE(EXCLUDED.pta_flc, females.pta_flc),
    pta_sce = COALESCE(EXCLUDED.pta_sce, females.pta_sce),
    pta_sire_sce = COALESCE(EXCLUDED.pta_sire_sce, females.pta_sire_sce),
    ssb = COALESCE(EXCLUDED.ssb, females.ssb),
    dsb = COALESCE(EXCLUDED.dsb, females.dsb),
    h_liv = COALESCE(EXCLUDED.h_liv, females.h_liv),
    pta_ccr = COALESCE(EXCLUDED.pta_ccr, females.pta_ccr),
    pta_hcr = COALESCE(EXCLUDED.pta_hcr, females.pta_hcr),
    fi = COALESCE(EXCLUDED.fi, females.fi),
    gl = COALESCE(EXCLUDED.gl, females.gl),
    efc = COALESCE(EXCLUDED.efc, females.efc),
    bwc = COALESCE(EXCLUDED.bwc, females.bwc),
    bd = COALESCE(EXCLUDED.bd, females.bd),
    sta = COALESCE(EXCLUDED.sta, females.sta),
    str_num = COALESCE(EXCLUDED.str_num, females.str_num),
    pta_bdc = COALESCE(EXCLUDED.pta_bdc, females.pta_bdc),
    dfm = COALESCE(EXCLUDED.dfm, females.dfm),
    rua = COALESCE(EXCLUDED.rua, females.rua),
    rw = COALESCE(EXCLUDED.rw, females.rw),
    rls = COALESCE(EXCLUDED.rls, females.rls),
    rlr = COALESCE(EXCLUDED.rlr, females.rlr),
    fta = COALESCE(EXCLUDED.fta, females.fta),
    fls = COALESCE(EXCLUDED.fls, females.fls),
    fua = COALESCE(EXCLUDED.fua, females.fua),
    ruh = COALESCE(EXCLUDED.ruh, females.ruh),
    ruw = COALESCE(EXCLUDED.ruw, females.ruw),
    ucl = COALESCE(EXCLUDED.ucl, females.ucl),
    udp = COALESCE(EXCLUDED.udp, females.udp),
    ftp = COALESCE(EXCLUDED.ftp, females.ftp),
    rtp = COALESCE(EXCLUDED.rtp, females.rtp),
    ftl = COALESCE(EXCLUDED.ftl, females.ftl),
    rfi = COALESCE(EXCLUDED.rfi, females.rfi),
    gfi = COALESCE(EXCLUDED.gfi, females.gfi),
    updated_at = now();
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$function$;
