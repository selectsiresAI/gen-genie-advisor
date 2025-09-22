-- Correção de Security Definer Views - Corrigida
-- Recriar as views com RLS adequado

-- 1. Primeiro, remover as views existentes
DROP VIEW IF EXISTS public.bulls_denorm CASCADE;
DROP VIEW IF EXISTS public.farm_dashboard_kpis CASCADE; 
DROP VIEW IF EXISTS public.females_denorm CASCADE;
DROP VIEW IF EXISTS public.semen_inventory CASCADE;

-- 2. Recriar bulls_denorm como view normal (não SECURITY DEFINER)
CREATE VIEW public.bulls_denorm AS
SELECT 
    id,
    code,
    name,
    registration,
    birth_date,
    sire_naab,
    mgs_naab,
    mmgs_naab,
    created_at,
    updated_at,
    ((ptas ->> 'hhp_dollar'))::numeric AS hhp_dollar,
    ((ptas ->> 'tpi'))::numeric AS tpi,
    ((ptas ->> 'nm_dollar'))::numeric AS nm_dollar,
    ((ptas ->> 'cm_dollar'))::numeric AS cm_dollar,
    ((ptas ->> 'fm_dollar'))::numeric AS fm_dollar,
    ((ptas ->> 'gm_dollar'))::numeric AS gm_dollar,
    ((ptas ->> 'f_sav'))::numeric AS f_sav,
    ((ptas ->> 'ptam'))::numeric AS ptam,
    ((ptas ->> 'cfp'))::numeric AS cfp,
    ((ptas ->> 'ptaf'))::numeric AS ptaf,
    ((ptas ->> 'ptaf_pct'))::numeric AS ptaf_pct,
    ((ptas ->> 'ptap'))::numeric AS ptap,
    ((ptas ->> 'ptap_pct'))::numeric AS ptap_pct,
    ((ptas ->> 'pl'))::numeric AS pl,
    ((ptas ->> 'dpr'))::numeric AS dpr,
    ((ptas ->> 'liv'))::numeric AS liv,
    ((ptas ->> 'scs'))::numeric AS scs,
    ((ptas ->> 'mast'))::numeric AS mast,
    ((ptas ->> 'met'))::numeric AS met,
    ((ptas ->> 'rp'))::numeric AS rp,
    ((ptas ->> 'da'))::numeric AS da,
    ((ptas ->> 'ket'))::numeric AS ket,
    ((ptas ->> 'mf'))::numeric AS mf,
    ((ptas ->> 'ptat'))::numeric AS ptat,
    ((ptas ->> 'udc'))::numeric AS udc,
    ((ptas ->> 'flc'))::numeric AS flc,
    ((ptas ->> 'sce'))::numeric AS sce,
    ((ptas ->> 'dce'))::numeric AS dce,
    ((ptas ->> 'ssb'))::numeric AS ssb,
    ((ptas ->> 'dsb'))::numeric AS dsb,
    ((ptas ->> 'h_liv'))::numeric AS h_liv,
    ((ptas ->> 'ccr'))::numeric AS ccr,
    ((ptas ->> 'hcr'))::numeric AS hcr,
    ((ptas ->> 'fi'))::numeric AS fi,
    ((ptas ->> 'gl'))::numeric AS gl,
    ((ptas ->> 'efc'))::numeric AS efc,
    ((ptas ->> 'bwc'))::numeric AS bwc,
    ((ptas ->> 'sta'))::numeric AS sta,
    ((ptas ->> 'str'))::numeric AS str,
    ((ptas ->> 'dfm'))::numeric AS dfm,
    ((ptas ->> 'rua'))::numeric AS rua,
    ((ptas ->> 'rls'))::numeric AS rls,
    ((ptas ->> 'rtp'))::numeric AS rtp,
    ((ptas ->> 'ftl'))::numeric AS ftl,
    ((ptas ->> 'rw'))::numeric AS rw,
    ((ptas ->> 'rlr'))::numeric AS rlr,
    ((ptas ->> 'fta'))::numeric AS fta,
    ((ptas ->> 'fls'))::numeric AS fls,
    ((ptas ->> 'fua'))::numeric AS fua,
    ((ptas ->> 'ruh'))::numeric AS ruh,
    ((ptas ->> 'ruw'))::numeric AS ruw,
    ((ptas ->> 'ucl'))::numeric AS ucl,
    ((ptas ->> 'udp'))::numeric AS udp,
    ((ptas ->> 'ftp'))::numeric AS ftp,
    ((ptas ->> 'rfi'))::numeric AS rfi,
    (ptas ->> 'beta_casein') AS beta_casein,
    (ptas ->> 'kappa_casein') AS kappa_casein,
    ((ptas ->> 'gfi'))::numeric AS gfi
