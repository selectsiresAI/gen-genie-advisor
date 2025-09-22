-- Fix ambiguous column reference in my_farms function
CREATE OR REPLACE FUNCTION public.my_farms()
RETURNS TABLE(
    farm_id uuid,
    farm_name text,
    owner_name text,
    my_role text,
    is_default boolean,
    created_at timestamp with time zone,
    total_females integer,
    selected_bulls integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id UUID;
BEGIN
    -- Verificar autenticação
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        f.id AS farm_id,
        f.name AS farm_name,
        f.owner_name,
        uf.role::TEXT AS my_role,
        (p.default_farm_id = f.id) AS is_default,
        f.created_at,
        COALESCE(female_count.total, 0)::INT AS total_females,
        COALESCE(bull_count.total, 0)::INT AS selected_bulls
    FROM public.farms f
    JOIN public.user_farms uf ON f.id = uf.farm_id
    LEFT JOIN public.profiles p ON p.id = current_user_id
    LEFT JOIN (
        SELECT females.farm_id, COUNT(*) as total
        FROM public.females
        GROUP BY females.farm_id
    ) female_count ON f.id = female_count.farm_id
    LEFT JOIN (
        SELECT fbp.farm_id, COUNT(*) as total
        FROM public.farm_bull_picks fbp
        WHERE fbp.is_active = TRUE
        GROUP BY fbp.farm_id
    ) bull_count ON f.id = bull_count.farm_id
    WHERE uf.user_id = current_user_id
    ORDER BY 
        (p.default_farm_id = f.id) DESC,
        uf.role = 'owner' DESC,
        f.created_at DESC;
END;
$function$;