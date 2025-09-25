CREATE OR REPLACE FUNCTION public.get_pta_trend_and_stats(farm_id uuid, trait_keys text[])
RETURNS TABLE (
    trait text,
    yearly jsonb,
    stats jsonb
) AS $$
DECLARE
    trait_key text;
    yearly_data jsonb;
    stats_data jsonb;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF farm_id IS NULL THEN
        RAISE EXCEPTION 'farm_id is required';
    END IF;

    IF NOT public.is_farm_member(farm_id) THEN
        RAISE EXCEPTION 'Access denied: not a member of this farm';
    END IF;

    IF trait_keys IS NULL OR array_length(trait_keys, 1) = 0 THEN
        RETURN;
    END IF;

    FOR trait_key IN
        SELECT DISTINCT lower(tk)
        FROM unnest(trait_keys) AS tk
    LOOP
        IF trait_key IS NULL OR trait_key = '' THEN
            CONTINUE;
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'females_denorm'
              AND column_name = trait_key
        ) THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'WITH yearly AS (
                SELECT EXTRACT(YEAR FROM birth_date)::int AS year,
                       AVG(%1$I) AS mean,
                       COUNT(%1$I) AS n
                FROM public.females_denorm
                WHERE farm_id = $1
                  AND birth_date IS NOT NULL
                  AND %1$I IS NOT NULL
                GROUP BY year
                ORDER BY year
            )
            SELECT COALESCE(jsonb_agg(jsonb_build_object(''year'', year, ''mean'', mean, ''n'', n) ORDER BY year), ''[]''::jsonb)
            FROM yearly;',
            trait_key
        )
        INTO yearly_data
        USING farm_id;

        EXECUTE format(
            'SELECT jsonb_build_object(
                ''mean'', AVG(%1$I),
                ''median'', percentile_cont(0.5) WITHIN GROUP (ORDER BY %1$I),
                ''min'', MIN(%1$I),
                ''max'', MAX(%1$I),
                ''sd'', stddev_pop(%1$I),
                ''n'', COUNT(%1$I)
            )
            FROM public.females_denorm
            WHERE farm_id = $1 AND %1$I IS NOT NULL;',
            trait_key
        )
        INTO stats_data
        USING farm_id;

        RETURN NEXT (
            trait_key,
            COALESCE(yearly_data, '[]'::jsonb),
            COALESCE(stats_data, jsonb_build_object(
                'mean', NULL,
                'median', NULL,
                'min', NULL,
                'max', NULL,
                'sd', NULL,
                'n', 0
            ))
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_pta_trend_and_stats(uuid, text[]) TO authenticated;
