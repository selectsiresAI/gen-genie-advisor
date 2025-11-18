-- Migration: normalize bulls code and sire_naab
-- Safe to run multiple times

-- Create or replace normalization function
CREATE OR REPLACE FUNCTION public.normalize_bull_code_and_sire()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Normalize code -> uppercase, remove non-alphanumeric
  IF NEW.code IS NOT NULL THEN
    NEW.code_normalized := regexp_replace(upper(NEW.code), '[^0-9A-Z]', '', 'g');
    
    -- Special case: codes starting with 29HO followed by 5 digits -> prepend 0 to make 029HO...
    IF NEW.code_normalized ~ '^29HO\d{5}$' THEN
      NEW.code_normalized := '0' || NEW.code_normalized;
    END IF;
  ELSE
    NEW.code_normalized := NULL;
  END IF;

  -- Populate sire_naab from last 5 digits of code_normalized when sire_naab is null or empty
  IF (NEW.sire_naab IS NULL OR btrim(NEW.sire_naab) = '') AND NEW.code_normalized IS NOT NULL THEN
    -- extract last 5 digits sequence
    NEW.sire_naab := right(regexp_replace(NEW.code_normalized, '[^0-9]', '', 'g'), 5);
    IF NEW.sire_naab = '' THEN
      NEW.sire_naab := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger (drop if exists to ensure idempotency)
DROP TRIGGER IF EXISTS bulls_normalize_trigger ON public.bulls;
CREATE TRIGGER bulls_normalize_trigger
  BEFORE INSERT OR UPDATE ON public.bulls
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_bull_code_and_sire();

-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_bulls_code_normalized ON public.bulls (code_normalized);
CREATE INDEX IF NOT EXISTS idx_bulls_sire_naab ON public.bulls (sire_naab);

-- Retrospective normalization of existing records
UPDATE public.bulls
SET 
  code_normalized = regexp_replace(upper(code), '[^0-9A-Z]', '', 'g'),
  sire_naab = CASE 
    WHEN (sire_naab IS NULL OR btrim(sire_naab) = '') THEN 
      NULLIF(right(regexp_replace(regexp_replace(upper(code), '[^0-9A-Z]', '', 'g'), '[^0-9]', '', 'g'), 5), '')
    ELSE 
      sire_naab
  END
WHERE code IS NOT NULL
  AND (
    code_normalized IS DISTINCT FROM regexp_replace(upper(code), '[^0-9A-Z]', '', 'g')
    OR (sire_naab IS NULL OR btrim(sire_naab) = '')
  );

-- Apply special case normalization for 29HO codes
UPDATE public.bulls
SET code_normalized = '0' || code_normalized
WHERE code_normalized ~ '^29HO\d{5}$';