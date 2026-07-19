-- ============================================================================
-- C2: recompute_hhp_batch raça-consciente
-- ----------------------------------------------------------------------------
-- Antes chamava calculate_hhp_dollar (Holstein), recalculando Jersey com fórmula
-- errada. Agora usa calculate_hhp_dollar_breed(NEW.breed, ...) para females e bulls,
-- mesmo mapeamento de colunas dos triggers (inclui pta_ptat=Type, da, h_liv).
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
    WITH cte AS (
      SELECT id, public.calculate_hhp_dollar_breed(
        breed, pta_fat, pta_protein, pta_pl, pta_livability, pta_scs,
        pta_dpr, pta_ccr, udp, mast, rfi, sta, dfm, ruw, rtp, ftl,
        pta_ptat, da, h_liv) AS new_hhp
      FROM public.females
      WHERE hhp_dollar IS DISTINCT FROM public.calculate_hhp_dollar_breed(
        breed, pta_fat, pta_protein, pta_pl, pta_livability, pta_scs,
        pta_dpr, pta_ccr, udp, mast, rfi, sta, dfm, ruw, rtp, ftl,
        pta_ptat, da, h_liv)
      LIMIT p_batch
    )
    UPDATE public.females f
       SET hhp_dollar = cte.new_hhp
      FROM cte
     WHERE f.id = cte.id
       AND cte.new_hhp IS NOT NULL;  -- preserve existing value when traits missing
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
  ELSIF p_table = 'bulls' THEN
    WITH cte AS (
      SELECT id, public.calculate_hhp_dollar_breed(
        breed, pta_fat, pta_protein, pta_pl,
        COALESCE(pta_livability, h_liv), pta_scs, pta_dpr,
        COALESCE(pta_ccr, ccr_num), udp, mast, rfi, sta, dfm, ruw, rtp, ftl,
        pta_ptat, da, h_liv) AS new_hhp
      FROM public.bulls
      WHERE hhp_dollar IS DISTINCT FROM public.calculate_hhp_dollar_breed(
        breed, pta_fat, pta_protein, pta_pl,
        COALESCE(pta_livability, h_liv), pta_scs, pta_dpr,
        COALESCE(pta_ccr, ccr_num), udp, mast, rfi, sta, dfm, ruw, rtp, ftl,
        pta_ptat, da, h_liv)
      LIMIT p_batch
    )
    UPDATE public.bulls b
       SET hhp_dollar = cte.new_hhp
      FROM cte
     WHERE b.id = cte.id
       AND cte.new_hhp IS NOT NULL;
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
  ELSE
    RAISE EXCEPTION 'Invalid table: %', p_table;
  END IF;
END;
$function$;
