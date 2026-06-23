CREATE OR REPLACE FUNCTION public.update_farm_basic(
  farm_uuid uuid,
  new_farm_name text,
  new_owner_name text
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  my_role text;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Usuário não autenticado'::text; RETURN;
  END IF;

  IF new_farm_name IS NULL OR TRIM(new_farm_name) = '' THEN
    RETURN QUERY SELECT FALSE, 'Nome da fazenda é obrigatório'::text; RETURN;
  END IF;

  SELECT role INTO my_role
  FROM public.user_farms
  WHERE client_id = farm_uuid AND user_id = current_user_id;

  IF my_role IS NULL OR my_role NOT IN ('owner','editor') THEN
    RETURN QUERY SELECT FALSE, 'Apenas proprietário ou editor pode renomear'::text; RETURN;
  END IF;

  UPDATE public.clients
     SET farm_name  = TRIM(new_farm_name),
         nome       = TRIM(new_farm_name),
         owner_name = COALESCE(NULLIF(TRIM(new_owner_name), ''), owner_name),
         updated_at = now()
   WHERE id = farm_uuid;

  RETURN QUERY SELECT TRUE, 'Fazenda atualizada com sucesso'::text;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.update_farm_basic(uuid, text, text) TO authenticated;