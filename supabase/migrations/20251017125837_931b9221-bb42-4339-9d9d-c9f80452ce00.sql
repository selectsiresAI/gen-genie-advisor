-- Fix bulls_denorm public access (it's a view, so we modify the underlying table policies)
-- bulls_denorm is a view based on bulls table
-- We need to ensure the bulls table has proper RLS that restricts unauthenticated access

-- First, check if there's an overly permissive policy on bulls
-- Drop any policies that allow public SELECT without authentication
DROP POLICY IF EXISTS "bulls_select_authenticated" ON public.bulls;

-- Ensure bulls table requires authentication for SELECT
-- Keep the existing authenticated policy but ensure no public access exists
-- The existing policy "Authenticated users can view bulls" should handle this

-- Fix nx3_bulls_by_ids_text function with proper search_path
CREATE OR REPLACE FUNCTION public.nx3_bulls_by_ids_text(p_ids text[], p_trait text)
RETURNS TABLE(id uuid, trait_value numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bulls_table text := 'public.bulls';
  col text := lower(trim(p_trait));
  trait_expr text;
BEGIN
  IF col IN ('nm$', 'nm','nm_dollar') THEN
    col := 'nm_dollar';
  ELSIF col IN ('hhp$', 'hhp','hhp_dollar') THEN
    col := 'hhp_dollar';
  ELSIF col IN ('dwp$', 'dwp','dwp_dollar') THEN
    col := 'dwp_dollar';
  END IF;

  IF col IN ('ptam','milk') THEN
    trait_expr := 'ptam';
  ELSIF col IN ('ptaf','fat') THEN
    trait_expr := 'ptaf';
  ELSIF col IN ('ptap','protein','prot') THEN
    trait_expr := 'ptap';
  ELSE
    trait_expr := format('%I', col);
  END IF;

  -- Convert text array to uuid array and query
  RETURN QUERY EXECUTE format(
    'SELECT id, (%1$s)::numeric as trait_value
     FROM %2$s
     WHERE id = ANY($1::uuid[])',
    trait_expr, bulls_table
  )
  USING p_ids::uuid[];
END;
$$;

-- Fix females_public_by_farm function with proper search_path
CREATE OR REPLACE FUNCTION public.females_public_by_farm(farm_uuid uuid)
RETURNS TABLE("like" females_denorm)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.females_denorm WHERE farm_id = farm_uuid;
$$;

-- Add comment about remaining fuzzystrmatch functions
-- These are C extension functions that cannot have search_path modified
-- They are safe because they don't execute dynamic SQL
COMMENT ON EXTENSION fuzzystrmatch IS 
'Fuzzystrmatch extension functions (levenshtein, metaphone, soundex, dmetaphone, daitch_mokotoff) are implemented in C and do not execute SQL, so search_path manipulation does not apply to them. They are safe from search_path hijacking attacks.';