FROM public.bulls;

-- 3. Recriar females_denorm como view normal
CREATE VIEW public.females_denorm AS
SELECT 
    f.id,
    f.farm_id,
    f.name,
    f.identifier,
    f.cdcb_id,
    f.sire_naab,
    f.mgs_naab,
    f.mmgs_naab,
    f.birth_date,
    f.created_at,
    f.updated_at,
    ((f.ptas ->> 'hhp_dollar'))::numeric AS hhp_dollar,
    ((f.ptas ->> 'tpi'))::numeric AS tpi,
    ((f.ptas ->> 'nm_dollar'))::numeric AS nm_dollar,
    ((f.ptas ->> 'cm_dollar'))::numeric AS cm_dollar,
    ((f.ptas ->> 'fm_dollar'))::numeric AS fm_dollar,
    ((f.ptas ->> 'gm_dollar'))::numeric AS gm_dollar,
    ((f.ptas ->> 'f_sav'))::numeric AS f_sav,
    ((f.ptas ->> 'ptam'))::numeric AS ptam,
    ((f.ptas ->> 'cfp'))::numeric AS cfp,
    ((f.ptas ->> 'ptaf'))::numeric AS ptaf,
    ((f.ptas ->> 'ptaf_pct'))::numeric AS ptaf_pct,
    ((f.ptas ->> 'ptap'))::numeric AS ptap,
    ((f.ptas ->> 'ptap_pct'))::numeric AS ptap_pct,
    ((f.ptas ->> 'pl'))::numeric AS pl,
    ((f.ptas ->> 'dpr'))::numeric AS dpr,
    ((f.ptas ->> 'liv'))::numeric AS liv,
    ((f.ptas ->> 'scs'))::numeric AS scs,
    ((f.ptas ->> 'mast'))::numeric AS mast,
    ((f.ptas ->> 'met'))::numeric AS met,
    ((f.ptas ->> 'rp'))::numeric AS rp,
    ((f.ptas ->> 'da'))::numeric AS da,
    ((f.ptas ->> 'ket'))::numeric AS ket,
    ((f.ptas ->> 'mf'))::numeric AS mf,
    ((f.ptas ->> 'ptat'))::numeric AS ptat,
    ((f.ptas ->> 'udc'))::numeric AS udc,
    ((f.ptas ->> 'flc'))::numeric AS flc,
    ((f.ptas ->> 'sce'))::numeric AS sce,
    ((f.ptas ->> 'dce'))::numeric AS dce,
    ((f.ptas ->> 'ssb'))::numeric AS ssb,
    ((f.ptas ->> 'dsb'))::numeric AS dsb,
    ((f.ptas ->> 'h_liv'))::numeric AS h_liv,
    ((f.ptas ->> 'ccr'))::numeric AS ccr,
    ((f.ptas ->> 'hcr'))::numeric AS hcr,
    ((f.ptas ->> 'fi'))::numeric AS fi,
    ((f.ptas ->> 'gl'))::numeric AS gl,
    ((f.ptas ->> 'efc'))::numeric AS efc,
    ((f.ptas ->> 'bwc'))::numeric AS bwc,
    ((f.ptas ->> 'sta'))::numeric AS sta,
    ((f.ptas ->> 'str'))::numeric AS str,
    ((f.ptas ->> 'dfm'))::numeric AS dfm,
    ((f.ptas ->> 'rua'))::numeric AS rua,
    ((f.ptas ->> 'rls'))::numeric AS rls,
    ((f.ptas ->> 'rtp'))::numeric AS rtp,
    ((f.ptas ->> 'ftl'))::numeric AS ftl,
    ((f.ptas ->> 'rw'))::numeric AS rw,
    ((f.ptas ->> 'rlr'))::numeric AS rlr,
    ((f.ptas ->> 'fta'))::numeric AS fta,
    ((f.ptas ->> 'fls'))::numeric AS fls,
    ((f.ptas ->> 'fua'))::numeric AS fua,
    ((f.ptas ->> 'ruh'))::numeric AS ruh,
    ((f.ptas ->> 'ruw'))::numeric AS ruw,
    ((f.ptas ->> 'ucl'))::numeric AS ucl,
    ((f.ptas ->> 'udp'))::numeric AS udp,
    ((f.ptas ->> 'ftp'))::numeric AS ftp,
    ((f.ptas ->> 'rfi'))::numeric AS rfi,
    (f.ptas ->> 'beta_casein') AS beta_casein,
    (f.ptas ->> 'kappa_casein') AS kappa_casein,
    ((f.ptas ->> 'gfi'))::numeric AS gfi,
    fs.class AS segmentation_class,
    fs.score AS segmentation_score,
    gp.predicted_value AS last_prediction_value,
    gp.confidence AS last_prediction_confidence,
    gp.method AS last_prediction_method,
    gp.created_at AS last_prediction_date
