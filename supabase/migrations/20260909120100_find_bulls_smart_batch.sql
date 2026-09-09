-- Variante em lote de find_bull_smart, para telas que resolvem varios
-- codigos de uma vez (Rebanho, Top Pais) sem 1 round-trip por linha.
CREATE OR REPLACE FUNCTION public.find_bulls_smart_batch(p_queries text[])
RETURNS TABLE(input_query text, bull_id uuid, code text, name text, registration text, match_type text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  q text;
  r record;
BEGIN
  IF p_queries IS NULL THEN
    RETURN;
  END IF;

  FOREACH q IN ARRAY p_queries LOOP
    IF q IS NULL OR trim(q) = '' THEN
      CONTINUE;
    END IF;

    SELECT * INTO r FROM public.find_bull_smart(q) LIMIT 1;
    IF FOUND THEN
      input_query := q; bull_id := r.bull_id; code := r.code; name := r.name;
      registration := r.registration; match_type := r.match_type;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
EXCEPTION WHEN OTHERS THEN
  RETURN;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.find_bulls_smart_batch(text[]) TO authenticated, anon, service_role;
