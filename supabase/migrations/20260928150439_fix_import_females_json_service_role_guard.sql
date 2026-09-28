-- Fix: import_females_json gained a can_access_farm() guard (live-applied outside git,
-- part of the 2026-09-26 P0 security hardening pass -- see
-- 20260926152048_p0_lock_security_definer_farm_functions.sql for the sibling functions
-- that DID get captured in that migration; this one apparently didn't) that always
-- raised "access denied" because this RPC is invoked by the import-females edge
-- function via service_role (no user JWT -> auth.uid() is NULL -> can_access_farm()
-- always false). Confirmed live via function_logs: every /import-females/upload call
-- since ~2026-09-28 12:42 UTC failed with `P0001 access denied`, 0 rows inserted,
-- for every farm/user -- not specific to any one technician.
--
-- The edge function already validates the real user's access via user_farms BEFORE
-- calling this RPC (supabase/functions/import-females/index.ts:723-732), so the
-- can_access_farm() guard here is redundant for that caller and only needs to keep
-- blocking a direct call from an authenticated (non service_role) session that lacks
-- access to the target farm.
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
  IF auth.role() <> 'service_role' AND NOT public.can_access_farm(p_client_id) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  INSERT INTO public.females (
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
    NULLIF(r->>'identifier', ''),
    NULLIF(r->>'name', ''),
    NULLIF(r->>'category', ''),
    NULLIF(r->>'sire_naab', ''),
    NULLIF(r->>'mgs_naab', ''),
    NULLIF(r->>'mmgs_naab', ''),
    NULLIF(r->>'cdcb_id', ''),
    NULLIF(r->>'birth_date', '')::date,
    NULLIF(r->>'fonte', ''),
    NULLIF(r->>'beta_casein', ''),
    NULLIF(r->>'kappa_casein', ''),
    NULLIF(r->>'parity_order', '')::numeric,
    NULLIF(r->>'hhp_dollar', '')::numeric,
    NULLIF(r->>'tpi', '')::numeric,
    NULLIF(r->>'nm_dollar', '')::numeric,
    NULLIF(r->>'cm_dollar', '')::numeric,
    NULLIF(r->>'fm_dollar', '')::numeric,
    NULLIF(r->>'gm_dollar', '')::numeric,
    NULLIF(r->>'f_sav', '')::numeric,
    NULLIF(r->>'pta_milk', '')::numeric,
    NULLIF(r->>'cfp', '')::numeric,
    NULLIF(r->>'pta_fat', '')::numeric,
    NULLIF(r->>'pta_fat_pct', '')::numeric,
    NULLIF(r->>'pta_protein', '')::numeric,
    NULLIF(r->>'pta_protein_pct', '')::numeric,
    NULLIF(r->>'pta_pl', '')::numeric,
    NULLIF(r->>'pta_dpr', '')::numeric,
    NULLIF(r->>'pta_livability', '')::numeric,
    NULLIF(r->>'pta_scs', '')::numeric,
    NULLIF(r->>'mast', '')::numeric,
    NULLIF(r->>'met', '')::numeric,
    NULLIF(r->>'rp', '')::numeric,
    NULLIF(r->>'da', '')::numeric,
    NULLIF(r->>'ket', '')::numeric,
    NULLIF(r->>'mf_num', '')::numeric,
    NULLIF(r->>'pta_ptat', '')::numeric,
    NULLIF(r->>'pta_udc', '')::numeric,
    NULLIF(r->>'pta_flc', '')::numeric,
    NULLIF(r->>'pta_sce', '')::numeric,
    NULLIF(r->>'pta_sire_sce', '')::numeric,
    NULLIF(r->>'ssb', '')::numeric,
    NULLIF(r->>'dsb', '')::numeric,
    NULLIF(r->>'h_liv', '')::numeric,
    NULLIF(r->>'pta_ccr', '')::numeric,
    NULLIF(r->>'pta_hcr', '')::numeric,
    NULLIF(r->>'fi', '')::numeric,
    NULLIF(r->>'gl', '')::numeric,
    NULLIF(r->>'efc', '')::numeric,
    NULLIF(r->>'bwc', '')::numeric,
    NULLIF(r->>'bd', '')::numeric,
    NULLIF(r->>'sta', '')::numeric,
    NULLIF(r->>'str_num', '')::numeric,
    NULLIF(r->>'pta_bdc', '')::numeric,
    NULLIF(r->>'dfm', '')::numeric,
    NULLIF(r->>'rua', '')::numeric,
    NULLIF(r->>'rw', '')::numeric,
    NULLIF(r->>'rls', '')::numeric,
    NULLIF(r->>'rlr', '')::numeric,
    NULLIF(r->>'fta', '')::numeric,
    NULLIF(r->>'fls', '')::numeric,
    NULLIF(r->>'fua', '')::numeric,
    NULLIF(r->>'ruh', '')::numeric,
    NULLIF(r->>'ruw', '')::numeric,
    NULLIF(r->>'ucl', '')::numeric,
    NULLIF(r->>'udp', '')::numeric,
    NULLIF(r->>'ftp', '')::numeric,
    NULLIF(r->>'rtp', '')::numeric,
    NULLIF(r->>'ftl', '')::numeric,
    NULLIF(r->>'rfi', '')::numeric,
    NULLIF(r->>'gfi', '')::numeric
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
    hhp_dollar = COALESCE(EXCLUDED.hhp_dollar, females.hhp_dollar),
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

GRANT EXECUTE ON FUNCTION public.import_females_json(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_females_json(uuid, jsonb) TO service_role;