FROM public.females f
LEFT JOIN public.female_segmentations fs ON f.id = fs.female_id
LEFT JOIN LATERAL (
    SELECT id, female_id, farm_id, method, predicted_value, confidence, parameters, created_at
    FROM public.genetic_predictions
    WHERE female_id = f.id
    ORDER BY created_at DESC
    LIMIT 1
) gp ON true;

-- 4. Recriar farm_dashboard_kpis como view normal (corrigindo ambiguidade de farm_id)
CREATE VIEW public.farm_dashboard_kpis AS
SELECT 
    f.id AS farm_id,
    f.name AS farm_name,
    f.owner_name,
    f.created_at AS farm_created_at,
    f.updated_at AS farm_updated_at,
    COALESCE(female_stats.total_females, 0::bigint) AS total_females,
    COALESCE(female_stats.donor_count, 0::bigint) AS donor_females,
    COALESCE(female_stats.inter_count, 0::bigint) AS inter_females,
    COALESCE(female_stats.recipient_count, 0::bigint) AS recipient_females,
    CASE 
        WHEN COALESCE(female_stats.total_females, 0::bigint) > 0 
        THEN ROUND((COALESCE(female_stats.donor_count, 0::bigint)::numeric * 100.0) / female_stats.total_females::numeric, 1)
        ELSE 0::numeric
    END AS donor_percentage,
    CASE 
        WHEN COALESCE(female_stats.total_females, 0::bigint) > 0 
        THEN ROUND((COALESCE(female_stats.inter_count, 0::bigint)::numeric * 100.0) / female_stats.total_females::numeric, 1)
        ELSE 0::numeric
    END AS inter_percentage,
    CASE 
        WHEN COALESCE(female_stats.total_females, 0::bigint) > 0 
        THEN ROUND((COALESCE(female_stats.recipient_count, 0::bigint)::numeric * 100.0) / female_stats.total_females::numeric, 1)
        ELSE 0::numeric
    END AS recipient_percentage,
    ROUND(COALESCE(female_stats.avg_nm_dollar, 0::numeric), 0) AS avg_nm_dollar,
    ROUND(COALESCE(female_stats.avg_tpi, 0::numeric), 0) AS avg_tpi,
    ROUND(COALESCE(female_stats.avg_hhp_dollar, 0::numeric), 0) AS avg_hhp_dollar,
    COALESCE(bull_picks.selected_bulls, 0::bigint) AS selected_bulls,
    COALESCE(prediction_stats.total_predictions, 0::bigint) AS total_predictions,
    COALESCE(mating_stats.total_matings, 0::bigint) AS total_matings,
    COALESCE(semen_stats.total_semen_doses, 0::numeric) AS total_semen_doses,
    female_stats.last_female_added,
    prediction_stats.last_prediction_date,
    mating_stats.last_mating_date,
    semen_stats.last_movement_date
