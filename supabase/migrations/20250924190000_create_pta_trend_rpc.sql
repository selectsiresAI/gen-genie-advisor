-- Create RPC to retrieve PTA trends and statistics per farm
CREATE OR REPLACE FUNCTION public.get_pta_trend_and_stats(
    farm_id uuid,
    trait_keys text[]
)
RETURNS TABLE (
    trait text,
    yearly jsonb,
    stats jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
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

    RETURN QUERY
    WITH raw_values AS (
        SELECT
            tk.trait_key,
            date_part('year', f.birth_date)::int AS birth_year,
            CASE
                WHEN (to_jsonb(f) ->> tk.trait_key) ~ '^-?[0-9]+(\.[0-9]+)?$'
                    THEN (to_jsonb(f) ->> tk.trait_key)::numeric
                ELSE NULL
            END AS trait_value
        FROM public.females_denorm f
        CROSS JOIN LATERAL unnest(trait_keys) AS tk(trait_key)
        WHERE f.farm_id = farm_id
          AND f.birth_date IS NOT NULL
    ),
    filtered AS (
        SELECT *
        FROM raw_values
        WHERE trait_value IS NOT NULL
    ),
    yearly_data AS (
        SELECT
            trait_key,
            birth_year,
            COUNT(*)::int AS n,
            AVG(trait_value)::float AS mean
        FROM filtered
        WHERE birth_year IS NOT NULL
        GROUP BY trait_key, birth_year
    ),
    stats_data AS (
        SELECT
            trait_key,
            COUNT(*)::int AS n,
            AVG(trait_value)::float AS mean,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY trait_value)::float AS median,
            MIN(trait_value)::float AS min,
            MAX(trait_value)::float AS max,
            stddev_samp(trait_value)::float AS sd
        FROM filtered
        GROUP BY trait_key
    )
    SELECT
        s.trait_key AS trait,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'year', yd.birth_year,
                        'mean', yd.mean,
                        'n', yd.n
                    )
                    ORDER BY yd.birth_year
                )
                FROM yearly_data yd
                WHERE yd.trait_key = s.trait_key
            ),
            '[]'::jsonb
        ) AS yearly,
        jsonb_build_object(
            'mean', s.mean,
            'median', s.median,
            'min', s.min,
            'max', s.max,
            'sd', s.sd,
            'n', s.n
        ) AS stats
    FROM stats_data s
    ORDER BY s.trait_key;
END;
$$;

REVOKE ALL ON FUNCTION public.get_pta_trend_and_stats(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pta_trend_and_stats(uuid, text[]) TO authenticated;
