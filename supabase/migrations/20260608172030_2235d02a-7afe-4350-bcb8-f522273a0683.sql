
-- Remove the redundant jsonb-based triggers; the column-based triggers
-- (trg_females_hhp_dollar / trg_bulls_hhp_dollar) handle all current write paths.
DROP TRIGGER IF EXISTS trg_calculate_hhp_dollar_females ON public.females;
DROP TRIGGER IF EXISTS trg_calculate_hhp_dollar_bulls ON public.bulls;
DROP FUNCTION IF EXISTS public.trg_calculate_hhp_dollar_females();
DROP FUNCTION IF EXISTS public.trg_calculate_hhp_dollar_bulls();

-- Backfill: recompute HHP$ for females where it ended up at 0 due to the bug
-- but actually has PTA data available.
UPDATE public.females
SET hhp_dollar = NULL
WHERE hhp_dollar = 0
  AND (pta_fat IS NOT NULL OR pta_protein IS NOT NULL OR pta_pl IS NOT NULL
       OR pta_livability IS NOT NULL OR pta_scs IS NOT NULL OR pta_dpr IS NOT NULL);

-- Touch rows so the remaining trigger recomputes hhp_dollar from top-level columns
UPDATE public.females
SET updated_at = now()
WHERE hhp_dollar IS NULL
  AND (pta_fat IS NOT NULL OR pta_protein IS NOT NULL OR pta_pl IS NOT NULL
       OR pta_livability IS NOT NULL OR pta_scs IS NOT NULL OR pta_dpr IS NOT NULL);
