-- Fix de performance achado na revisao visual: find_bulls_smart_batch chamava
-- find_bull_smart() por item, incluindo o fallback fuzzy (similarity() em 299k
-- touros). Pra lotes reais (rebanho com dezenas de codigos sem alias cadastrado),
-- isso estourava o statement_timeout do Postgres (~9s), derrubando a function
-- inteira com HTTP 500 e nenhum nome resolvido, nem os que tinham match rapido.
--
-- find_bull_exact: os 4 passos rapidos e indexados (NAAB, alias, variante "M",
-- registration exata) - SEM fuzzy. find_bull_smart (busca humana, 1 termo) continua
-- com fuzzy - la faz sentido, o volume e 1 por vez.
CREATE OR REPLACE FUNCTION public.find_bull_exact(p_query text)
RETURNS TABLE(bull_id uuid, code text, name text, registration text, match_type text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  q text := upper(trim(p_query));
  q_no_m text;
  r record;
  sentinels text[] := ARRAY['0','00','000','0000','N/A','NA','NULL','UNKNOWN',
    'DESCONHECIDO','NAO INFORMADO','SEM INFORMACAO','INFORMAR','-','--'];
BEGIN
  IF q IS NULL OR length(q) < 2 THEN
    RETURN;
  END IF;
  IF q = ANY(sentinels) THEN
    RETURN;
  END IF;

  IF q ~ '^[0-9]' THEN
    SELECT * INTO r FROM public.get_bull_by_naab(q) LIMIT 1;
    IF FOUND AND r.found THEN
      bull_id := r.bull_id; code := r.code; name := r.name; registration := r.registration; match_type := 'naab_exact';
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
    SELECT b.id, b.naab_code, b.name, b.registration, 'intl_alias'::text
    FROM public.bull_naab_aliases a JOIN public.bulls b ON b.id = a.bull_id
    WHERE a.naab_variant = q LIMIT 3;
  IF FOUND THEN RETURN; END IF;

  q_no_m := regexp_replace(q, '^([A-Z]{2,3}[0-9]{3})M([0-9]+)$', '\1\2');
  IF q_no_m <> q THEN
    RETURN QUERY
      SELECT b.id, b.naab_code, b.name, b.registration, 'intl_alias'::text
      FROM public.bull_naab_aliases a JOIN public.bulls b ON b.id = a.bull_id
      WHERE a.naab_variant = q_no_m LIMIT 3;
    IF FOUND THEN RETURN; END IF;
  END IF;

  RETURN QUERY
    SELECT b.id, b.naab_code, b.name, b.registration, 'registration'::text
    FROM public.bulls b WHERE upper(b.registration) = q AND upper(b.registration) <> ALL(sentinels) LIMIT 3;

  RETURN;
EXCEPTION WHEN OTHERS THEN
  RETURN;
END;
$function$;

-- find_bulls_smart_batch agora usa find_bull_exact (sem fuzzy) - rapido mesmo
-- com dezenas de codigos sem alias, porque so faz lookups indexados.
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

    SELECT * INTO r FROM public.find_bull_exact(q) LIMIT 1;
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

GRANT EXECUTE ON FUNCTION public.find_bull_exact(text) TO authenticated, anon, service_role;
