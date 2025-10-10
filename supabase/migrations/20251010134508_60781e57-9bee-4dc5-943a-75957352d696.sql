-- Adicionar coluna 'fonte' na tabela females
ALTER TABLE public.females 
ADD COLUMN fonte TEXT;

-- Recriar a view females_denorm para incluir a nova coluna 'fonte'
DROP VIEW IF EXISTS public.females_denorm CASCADE;

CREATE OR REPLACE VIEW public.females_denorm AS
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
  f.beta_casein,
  f.kappa_casein,
  f.fonte,
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
  gp.method AS last_prediction_method,
  gp.predicted_value AS last_prediction_value,
  gp.confidence AS last_prediction_confidence,
  gp.created_at AS last_prediction_date,
  fs.class AS segmentation_class,
  fs.score AS segmentation_score
FROM public.females f
LEFT JOIN LATERAL (
  SELECT method, predicted_value, confidence, created_at
  FROM public.genetic_predictions
  WHERE female_id = f.id
  ORDER BY created_at DESC
  LIMIT 1
) gp ON true
LEFT JOIN LATERAL (
  SELECT class, score
  FROM public.female_segmentations
  WHERE female_id = f.id
  ORDER BY created_at DESC
  LIMIT 1
) fs ON true;

-- Adicionar comentário descritivo
COMMENT ON COLUMN public.females.fonte IS 'Fonte/origem da fêmea (ex: importação, registro manual, etc.)';