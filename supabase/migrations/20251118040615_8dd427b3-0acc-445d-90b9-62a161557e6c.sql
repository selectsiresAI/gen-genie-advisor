
-- Fix inconsistency between normalize_naab() and trigger
-- The normalize_naab() function removes leading zeros, so the trigger should NOT add them

BEGIN;

-- Update the trigger function to NOT add leading zeros for 29HO codes
CREATE OR REPLACE FUNCTION public.normalize_bull_code_and_sire()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Normalize code -> uppercase, remove non-alphanumeric
  IF NEW.code IS NOT NULL THEN
    -- Use the same logic as normalize_naab() function
    NEW.code_normalized := UPPER(REPLACE(REPLACE(TRIM(NEW.code), ' ', ''), '-', ''));
    NEW.code_normalized := regexp_replace(NEW.code_normalized, '[^0-9A-Z]', '', 'g');
    
    -- Remove leading zeros before digits followed by letters (same as normalize_naab)
    NEW.code_normalized := regexp_replace(NEW.code_normalized, '^0+([1-9][0-9]*[A-Z]+)', '\1');
    NEW.code_normalized := regexp_replace(NEW.code_normalized, '^0+([A-Z]+)', '\1');
  ELSE
    NEW.code_normalized := NULL;
  END IF;

  -- Populate sire_naab from last 5 digits of code_normalized when sire_naab is null or empty
  IF (NEW.sire_naab IS NULL OR btrim(NEW.sire_naab) = '') AND NEW.code_normalized IS NOT NULL THEN
    NEW.sire_naab := right(regexp_replace(NEW.code_normalized, '[^0-9]', '', 'g'), 5);
    IF NEW.sire_naab = '' THEN
      NEW.sire_naab := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix existing records to match normalize_naab() logic
UPDATE public.bulls
SET code_normalized = public.normalize_naab(code)
WHERE code IS NOT NULL
  AND code_normalized IS DISTINCT FROM public.normalize_naab(code);

COMMIT;
