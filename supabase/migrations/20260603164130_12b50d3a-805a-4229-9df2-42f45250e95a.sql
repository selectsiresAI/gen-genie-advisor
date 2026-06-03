
-- Preserve uploaded HHP$ value: only auto-calculate when hhp_dollar is NULL

CREATE OR REPLACE FUNCTION public.trg_calculate_hhp_dollar_bulls()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  ptas jsonb;
BEGIN
  -- If user supplied hhp_dollar (e.g. from spreadsheet upload), keep it
  IF NEW.hhp_dollar IS NOT NULL THEN
    RETURN NEW;
  END IF;

  ptas := COALESCE(NEW.ptas, '{}'::jsonb);
  NEW.hhp_dollar := public.calculate_hhp_dollar(
    (ptas->>'ptaf')::numeric,
    (ptas->>'ptap')::numeric,
    (ptas->>'pl')::numeric,
    (ptas->>'liv')::numeric,
    (ptas->>'scs')::numeric,
    (ptas->>'dpr')::numeric,
    (ptas->>'ccr')::numeric,
    (ptas->>'rfi')::numeric,
    (ptas->>'sta')::numeric,
    (ptas->>'dfm')::numeric,
    (ptas->>'ruw')::numeric,
    (ptas->>'udp')::numeric,
    (ptas->>'rtp')::numeric,
    (ptas->>'ftl')::numeric,
    (ptas->>'mast')::numeric
  );
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.trg_calculate_hhp_dollar_females()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  ptas jsonb;
BEGIN
  -- If user supplied hhp_dollar (e.g. from spreadsheet upload), keep it
  IF NEW.hhp_dollar IS NOT NULL THEN
    RETURN NEW;
  END IF;

  ptas := COALESCE(NEW.ptas, '{}'::jsonb);
  NEW.hhp_dollar := public.calculate_hhp_dollar(
    (ptas->>'ptaf')::numeric,
    (ptas->>'ptap')::numeric,
    (ptas->>'pl')::numeric,
    (ptas->>'liv')::numeric,
    (ptas->>'scs')::numeric,
    (ptas->>'dpr')::numeric,
    (ptas->>'ccr')::numeric,
    (ptas->>'rfi')::numeric,
    (ptas->>'sta')::numeric,
    (ptas->>'dfm')::numeric,
    (ptas->>'ruw')::numeric,
    (ptas->>'udp')::numeric,
    (ptas->>'rtp')::numeric,
    (ptas->>'ftl')::numeric,
    (ptas->>'mast')::numeric
  );
  RETURN NEW;
END;
$fn$;

-- Recreate triggers to also fire when hhp_dollar column itself changes
DROP TRIGGER IF EXISTS trg_calculate_hhp_dollar_bulls ON public.bulls;
CREATE TRIGGER trg_calculate_hhp_dollar_bulls
  BEFORE INSERT OR UPDATE OF ptas, hhp_dollar ON public.bulls
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_calculate_hhp_dollar_bulls();

DROP TRIGGER IF EXISTS trg_calculate_hhp_dollar_females ON public.females;
CREATE TRIGGER trg_calculate_hhp_dollar_females
  BEFORE INSERT OR UPDATE OF ptas, hhp_dollar ON public.females
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_calculate_hhp_dollar_females();
