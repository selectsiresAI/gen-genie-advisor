-- Ensure the fonte column exists across female tables and expose it through females_denorm
ALTER TABLE IF EXISTS public.females
  ADD COLUMN IF NOT EXISTS fonte text;

ALTER TABLE IF EXISTS public.females_
  ADD COLUMN IF NOT EXISTS fonte text;

ALTER TABLE IF EXISTS public.female_
  ADD COLUMN IF NOT EXISTS fonte text;

ALTER TABLE IF EXISTS app.females
  ADD COLUMN IF NOT EXISTS fonte text;

ALTER TABLE IF EXISTS app.females_
  ADD COLUMN IF NOT EXISTS fonte text;

ALTER TABLE IF EXISTS app.female_
  ADD COLUMN IF NOT EXISTS fonte text;

DO $$
BEGIN
  -- If females_denorm is a physical table, just add the column.
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'females_denorm'
      AND table_type = 'BASE TABLE'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'females_denorm'
        AND column_name = 'fonte'
    ) THEN
      EXECUTE 'ALTER TABLE public.females_denorm ADD COLUMN fonte text';
    END IF;
  ELSE
    -- Otherwise refresh the view so it projects the fonte column.
    EXECUTE $$
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
          f.fonte,
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
          lp.method AS last_prediction_method,
          lp.predicted_value AS last_prediction_value,
          lp.confidence AS last_prediction_confidence,
          lp.created_at AS last_prediction_date,
          ls.class AS segmentation_class,
          ls.score AS segmentation_score
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
    $$;
  END IF;
END
$$;
