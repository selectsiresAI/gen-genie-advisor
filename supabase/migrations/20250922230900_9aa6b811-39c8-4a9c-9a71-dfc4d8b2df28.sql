-- Fix security definer view issues by explicitly setting security invoker
-- and enabling RLS on views

-- Recreate bulls_denorm view with proper security settings
DROP VIEW IF EXISTS public.bulls_denorm;

CREATE VIEW public.bulls_denorm 
WITH (security_invoker = true) AS
SELECT 
    b.id,
    b.code,
    b.name,
    b.registration,
    b.pedigree,
    b.birth_date,
    b.company,
    b.sire_naab,
    b.mgs_naab,
    b.mmgs_naab,
    b.created_at,
    b.updated_at,
    -- Economic indices
    b.hhp_dollar,
    b.tpi,
    b.nm_dollar,
    b.cm_dollar,
    b.fm_dollar,
    b.gm_dollar,
    -- Production traits
    b.f_sav,
    b.ptam,
    b.cfp,
    b.ptaf,
    b.ptaf_pct,
    b.ptap,
    b.ptap_pct,
    b.pl,
    -- Health traits
    b.dpr,
    b.liv,
    b.scs,
    b.mast,
    b.met,
    b.rp,
    b.da,
    b.ket,
    b.mf,
    -- Conformation traits
    b.ptat,
    b.udc,
    b.flc,
    b.sce,
    b.dce,
    b.ssb,
    b.dsb,
    b.h_liv,
    b.ccr,
    b.hcr,
    b.fi,
    b.gl,
    b.efc,
    b.bwc,
    b.sta,
    b.str,
    b.dfm,
    b.rua,
    b.rls,
    b.rtp,
    b.ftl,
    b.rw,
    b.rlr,
    b.fta,
    b.fls,
    b.fua,
    b.ruh,
    b.ruw,
    b.ucl,
    b.udp,
    b.ftp,
    b.rfi,
    -- Casein variants
    b.beta_casein,
    b.kappa_casein,
    -- Additional traits
    b.gfi
FROM public.bulls b;

-- Recreate females_denorm view with proper security settings
DROP VIEW IF EXISTS public.females_denorm;

CREATE VIEW public.females_denorm 
WITH (security_invoker = true) AS
SELECT 
    f.id,
    f.farm_id,
    f.name,
    f.identifier,
    f.cdcb_id,
    f.category,
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

-- Recreate semen_inventory view with proper security settings
DROP VIEW IF EXISTS public.semen_inventory;

CREATE VIEW public.semen_inventory 
WITH (security_invoker = true) AS
SELECT 
    sm.farm_id,
    sm.bull_id,
    b.code as bull_naab,
    b.name as bull_name,
    sm.semen_type,
    SUM(
        CASE 
            WHEN sm.movement_type = 'entrada' THEN sm.quantity
            WHEN sm.movement_type = 'saida' THEN -sm.quantity
            ELSE 0
        END
    ) as balance,
    COUNT(*) as total_movements,
    MAX(sm.movement_date) as last_movement_date
FROM public.semen_movements sm
JOIN public.bulls b ON sm.bull_id = b.id
GROUP BY sm.farm_id, sm.bull_id, b.code, b.name, sm.semen_type
HAVING SUM(
    CASE 
        WHEN sm.movement_type = 'entrada' THEN sm.quantity
        WHEN sm.movement_type = 'saida' THEN -sm.quantity
        ELSE 0
    END
) != 0;

-- Recreate farm_dashboard_kpis view with proper security settings  
DROP VIEW IF EXISTS public.farm_dashboard_kpis;

