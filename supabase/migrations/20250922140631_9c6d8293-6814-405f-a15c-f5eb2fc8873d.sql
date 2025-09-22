-- ==========================================
-- VIEWS DENORMALIZADAS E RPCs ESSENCIAIS
-- ==========================================

-- ==========================================
-- 11. VIEWS DENORMALIZADAS
-- ==========================================

-- View denormalizada de fêmeas (para consumo frontend)
CREATE OR REPLACE VIEW public.females_denorm AS
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
    
    -- PTAs extraídos do JSON (principais traços)
    (f.ptas->>'hhp_dollar')::NUMERIC AS hhp_dollar,
    (f.ptas->>'tpi')::NUMERIC AS tpi,
    (f.ptas->>'nm_dollar')::NUMERIC AS nm_dollar,
    (f.ptas->>'cm_dollar')::NUMERIC AS cm_dollar,
    (f.ptas->>'fm_dollar')::NUMERIC AS fm_dollar,
    (f.ptas->>'gm_dollar')::NUMERIC AS gm_dollar,
    (f.ptas->>'f_sav')::NUMERIC AS f_sav,
    (f.ptas->>'ptam')::NUMERIC AS ptam,
    (f.ptas->>'cfp')::NUMERIC AS cfp,
    (f.ptas->>'ptaf')::NUMERIC AS ptaf,
    (f.ptas->>'ptaf_pct')::NUMERIC AS ptaf_pct,
    (f.ptas->>'ptap')::NUMERIC AS ptap,
    (f.ptas->>'ptap_pct')::NUMERIC AS ptap_pct,
    (f.ptas->>'pl')::NUMERIC AS pl,
    (f.ptas->>'dpr')::NUMERIC AS dpr,
    (f.ptas->>'liv')::NUMERIC AS liv,
    (f.ptas->>'scs')::NUMERIC AS scs,
    (f.ptas->>'mast')::NUMERIC AS mast,
    (f.ptas->>'met')::NUMERIC AS met,
    (f.ptas->>'rp')::NUMERIC AS rp,
    (f.ptas->>'da')::NUMERIC AS da,
    (f.ptas->>'ket')::NUMERIC AS ket,
    (f.ptas->>'mf')::NUMERIC AS mf,
    (f.ptas->>'ptat')::NUMERIC AS ptat,
    (f.ptas->>'udc')::NUMERIC AS udc,
    (f.ptas->>'flc')::NUMERIC AS flc,
    (f.ptas->>'sce')::NUMERIC AS sce,
    (f.ptas->>'dce')::NUMERIC AS dce,
    (f.ptas->>'ssb')::NUMERIC AS ssb,
    (f.ptas->>'dsb')::NUMERIC AS dsb,
    (f.ptas->>'h_liv')::NUMERIC AS h_liv,
    (f.ptas->>'ccr')::NUMERIC AS ccr,
    (f.ptas->>'hcr')::NUMERIC AS hcr,
    (f.ptas->>'fi')::NUMERIC AS fi,
    (f.ptas->>'gl')::NUMERIC AS gl,
    (f.ptas->>'efc')::NUMERIC AS efc,
    (f.ptas->>'bwc')::NUMERIC AS bwc,
    (f.ptas->>'sta')::NUMERIC AS sta,
    (f.ptas->>'str')::NUMERIC AS str,
    (f.ptas->>'dfm')::NUMERIC AS dfm,
    (f.ptas->>'rua')::NUMERIC AS rua,
    (f.ptas->>'rls')::NUMERIC AS rls,
    (f.ptas->>'rtp')::NUMERIC AS rtp,
    (f.ptas->>'ftl')::NUMERIC AS ftl,
    (f.ptas->>'rw')::NUMERIC AS rw,
    (f.ptas->>'rlr')::NUMERIC AS rlr,
    (f.ptas->>'fta')::NUMERIC AS fta,
    (f.ptas->>'fls')::NUMERIC AS fls,
    (f.ptas->>'fua')::NUMERIC AS fua,
    (f.ptas->>'ruh')::NUMERIC AS ruh,
    (f.ptas->>'ruw')::NUMERIC AS ruw,
    (f.ptas->>'ucl')::NUMERIC AS ucl,
    (f.ptas->>'udp')::NUMERIC AS udp,
    (f.ptas->>'ftp')::NUMERIC AS ftp,
    (f.ptas->>'rfi')::NUMERIC AS rfi,
    (f.ptas->>'beta_casein')::TEXT AS beta_casein,
    (f.ptas->>'kappa_casein')::TEXT AS kappa_casein,
    (f.ptas->>'gfi')::NUMERIC AS gfi,
    
    -- Segmentação atual
    fs.class AS segmentation_class,
    fs.score AS segmentation_score,
    
    -- Última predição
    gp.predicted_value AS last_prediction_value,
    gp.confidence AS last_prediction_confidence,
    gp.method AS last_prediction_method,
    gp.created_at AS last_prediction_date
    
