
CREATE OR REPLACE FUNCTION public.calculate_hhp_dollar(
  p_ptaf numeric, p_ptap numeric, p_pl numeric, p_liv numeric, p_scs numeric,
  p_dpr numeric, p_ccr numeric, p_rfi numeric, p_sta numeric, p_dfm numeric,
  p_ruw numeric, p_udp numeric, p_rtp numeric, p_ftl numeric, p_mast numeric
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE result numeric;
BEGIN
  -- Official HHP$ 2025 formula (per HHP_Index_auto spreadsheet).
  -- Returns NULL if ANY of the 15 required traits is missing.
  IF p_ptaf IS NULL OR p_ptap IS NULL OR p_pl IS NULL OR p_liv IS NULL
     OR p_scs IS NULL OR p_dpr IS NULL OR p_ccr IS NULL OR p_rfi IS NULL
     OR p_sta IS NULL OR p_dfm IS NULL OR p_ruw IS NULL OR p_udp IS NULL
     OR p_rtp IS NULL OR p_ftl IS NULL OR p_mast IS NULL THEN
    RETURN NULL;
  END IF;

  result :=
      4.91   * p_ptaf
    + 6.01   * p_ptap
    + 12.83  * p_pl
    + 10.69  * p_liv
    + (-158.56) * (p_scs - 3)
    + 19.30  * p_dpr
    + 15.84  * p_ccr
    + (-0.19) * p_rfi
    + (-13.32) * p_sta
    + (-8.88)  * p_dfm
    + 8.88   * p_ruw
    + 13.32  * p_udp
    + (-14.80) * (ABS(p_rtp) - 0.65)
    + (-26.64) * (ABS(p_ftl) - 0.50)
    + 25.37  * p_mast;

  RETURN ROUND(result, 0);
END;
$function$;
