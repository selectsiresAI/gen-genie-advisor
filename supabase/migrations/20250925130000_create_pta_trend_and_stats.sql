-- RPC para tendências de PTA com estatísticas agregadas
CREATE OR REPLACE FUNCTION public.get_pta_trend_and_stats(target_farm_id uuid, trait_keys text[])
RETURNS TABLE (
    trait text,
    column_name text,
    yearly jsonb,
    stats jsonb
) AS $$
DECLARE
    trait_label text;
    resolved_column text;
    yearly_json jsonb;
    stats_json jsonb;
    trait_aliases jsonb := jsonb_build_object(
        'HHP$', 'hhp_dollar',
        'HHP$®', 'hhp_dollar',
        'HHP$', 'hhp_dollar',
        'HHP_DOLLAR', 'hhp_dollar',
        'PTA_HHPS', 'hhp_dollar',
        'pta_hhps', 'hhp_dollar',
        'NM$', 'nm_dollar',
        'NM$_DOLLAR', 'nm_dollar',
        'PTA_NMS', 'nm_dollar',
        'pta_nms', 'nm_dollar',
        'TPI', 'tpi',
        'PTA_TPI', 'tpi',
        'pta_tpi', 'tpi'
    );
BEGIN
    IF target_farm_id IS NULL THEN
        RETURN;
    END IF;

    IF trait_keys IS NULL OR array_length(trait_keys, 1) = 0 THEN
        RETURN;
    END IF;

    FOREACH trait_label IN ARRAY trait_keys LOOP
        resolved_column := COALESCE(
            trait_aliases ->> trait_label,
            trait_aliases ->> upper(trait_label),
            trait_label
        );

        IF resolved_column IS NULL THEN
            CONTINUE;
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'females_denorm'
              AND column_name = resolved_column
        ) THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'SELECT COALESCE(jsonb_agg(jsonb_build_object(
                ''year'', year,
                ''mean'', mean_value,
                ''n'', count_value
            ) ORDER BY year), ''[]''::jsonb)
             FROM (
                SELECT
                    EXTRACT(YEAR FROM birth_date)::int AS year,
                    AVG(%1$I)::numeric AS mean_value,
                    COUNT(%1$I)::int AS count_value
                FROM public.females_denorm
                WHERE farm_id = $1
                  AND birth_date IS NOT NULL
                  AND %1$I IS NOT NULL
                GROUP BY year
                ORDER BY year
             ) AS yearly_data',
            resolved_column
        ) INTO yearly_json
        USING target_farm_id;

        EXECUTE format(
            'SELECT jsonb_build_object(
                ''mean'', avg_val,
                ''median'', median_val,
                ''min'', min_val,
                ''max'', max_val,
                ''sd'', sd_val,
                ''n'', count_val
            )
             FROM (
                SELECT
                    AVG(%1$I)::numeric AS avg_val,
                    percentile_cont(0.5) WITHIN GROUP (ORDER BY %1$I)::numeric AS median_val,
                    MIN(%1$I)::numeric AS min_val,
                    MAX(%1$I)::numeric AS max_val,
                    stddev_pop(%1$I)::numeric AS sd_val,
                    COUNT(%1$I)::int AS count_val
                FROM public.females_denorm
                WHERE farm_id = $1
                  AND %1$I IS NOT NULL
             ) AS stats_row',
            resolved_column
        ) INTO stats_json
        USING target_farm_id;

        stats_json := COALESCE(stats_json, jsonb_build_object(
            'mean', NULL,
            'median', NULL,
            'min', NULL,
            'max', NULL,
            'sd', NULL,
            'n', 0
        ));

        RETURN NEXT (
            trait_label,
            resolved_column,
            COALESCE(yearly_json, '[]'::jsonb),
            stats_json
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_pta_trend_and_stats(uuid, text[]) TO authenticated;
