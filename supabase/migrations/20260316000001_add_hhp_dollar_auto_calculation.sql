-- HHP$ Auto Calculation with upload precedence
-- 1) If hhp_dollar is provided (e.g. from spreadsheet upload), keep it as-is
-- 2) If hhp_dollar is NULL, calculate automatically using HHP$ 2025 formula

-- Function: calculate HHP$ from 15 trait parameters
CREATE OR REPLACE FUNCTION calculate_hhp_dollar(
  p_ptaf  numeric, p_ptap numeric, p_pl   numeric,
  p_liv   numeric, p_scs  numeric, p_dpr  numeric,
  p_ccr   numeric, p_rfi  numeric, p_sta  numeric,
  p_dfm   numeric, p_ruw  numeric, p_udp  numeric,
  p_rtp   numeric, p_ftl  numeric, p_mast numeric
) RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN (
      p_ptaf IS NULL OR p_ptap IS NULL OR p_pl   IS NULL OR
      p_liv  IS NULL OR p_scs  IS NULL OR p_dpr  IS NULL OR
      p_ccr  IS NULL OR p_rfi  IS NULL OR p_sta  IS NULL OR
      p_dfm  IS NULL OR p_ruw  IS NULL OR p_udp  IS NULL OR
      p_rtp  IS NULL OR p_ftl  IS NULL OR p_mast IS NULL
    ) THEN NULL
    ELSE ROUND((
        (4.91  * p_ptaf)
      + (6.01  * p_ptap)
      + (12.83 * p_pl)
      + (10.69 * p_liv)
      - (158.56 * (p_scs - 3))
      + (19.3  * p_dpr)
      + (15.84 * p_ccr)
      - (0.19  * p_rfi)
      - (13.32 * p_sta)
      - (8.88  * p_dfm)
      + (8.88  * p_ruw)
      + (13.32 * p_udp)
      - (14.80 * (ABS(p_rtp) - 0.65))
      - (26.64 * (ABS(p_ftl) - 0.50))
      + (25.37 * p_mast)
    )::numeric, 2)
  END;
$$;

-- Trigger function for bulls: preserve uploaded value, calculate only if NULL
CREATE OR REPLACE FUNCTION trg_bulls_calc_hhp_dollar()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.hhp_dollar IS NULL THEN
    NEW.hhp_dollar := calculate_hhp_dollar(
      NEW.pta_fat, NEW.pta_protein, NEW.pta_pl, NEW.pta_livability, NEW.pta_scs,
      NEW.pta_dpr, NEW.pta_ccr, NEW.rfi, NEW.sta, NEW.dfm,
      NEW.ruw, NEW.udp, NEW.rtp, NEW.ftl, NEW.mast
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for females: preserve uploaded value, calculate only if NULL
CREATE OR REPLACE FUNCTION trg_females_calc_hhp_dollar()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.hhp_dollar IS NULL THEN
    NEW.hhp_dollar := calculate_hhp_dollar(
      NEW.pta_fat, NEW.pta_protein, NEW.pta_pl, NEW.pta_livability, NEW.pta_scs,
      NEW.pta_dpr, NEW.pta_ccr, NEW.rfi, NEW.sta, NEW.dfm,
      NEW.ruw, NEW.udp, NEW.rtp, NEW.ftl, NEW.mast
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trg_bulls_hhp_dollar ON public.bulls;
CREATE TRIGGER trg_bulls_hhp_dollar
  BEFORE INSERT OR UPDATE ON public.bulls
  FOR EACH ROW EXECUTE FUNCTION trg_bulls_calc_hhp_dollar();

DROP TRIGGER IF EXISTS trg_females_hhp_dollar ON public.females;
CREATE TRIGGER trg_females_hhp_dollar
  BEFORE INSERT OR UPDATE ON public.females
  FOR EACH ROW EXECUTE FUNCTION trg_females_calc_hhp_dollar();
