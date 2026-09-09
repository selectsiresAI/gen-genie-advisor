-- find_bull_smart: busca unica de touro que aceita NAAB padrao, ID internacional
-- (com fallback pra variante "M" espuria e pra registration), e fuzzy por nome.
-- Nunca lanca excecao para o caller - sempre retorna set (vazio se nada bater).
CREATE OR REPLACE FUNCTION public.find_bull_smart(p_query text)
RETURNS TABLE(bull_id uuid, code text, name text, registration text, match_type text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  q text := upper(trim(p_query));
  q_no_m text;
  r record;
BEGIN
  IF q IS NULL OR q = '' THEN
    RETURN;
  END IF;

  -- 1. NAAB padrao (comeca com digito): delega pro resolver ja existente e provado
  IF q ~ '^[0-9]' THEN
    SELECT * INTO r FROM public.get_bull_by_naab(q) LIMIT 1;
    IF FOUND AND r.found THEN
      bull_id := r.bull_id; code := r.code; name := r.name; registration := r.registration; match_type := 'naab_exact';
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;

  -- 2. ID internacional: alias exato (raca+pais+registro, ex HO840003147118734)
  RETURN QUERY
    SELECT b.id, b.naab_code, b.name, b.registration, 'intl_alias'::text
    FROM public.bull_naab_aliases a JOIN public.bulls b ON b.id = a.bull_id
    WHERE a.naab_variant = q LIMIT 3;
  IF FOUND THEN RETURN; END IF;

  -- 2b. variante com "M" espuria entre pais e registro (ex HO840M003130641796)
  q_no_m := regexp_replace(q, '^([A-Z]{2,3}[0-9]{3})M([0-9]+)$', '\1\2');
  IF q_no_m <> q THEN
    RETURN QUERY
      SELECT b.id, b.naab_code, b.name, b.registration, 'intl_alias'::text
      FROM public.bull_naab_aliases a JOIN public.bulls b ON b.id = a.bull_id
      WHERE a.naab_variant = q_no_m LIMIT 3;
    IF FOUND THEN RETURN; END IF;
  END IF;

  -- 2c. registration exata (fallback historico do get-my-auditoria)
  RETURN QUERY
    SELECT b.id, b.naab_code, b.name, b.registration, 'registration'::text
    FROM public.bulls b WHERE upper(b.registration) = q LIMIT 3;
  IF FOUND THEN RETURN; END IF;

  -- 3. fuzzy por nome/registration (nunca deixa vazio se tiver algo parecido -
  --    cobre o caso de nome puro digitado direto, ex "Captain", "Holysmokes")
  RETURN QUERY
    SELECT b.id, b.naab_code, b.name, b.registration, 'fuzzy_name'::text
    FROM public.bulls b
    WHERE b.name ILIKE '%' || p_query || '%' OR b.registration ILIKE '%' || p_query || '%'
    ORDER BY similarity(coalesce(b.name, ''), p_query) DESC
    LIMIT 10;

  RETURN;
EXCEPTION WHEN OTHERS THEN
  -- blindagem final: nunca propaga erro pro frontend, so retorna vazio
  RETURN;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.find_bull_smart(text) TO authenticated, anon, service_role;
