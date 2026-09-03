-- ============================================================================
-- Fix: recompute_hhp_batch() declares "done" too early.
-- ----------------------------------------------------------------------------
-- Bug (found 2026-09-03 during the HHP$ 2026 reweight backfill): the candidate
-- SELECT was `WHERE hhp_dollar IS DISTINCT FROM calc(...) LIMIT p_batch`, with
-- no ORDER BY and no exclusion of rows whose calc(...) is NULL (unresolvable —
-- missing a required trait for the breed). The final UPDATE only touches rows
-- where new_hhp IS NOT NULL (intentional: never clobber an existing value with
-- NULL), but the candidate SELECT didn't apply that same filter. If the first
-- p_batch rows in physical scan order are all unresolvable, the UPDATE affects
-- 0 rows, and the caller (edge function `recompute-hhp`, `if (n===0) done=true`)
-- stops — even though thousands of resolvable rows exist further in the table.
-- Reproduced live: females stopped at 2,204/29,885 updatable rows; bulls
-- stopped at 0/32,129. Worked around manually via a one-shot UPDATE; this fixes
-- the function itself so future backfills don't need the same workaround.
--
-- Fix: use a LATERAL join to compute calculate_hhp_dollar_breed() once per row,
-- and filter to `new_hhp IS NOT NULL AND hhp_dollar IS DISTINCT FROM new_hhp` at
-- the CANDIDATE-SELECTION stage — so LIMIT only ever grabs rows that will
-- actually be updated. A return of 0 now genuinely means no work is left.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recompute_hhp_batch(p_table text, p_batch integer DEFAULT 5000)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  affected int;
BEGIN
  IF p_table = 'females' THEN
    WITH candidates AS (
      SELECT f.id, c.new_hhp
      FROM public.females f,
      LATERAL (
        SELECT public.calculate_hhp_dollar_breed(
          f.breed, f.pta_fat, f.pta_protein, f.pta_pl, f.pta_livability, f.pta_scs,
          f.pta_dpr, f.pta_ccr, f.udp, f.mast, f.rfi, f.sta, f.dfm, f.ruw, f.rtp, f.ftl,
          f.pta_ptat, f.da, f.h_liv
        ) AS new_hhp
      ) c
      WHERE c.new_hhp IS NOT NULL
        AND f.hhp_dollar IS DISTINCT FROM c.new_hhp
      LIMIT p_batch
    )
    UPDATE public.females f
       SET hhp_dollar = candidates.new_hhp
      FROM candidates
     WHERE f.id = candidates.id;
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
  ELSIF p_table = 'bulls' THEN
    WITH candidates AS (
      SELECT b.id, c.new_hhp
      FROM public.bulls b,
      LATERAL (
        SELECT public.calculate_hhp_dollar_breed(
          b.breed, b.pta_fat, b.pta_protein, b.pta_pl,
          COALESCE(b.pta_livability, b.h_liv), b.pta_scs, b.pta_dpr,
          COALESCE(b.pta_ccr, b.ccr_num), b.udp, b.mast, b.rfi, b.sta, b.dfm, b.ruw, b.rtp, b.ftl,
          b.pta_ptat, b.da, b.h_liv
        ) AS new_hhp
      ) c
      WHERE c.new_hhp IS NOT NULL
        AND b.hhp_dollar IS DISTINCT FROM c.new_hhp
      LIMIT p_batch
    )
    UPDATE public.bulls b
       SET hhp_dollar = candidates.new_hhp
      FROM candidates
     WHERE b.id = candidates.id;
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
  ELSE
    RAISE EXCEPTION 'Invalid table: %', p_table;
  END IF;
END;
$function$;
