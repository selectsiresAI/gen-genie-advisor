-- Add fonte column to females and refresh females_denorm view
ALTER TABLE IF EXISTS public.females
  ADD COLUMN IF NOT EXISTS fonte text;

-- Ensure mirrored table (if present) also receives the column
ALTER TABLE IF EXISTS public.females_
  ADD COLUMN IF NOT EXISTS fonte text;

CREATE OR REPLACE VIEW public.females_denorm
WITH (security_invoker = true) AS
SELECT
    f.id,
    f.farm_id,
    f.name,
    f.identifier,
    f.cdcb_id,
    f.category,
    f.fonte,
    f.birth_date,
    f.parity_order,
    f.sire_naab,
    f.mgs_naab,
    f.mmgs_naab,
    f.created_at,
    f.updated_at,
    -- Economic indices
    f.hhp_dollar,
    f.tpi,
    f.nm_dollar,
    f.cm_dollar,
    f.fm_dollar,
    f.gm_dollar,
    -- Production traits
    f.f_sav,
    f.ptam,
    f.cfp,
    f.ptaf,
    f.ptaf_pct,
    f.ptap,
    f.ptap_pct,
    f.pl,
    -- Health traits
    f.dpr,
    f.liv,
    f.scs,
    f.mast,
    f.met,
    f.rp,
    f.da,
    f.ket,
    f.mf,
    -- Conformation traits
    f.ptat,
    f.udc,
    f.flc,
    f.sce,
    f.dce,
    f.ssb,
    f.dsb,
    f.h_liv,
    f.ccr,
    f.hcr,
    f.fi,
    f.gl,
    f.efc,
    f.bwc,
    f.sta,
    f.str,
    f.dfm,
    f.rua,
    f.rls,
    f.rtp,
    f.ftl,
    f.rw,
    f.rlr,
    f.fta,
    f.fls,
    f.fua,
    f.ruh,
    f.ruw,
    f.ucl,
    f.udp,
    f.ftp,
    f.rfi,
    f.gfi,
    -- Casein variants
    f.kappa_casein,
    f.beta_casein,
    -- Latest prediction data
    gp.method as last_prediction_method,
    gp.predicted_value as last_prediction_value,
    gp.confidence as last_prediction_confidence,
    gp.created_at as last_prediction_date,
    -- Latest segmentation data
    fs.class as segmentation_class,
    fs.score as segmentation_score
FROM public.females f
LEFT JOIN LATERAL (
    SELECT method, predicted_value, confidence, created_at
    FROM public.genetic_predictions gp_inner
    WHERE gp_inner.female_id = f.id
    ORDER BY gp_inner.created_at DESC
    LIMIT 1
) gp ON true
LEFT JOIN LATERAL (
    SELECT class, score
    FROM public.female_segmentations fs_inner
    WHERE fs_inner.female_id = f.id
    ORDER BY fs_inner.created_at DESC
    LIMIT 1
) fs ON true;
