-- Fix critical database issues found in platform audit
-- 1. Remove temporary_password from profiles (security: plaintext passwords)
-- 2. Enable RLS on password_reset_log
-- 3. Fix HHP$ trigger column names (pta_fat → ptaf JSONB keys)
-- 4. Add missing performance indexes

-- 1. Remove temporary_password column (SECURITY: plaintext passwords in DB)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS temporary_password;

-- 2. Enable RLS on password_reset_log
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_log' AND table_schema = 'public') THEN
    ALTER TABLE public.password_reset_log ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS password_reset_log_select ON public.password_reset_log;
    DROP POLICY IF EXISTS password_reset_log_insert ON public.password_reset_log;

    CREATE POLICY password_reset_log_select ON public.password_reset_log
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY password_reset_log_insert ON public.password_reset_log
      FOR INSERT TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- 3. Fix HHP$ auto-calculation: use correct JSONB key names (ptaf, not pta_fat)

DROP TRIGGER IF EXISTS trg_calculate_hhp_dollar_bulls ON public.bulls;
DROP TRIGGER IF EXISTS trg_calculate_hhp_dollar_females ON public.females;

CREATE OR REPLACE FUNCTION public.calculate_hhp_dollar(
  p_ptaf numeric, p_ptap numeric, p_pl numeric, p_liv numeric,
  p_scs numeric, p_dpr numeric, p_ccr numeric, p_rfi numeric,
  p_sta numeric, p_dfm numeric, p_ruw numeric, p_udp numeric,
  p_rtp numeric, p_ftl numeric, p_mast numeric
) RETURNS numeric
LANGUAGE plpgsql IMMUTABLE
SET search_path TO 'public'
AS $fn$
DECLARE
  result numeric;
  rtp_score numeric;
  ftl_score numeric;
  scs_score numeric;
BEGIN
  rtp_score := CASE
    WHEN p_rtp IS NULL THEN 0
    ELSE -1.0 * ABS(COALESCE(p_rtp, 0) - 2.30)
  END;

  ftl_score := CASE
    WHEN p_ftl IS NULL THEN 0
    ELSE -1.0 * ABS(COALESCE(p_ftl, 0) - 0.50)
  END;

  scs_score := CASE
    WHEN p_scs IS NULL THEN 0
    WHEN p_scs <= 2.50 THEN 0
    ELSE -1.0 * (p_scs - 2.50)
  END;

  result :=
    (COALESCE(p_ptaf, 0) * 3.80) +
    (COALESCE(p_ptap, 0) * 6.44) +
    (COALESCE(p_pl, 0) * 13.80) +
    (COALESCE(p_liv, 0) * 7.41) +
    (scs_score * 30.20) +
    (COALESCE(p_dpr, 0) * 6.82) +
    (COALESCE(p_ccr, 0) * 3.50) +
    (COALESCE(p_rfi, 0) * (-16.67)) +
    (COALESCE(p_sta, 0) * 7.69) +
    (COALESCE(p_dfm, 0) * 3.85) +
    (COALESCE(p_ruw, 0) * 3.85) +
    (COALESCE(p_udp, 0) * 11.54) +
    (rtp_score * 7.69) +
    (ftl_score * 7.69) +
    (COALESCE(p_mast, 0) * (-4.00));

  RETURN ROUND(result, 0);
END;
$fn$;

-- Trigger for bulls: extract from ptas JSONB with correct keys
CREATE OR REPLACE FUNCTION public.trg_calculate_hhp_dollar_bulls()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  ptas jsonb;
BEGIN
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

-- Trigger for females: same JSONB extraction
CREATE OR REPLACE FUNCTION public.trg_calculate_hhp_dollar_females()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  ptas jsonb;
BEGIN
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

CREATE TRIGGER trg_calculate_hhp_dollar_bulls
  BEFORE INSERT OR UPDATE OF ptas ON public.bulls
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_calculate_hhp_dollar_bulls();

CREATE TRIGGER trg_calculate_hhp_dollar_females
  BEFORE INSERT OR UPDATE OF ptas ON public.females
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_calculate_hhp_dollar_females();

-- 4. Missing performance indexes
CREATE INDEX IF NOT EXISTS idx_farm_tanks_client_id ON public.farm_tanks (client_id);
CREATE INDEX IF NOT EXISTS idx_semen_movements_tank_id ON public.semen_movements (tank_id);
CREATE INDEX IF NOT EXISTS idx_semen_movements_date ON public.semen_movements (movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles (full_name);