FROM public.farms f
LEFT JOIN (
    SELECT 
        fem.farm_id,
        COUNT(*) AS total_females,
        COUNT(*) FILTER (WHERE fs.class = 'donor') AS donor_count,
        COUNT(*) FILTER (WHERE fs.class = 'inter') AS inter_count,
        COUNT(*) FILTER (WHERE fs.class = 'recipient') AS recipient_count,
        AVG(((fem.ptas ->> 'nm_dollar'))::numeric) AS avg_nm_dollar,
        AVG(((fem.ptas ->> 'tpi'))::numeric) AS avg_tpi,
        AVG(((fem.ptas ->> 'hhp_dollar'))::numeric) AS avg_hhp_dollar,
        MAX(fem.created_at) AS last_female_added
    FROM public.females fem
    LEFT JOIN public.female_segmentations fs ON fem.id = fs.female_id
    GROUP BY fem.farm_id
) female_stats ON f.id = female_stats.farm_id
LEFT JOIN (
    SELECT 
        fbp.farm_id,
        COUNT(*) AS selected_bulls
    FROM public.farm_bull_picks fbp
    WHERE fbp.is_active = true
    GROUP BY fbp.farm_id
) bull_picks ON f.id = bull_picks.farm_id
LEFT JOIN (
    SELECT 
        gp.farm_id,
        COUNT(*) AS total_predictions,
        MAX(gp.created_at) AS last_prediction_date
    FROM public.genetic_predictions gp
    GROUP BY gp.farm_id
) prediction_stats ON f.id = prediction_stats.farm_id
LEFT JOIN (
    SELECT 
        m.farm_id,
        COUNT(*) AS total_matings,
        MAX(m.created_at) AS last_mating_date
    FROM public.matings m
    GROUP BY m.farm_id
) mating_stats ON f.id = mating_stats.farm_id
LEFT JOIN (
    SELECT 
        sm.farm_id,
        SUM(CASE WHEN sm.movement_type = 'entrada' THEN sm.quantity ELSE -sm.quantity END) AS total_semen_doses,
        MAX(sm.movement_date) AS last_movement_date
    FROM public.semen_movements sm
    GROUP BY sm.farm_id
) semen_stats ON f.id = semen_stats.farm_id;

-- 5. Recriar semen_inventory como view normal
CREATE VIEW public.semen_inventory AS
SELECT 
    sm.farm_id,
    sm.bull_id,
    b.code AS bull_naab,
    b.name AS bull_name,
    sm.semen_type,
    SUM(CASE WHEN sm.movement_type = 'entrada' THEN sm.quantity ELSE -sm.quantity END) AS balance,
    COUNT(*) AS total_movements,
    MAX(sm.movement_date) AS last_movement_date
FROM public.semen_movements sm
JOIN public.bulls b ON sm.bull_id = b.id
GROUP BY sm.farm_id, sm.bull_id, b.code, b.name, sm.semen_type
HAVING SUM(CASE WHEN sm.movement_type = 'entrada' THEN sm.quantity ELSE -sm.quantity END) != 0;

-- 6. Habilitar RLS nas novas views
ALTER VIEW public.bulls_denorm ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.females_denorm ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.farm_dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.semen_inventory ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para as views

-- Políticas para bulls_denorm (todos podem ver, como na tabela bulls)
CREATE POLICY "Authenticated users can view bulls denorm" ON public.bulls_denorm FOR SELECT USING (true);

-- Políticas para females_denorm (apenas membros da fazenda)
CREATE POLICY "Farm members can view females denorm" ON public.females_denorm FOR SELECT USING (is_farm_member(farm_id));

-- Políticas para farm_dashboard_kpis (apenas membros da fazenda)
CREATE POLICY "Farm members can view dashboard kpis" ON public.farm_dashboard_kpis FOR SELECT USING (is_farm_member(farm_id));

-- Políticas para semen_inventory (apenas membros da fazenda)
CREATE POLICY "Farm members can view semen inventory" ON public.semen_inventory FOR SELECT USING (is_farm_member(farm_id));