FROM public.females f
LEFT JOIN public.female_segmentations fs ON f.id = fs.female_id
LEFT JOIN LATERAL (
    SELECT * FROM public.genetic_predictions 
    WHERE female_id = f.id 
    ORDER BY created_at DESC 
    LIMIT 1
) gp ON true;

-- View denormalizada de touros (para consumo frontend)
CREATE OR REPLACE VIEW public.bulls_denorm AS
SELECT 
    b.id,
    b.code, -- NAAB
    b.name,
    b.registration,
    b.birth_date,
    b.sire_naab,
    b.mgs_naab,
    b.mmgs_naab,
    b.created_at,
    b.updated_at,
    
    -- PTAs extraídos do JSON (mesmos campos das fêmeas)
    (b.ptas->>'hhp_dollar')::NUMERIC AS hhp_dollar,
    (b.ptas->>'tpi')::NUMERIC AS tpi,
    (b.ptas->>'nm_dollar')::NUMERIC AS nm_dollar,
    (b.ptas->>'cm_dollar')::NUMERIC AS cm_dollar,
    (b.ptas->>'fm_dollar')::NUMERIC AS fm_dollar,
    (b.ptas->>'gm_dollar')::NUMERIC AS gm_dollar,
    (b.ptas->>'f_sav')::NUMERIC AS f_sav,
    (b.ptas->>'ptam')::NUMERIC AS ptam,
    (b.ptas->>'cfp')::NUMERIC AS cfp,
    (b.ptas->>'ptaf')::NUMERIC AS ptaf,
    (b.ptas->>'ptaf_pct')::NUMERIC AS ptaf_pct,
    (b.ptas->>'ptap')::NUMERIC AS ptap,
    (b.ptas->>'ptap_pct')::NUMERIC AS ptap_pct,
    (b.ptas->>'pl')::NUMERIC AS pl,
    (b.ptas->>'dpr')::NUMERIC AS dpr,
    (b.ptas->>'liv')::NUMERIC AS liv,
    (b.ptas->>'scs')::NUMERIC AS scs,
    (b.ptas->>'mast')::NUMERIC AS mast,
    (b.ptas->>'met')::NUMERIC AS met,
    (b.ptas->>'rp')::NUMERIC AS rp,
    (b.ptas->>'da')::NUMERIC AS da,
    (b.ptas->>'ket')::NUMERIC AS ket,
    (b.ptas->>'mf')::NUMERIC AS mf,
    (b.ptas->>'ptat')::NUMERIC AS ptat,
    (b.ptas->>'udc')::NUMERIC AS udc,
    (b.ptas->>'flc')::NUMERIC AS flc,
    (b.ptas->>'sce')::NUMERIC AS sce,
    (b.ptas->>'dce')::NUMERIC AS dce,
    (b.ptas->>'ssb')::NUMERIC AS ssb,
    (b.ptas->>'dsb')::NUMERIC AS dsb,
    (b.ptas->>'h_liv')::NUMERIC AS h_liv,
    (b.ptas->>'ccr')::NUMERIC AS ccr,
    (b.ptas->>'hcr')::NUMERIC AS hcr,
    (b.ptas->>'fi')::NUMERIC AS fi,
    (b.ptas->>'gl')::NUMERIC AS gl,
    (b.ptas->>'efc')::NUMERIC AS efc,
    (b.ptas->>'bwc')::NUMERIC AS bwc,
    (b.ptas->>'sta')::NUMERIC AS sta,
    (b.ptas->>'str')::NUMERIC AS str,
    (b.ptas->>'dfm')::NUMERIC AS dfm,
    (b.ptas->>'rua')::NUMERIC AS rua,
    (b.ptas->>'rls')::NUMERIC AS rls,
    (b.ptas->>'rtp')::NUMERIC AS rtp,
    (b.ptas->>'ftl')::NUMERIC AS ftl,
    (b.ptas->>'rw')::NUMERIC AS rw,
    (b.ptas->>'rlr')::NUMERIC AS rlr,
    (b.ptas->>'fta')::NUMERIC AS fta,
    (b.ptas->>'fls')::NUMERIC AS fls,
    (b.ptas->>'fua')::NUMERIC AS fua,
    (b.ptas->>'ruh')::NUMERIC AS ruh,
    (b.ptas->>'ruw')::NUMERIC AS ruw,
    (b.ptas->>'ucl')::NUMERIC AS ucl,
    (b.ptas->>'udp')::NUMERIC AS udp,
    (b.ptas->>'ftp')::NUMERIC AS ftp,
    (b.ptas->>'rfi')::NUMERIC AS rfi,
    (b.ptas->>'beta_casein')::TEXT AS beta_casein,
    (b.ptas->>'kappa_casein')::TEXT AS kappa_casein,
    (b.ptas->>'gfi')::NUMERIC AS gfi
    
FROM public.bulls b;

