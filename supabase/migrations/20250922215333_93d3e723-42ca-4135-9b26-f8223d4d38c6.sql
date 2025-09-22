-- Add Ordem de Parto (parity order) and Categoria (category) columns to females table
ALTER TABLE public.females 
ADD COLUMN parity_order integer,
ADD COLUMN category text;

-- Update the females_denorm view to include the new columns
DROP VIEW IF EXISTS public.females_denorm;

CREATE VIEW public.females_denorm AS
SELECT 
    f.id,
    f.farm_id,
    f.name,
    f.identifier,
    f.cdcb_id,
    f.birth_date,
    f.parity_order,
    f.category,
    f.sire_naab,
    f.mgs_naab,
    f.mmgs_naab,
    f.kappa_casein,
    f.beta_casein,
    f.created_at,
    f.updated_at,
    f.hhp_dollar,
    f.tpi,
    f.nm_dollar,
    f.cm_dollar,
    f.fm_dollar,
    f.gm_dollar,
    f.f_sav,
    f.ptam,
    f.cfp,
    f.ptaf,
    f.ptaf_pct,
    f.ptap,
    f.ptap_pct,
    f.pl,
    f.dpr,
    f.liv,
    f.scs,
    f.mast,
    f.met,
    f.rp,
    f.da,
    f.ket,
    f.mf,
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
    -- Latest prediction data
    lp.method as last_prediction_method,
    lp.predicted_value as last_prediction_value,
    lp.confidence as last_prediction_confidence,
    lp.created_at as last_prediction_date,
    -- Latest segmentation data
    ls.class as segmentation_class,
    ls.score as segmentation_score
FROM public.females f
LEFT JOIN LATERAL (
    SELECT method, predicted_value, confidence, created_at
    FROM public.genetic_predictions gp
    WHERE gp.female_id = f.id 
    ORDER BY gp.created_at DESC
    LIMIT 1
) lp ON true
LEFT JOIN LATERAL (
    SELECT class, score
    FROM public.female_segmentations fs
    WHERE fs.female_id = f.id
    ORDER BY fs.created_at DESC
    LIMIT 1
) ls ON true;