CREATE VIEW public.farm_dashboard_kpis 
WITH (security_invoker = true) AS
SELECT 
    f.id as farm_id,
    f.name as farm_name,
    f.owner_name,
    f.created_at as farm_created_at,
    f.updated_at as farm_updated_at,
    -- Female statistics
    COALESCE(female_stats.total_females, 0) as total_females,
    COALESCE(female_stats.donor_females, 0) as donor_females,
    COALESCE(female_stats.inter_females, 0) as inter_females,
    COALESCE(female_stats.recipient_females, 0) as recipient_females,
    CASE 
        WHEN COALESCE(female_stats.total_females, 0) > 0 
        THEN ROUND((COALESCE(female_stats.donor_females, 0)::numeric / female_stats.total_females * 100), 1)
        ELSE 0 
    END as donor_percentage,
    CASE 
        WHEN COALESCE(female_stats.total_females, 0) > 0 
        THEN ROUND((COALESCE(female_stats.inter_females, 0)::numeric / female_stats.total_females * 100), 1)
        ELSE 0 
    END as inter_percentage,
    CASE 
        WHEN COALESCE(female_stats.total_females, 0) > 0 
        THEN ROUND((COALESCE(female_stats.recipient_females, 0)::numeric / female_stats.total_females * 100), 1)
        ELSE 0 
    END as recipient_percentage,
    -- Average genetic values
    ROUND(COALESCE(female_stats.avg_nm_dollar, 0), 0) as avg_nm_dollar,
    ROUND(COALESCE(female_stats.avg_tpi, 0), 0) as avg_tpi,
    ROUND(COALESCE(female_stats.avg_hhp_dollar, 0), 0) as avg_hhp_dollar,
    -- Bull selections
    COALESCE(bull_stats.selected_bulls, 0) as selected_bulls,
    -- Activity statistics
    COALESCE(activity_stats.total_predictions, 0) as total_predictions,
    COALESCE(activity_stats.total_matings, 0) as total_matings,
    COALESCE(activity_stats.total_semen_doses, 0) as total_semen_doses,
    -- Recent activity dates
    activity_stats.last_female_added,
    activity_stats.last_prediction_date,
    activity_stats.last_mating_date,
    activity_stats.last_movement_date
FROM public.farms f
LEFT JOIN (
    SELECT 
        farm_id,
        COUNT(*) as total_females,
        SUM(CASE WHEN category = 'doadora' THEN 1 ELSE 0 END) as donor_females,
        SUM(CASE WHEN category = 'intermediaria' THEN 1 ELSE 0 END) as inter_females,
        SUM(CASE WHEN category = 'receptora' THEN 1 ELSE 0 END) as recipient_females,
        AVG(nm_dollar) as avg_nm_dollar,
        AVG(tpi) as avg_tpi,
        AVG(hhp_dollar) as avg_hhp_dollar
    FROM public.females
    GROUP BY farm_id
) female_stats ON f.id = female_stats.farm_id
LEFT JOIN (
    SELECT 
        farm_id,
        COUNT(*) as selected_bulls
    FROM public.farm_bull_picks 
    WHERE is_active = true
    GROUP BY farm_id
) bull_stats ON f.id = bull_stats.farm_id
LEFT JOIN (
    SELECT 
        f.id as farm_id,
        COUNT(DISTINCT gp.id) as total_predictions,
        COUNT(DISTINCT m.id) as total_matings,
        COALESCE(SUM(CASE WHEN sm.movement_type = 'entrada' THEN sm.quantity ELSE 0 END), 0) as total_semen_doses,
        MAX(fem.created_at) as last_female_added,
        MAX(gp.created_at) as last_prediction_date,
        MAX(m.created_at) as last_mating_date,
        MAX(sm.movement_date) as last_movement_date
    FROM public.farms f
    LEFT JOIN public.females fem ON f.id = fem.farm_id
    LEFT JOIN public.genetic_predictions gp ON f.id = gp.farm_id
    LEFT JOIN public.matings m ON f.id = m.farm_id
    LEFT JOIN public.semen_movements sm ON f.id = sm.farm_id
    GROUP BY f.id
) activity_stats ON f.id = activity_stats.farm_id;