-- Modificar a função get_bulls_denorm para permitir acesso público aos touros
-- já que touros são dados de catálogo público
CREATE OR REPLACE FUNCTION public.get_bulls_denorm()
 RETURNS SETOF bulls_denorm
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Remover verificação de autenticação para touros (dados públicos de catálogo)
    RETURN QUERY SELECT * FROM public.bulls_denorm;
END;
$function$;