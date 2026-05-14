-- Backfill missing pta_ccr from ccr_num (data column mismatch on recent imports)
UPDATE public.bulls
SET pta_ccr = ccr_num
WHERE pta_ccr IS NULL AND ccr_num IS NOT NULL;

-- Make trigger resilient to either column being populated
CREATE OR REPLACE FUNCTION public.trg_bulls_calc_hhp_dollar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.hhp_dollar IS NULL THEN
    NEW.hhp_dollar := public.calculate_hhp_dollar(
      NEW.pta_fat,
      NEW.pta_protein,
      NEW.pta_pl,
      COALESCE(NEW.pta_livability, NEW.h_liv),
      NEW.pta_scs,
      NEW.pta_dpr,
      COALESCE(NEW.pta_ccr, NEW.ccr_num),
      NEW.rfi,
      NEW.sta,
      NEW.dfm,
      NEW.ruw,
      NEW.udp,
      NEW.rtp,
      NEW.ftl,
      NEW.mast
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Backfill HHP$ for all bulls where it can now be computed
UPDATE public.bulls
SET hhp_dollar = public.calculate_hhp_dollar(
  pta_fat, pta_protein, pta_pl,
  COALESCE(pta_livability, h_liv),
  pta_scs, pta_dpr,
  COALESCE(pta_ccr, ccr_num),
  rfi, sta, dfm, ruw, udp, rtp, ftl, mast
)
WHERE hhp_dollar IS NULL
  AND pta_fat IS NOT NULL AND pta_protein IS NOT NULL AND pta_pl IS NOT NULL
  AND COALESCE(pta_livability, h_liv) IS NOT NULL
  AND pta_scs IS NOT NULL AND pta_dpr IS NOT NULL
  AND COALESCE(pta_ccr, ccr_num) IS NOT NULL
  AND rfi IS NOT NULL AND sta IS NOT NULL AND dfm IS NOT NULL
  AND ruw IS NOT NULL AND udp IS NOT NULL AND rtp IS NOT NULL
  AND ftl IS NOT NULL AND mast IS NOT NULL;