-- View de inventário de sêmen (saldo por touro/fazenda)
CREATE OR REPLACE VIEW public.semen_inventory AS
SELECT 
    sm.farm_id,
    sm.bull_id,
    b.code AS bull_naab,
    b.name AS bull_name,
    sm.semen_type,
    SUM(
        CASE 
            WHEN sm.movement_type = 'entrada' THEN sm.quantity
            WHEN sm.movement_type = 'saida' THEN -sm.quantity
            ELSE 0
        END
    ) AS balance,
    COUNT(*) AS total_movements,
    MAX(sm.movement_date) AS last_movement_date
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

-- View de KPIs do dashboard por fazenda
CREATE OR REPLACE VIEW public.farm_dashboard_kpis AS
SELECT 
    f.id AS farm_id,
    f.name AS farm_name,
    f.owner_name,
    
    -- Contadores básicos
    COALESCE(female_stats.total_females, 0) AS total_females,
    COALESCE(female_stats.donor_count, 0) AS donor_females,
    COALESCE(female_stats.inter_count, 0) AS inter_females,
    COALESCE(female_stats.recipient_count, 0) AS recipient_females,
    
    -- Percentuais de segmentação
    CASE 
        WHEN COALESCE(female_stats.total_females, 0) > 0 
        THEN ROUND((COALESCE(female_stats.donor_count, 0) * 100.0 / female_stats.total_females), 1)
        ELSE 0 
    END AS donor_percentage,
    
    CASE 
        WHEN COALESCE(female_stats.total_females, 0) > 0 
        THEN ROUND((COALESCE(female_stats.inter_count, 0) * 100.0 / female_stats.total_females), 1)
        ELSE 0 
    END AS inter_percentage,
    
    CASE 
        WHEN COALESCE(female_stats.total_females, 0) > 0 
        THEN ROUND((COALESCE(female_stats.recipient_count, 0) * 100.0 / female_stats.total_females), 1)
        ELSE 0 
    END AS recipient_percentage,
    
    -- Médias de traços principais
    ROUND(COALESCE(female_stats.avg_nm_dollar, 0), 0) AS avg_nm_dollar,
    ROUND(COALESCE(female_stats.avg_tpi, 0), 0) AS avg_tpi,
    ROUND(COALESCE(female_stats.avg_hhp_dollar, 0), 0) AS avg_hhp_dollar,
    
    -- Contadores adicionais
    COALESCE(bull_picks.selected_bulls, 0) AS selected_bulls,
    COALESCE(predictions.total_predictions, 0) AS total_predictions,
    COALESCE(matings.total_matings, 0) AS total_matings,
    COALESCE(semen_stats.total_doses, 0) AS total_semen_doses,
    
    -- Datas dos últimos eventos
    female_stats.last_female_added,
    predictions.last_prediction_date,
    matings.last_mating_date,
    semen_stats.last_movement_date,
    
    f.created_at AS farm_created_at,
    f.updated_at AS farm_updated_at
    
FROM public.farms f

-- Estatísticas de fêmeas
LEFT JOIN (
    SELECT 
        fem.farm_id,
        COUNT(*) AS total_females,
        SUM(CASE WHEN fs.class = 'donor' THEN 1 ELSE 0 END) AS donor_count,
        SUM(CASE WHEN fs.class = 'inter' THEN 1 ELSE 0 END) AS inter_count,
        SUM(CASE WHEN fs.class = 'recipient' THEN 1 ELSE 0 END) AS recipient_count,
        AVG((fem.ptas->>'nm_dollar')::NUMERIC) AS avg_nm_dollar,
        AVG((fem.ptas->>'tpi')::NUMERIC) AS avg_tpi,
        AVG((fem.ptas->>'hhp_dollar')::NUMERIC) AS avg_hhp_dollar,
        MAX(fem.created_at) AS last_female_added
    FROM public.females fem
    LEFT JOIN public.female_segmentations fs ON fem.id = fs.female_id
    GROUP BY fem.farm_id
) female_stats ON f.id = female_stats.farm_id

-- Touros selecionados
LEFT JOIN (
    SELECT 
        fbp.farm_id,
        COUNT(*) AS selected_bulls
    FROM public.farm_bull_picks fbp
    WHERE fbp.is_active = true
    GROUP BY fbp.farm_id
) bull_picks ON f.id = bull_picks.farm_id

-- Estatísticas de predições
LEFT JOIN (
    SELECT 
        gp.farm_id,
        COUNT(*) AS total_predictions,
        MAX(gp.created_at) AS last_prediction_date
    FROM public.genetic_predictions gp
    GROUP BY gp.farm_id
) predictions ON f.id = predictions.farm_id

-- Estatísticas de acasalamentos
LEFT JOIN (
    SELECT 
        m.farm_id,
        COUNT(*) AS total_matings,
        MAX(m.created_at) AS last_mating_date
    FROM public.matings m
    GROUP BY m.farm_id
) matings ON f.id = matings.farm_id

-- Estatísticas de sêmen
LEFT JOIN (
    SELECT 
        si.farm_id,
        SUM(si.balance) AS total_doses,
        MAX(si.last_movement_date) AS last_movement_date
    FROM public.semen_inventory si
    GROUP BY si.farm_id
) semen_stats ON f.id = semen_stats.farm_id;