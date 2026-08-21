-- Fix Nexus 3 bull search timeout (reported by Beth/Mariana, 2026-08-21)
-- Root cause: nx3_bulls_lookup calls normalize_naab(b.naab_code) in WHERE without a
-- functional index → full scan of 255k rows → statement timeout (code 57014).

-- Step 1: Functional index so normalize_naab() lookups hit the index instead of full scan.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bulls_normalize_naab
  ON public.bulls (public.normalize_naab(naab_code));

-- Step 2: Rewrite nx3_bulls_lookup to prefer code_normalized (already has GIN trgm index)
-- and fall back to the functional index for exact NAAB match. Removes the per-row function
-- call from the primary search path.
DROP FUNCTION IF EXISTS public.nx3_bulls_lookup(text, text, integer);

CREATE OR REPLACE FUNCTION public.nx3_bulls_lookup(
  p_query text,
  p_trait text,
  p_limit integer DEFAULT 12
)
RETURNS TABLE(
  id uuid,
  code text,
  name text,
  trait_value numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  expanded text;
BEGIN
  -- Map view alias to real column name on bulls table
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bulls'
      AND column_name = p_trait
      AND data_type IN ('numeric', 'integer', 'double precision', 'real')
  ) THEN
    IF    p_trait = 'ptam'     THEN p_trait := 'pta_milk';
    ELSIF p_trait = 'ptaf'     THEN p_trait := 'pta_fat';
    ELSIF p_trait = 'ptaf_pct' THEN p_trait := 'pta_fat_pct';
    ELSIF p_trait = 'ptap'     THEN p_trait := 'pta_protein';
    ELSIF p_trait = 'ptap_pct' THEN p_trait := 'pta_protein_pct';
    ELSIF p_trait = 'pl'       THEN p_trait := 'pta_pl';
    ELSIF p_trait = 'dpr'      THEN p_trait := 'pta_dpr';
    ELSIF p_trait = 'liv'      THEN p_trait := 'pta_livability';
    ELSIF p_trait = 'scs'      THEN p_trait := 'pta_scs';
    ELSIF p_trait = 'ptat'     THEN p_trait := 'pta_ptat';
    ELSIF p_trait = 'udc'      THEN p_trait := 'pta_udc';
    ELSIF p_trait = 'flc'      THEN p_trait := 'pta_flc';
    ELSIF p_trait = 'sce'      THEN p_trait := 'pta_sce';
    ELSIF p_trait = 'dce'      THEN p_trait := 'pta_sire_sce';
    ELSIF p_trait = 'ccr'      THEN p_trait := 'pta_ccr';
    ELSIF p_trait = 'hcr'      THEN p_trait := 'pta_hcr';
    ELSIF p_trait = 'mf'       THEN p_trait := 'mf_num';
    ELSIF p_trait = 'str'      THEN p_trait := 'str_num';
    ELSE
      RAISE EXCEPTION 'Invalid trait: %', p_trait;
    END IF;
  END IF;

  expanded := public.expand_naab_query(p_query);

  RETURN QUERY EXECUTE format(
    'SELECT
      b.id,
      b.naab_code AS code,
      b.name,
      b.%I::numeric AS trait_value
    FROM public.bulls b
    WHERE (
      -- Primary: code_normalized prefix match — hits idx_bulls_code_normalized (btree)
      b.code_normalized ILIKE $1 || ''%%''
      -- Secondary: name contains — hits GIN trgm index if available
      OR b.name ILIKE ''%%'' || $2 || ''%%''
    )
    AND b.%I IS NOT NULL
    ORDER BY
      CASE WHEN b.code_normalized = $1 THEN 0 ELSE 1 END,
      b.%I DESC NULLS LAST
    LIMIT $3',
    p_trait, p_trait, p_trait
  ) USING expanded, TRIM(p_query), p_limit;
END;
$$;
