-- Atualizar função normalize_naab para remover zeros à esquerda
CREATE OR REPLACE FUNCTION public.normalize_naab(input_naab text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
    normalized TEXT;
BEGIN
    IF input_naab IS NULL OR input_naab = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remover espaços, hífens e converter para uppercase
    normalized := UPPER(REPLACE(REPLACE(TRIM(input_naab), ' ', ''), '-', ''));
    
    -- Remover zeros à esquerda antes das letras
    -- Exemplos: 007HO -> 7HO, 011HO -> 11HO, 0014HO -> 14HO
    -- Mantém: 7HO00001 (zeros após letras)
    normalized := regexp_replace(normalized, '^0+([1-9][0-9]*[A-Z]+)', '\1');
    normalized := regexp_replace(normalized, '^0+([A-Z]+)', '\1');
    
    RETURN normalized;
END;
$function$;