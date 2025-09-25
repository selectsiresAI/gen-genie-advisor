-- Create RPC to provide PTA yearly trends and summary statistics per farm
CREATE OR REPLACE FUNCTION public.get_pta_trend_and_stats(farm_id uuid, trait_keys text[])
RETURNS TABLE(trait_key text, yearly jsonb, stats jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trait text;
  yearly_result jsonb;
  stats_result jsonb;
BEGIN
  IF trait_keys IS NULL OR array_length(trait_keys, 1) IS NULL THEN
    RETURN;
  END IF;

  FOREACH trait IN ARRAY trait_keys LOOP
    EXECUTE format(
      'WITH data AS (
         SELECT
           EXTRACT(YEAR FROM birth_date)::int AS year,
           %1$I AS value
         FROM public.females_denorm
         WHERE farm_id = $1
           AND birth_date IS NOT NULL
           AND %1$I IS NOT NULL
       ),
       stats AS (
         SELECT
           COUNT(*)::int AS n,
           AVG(value)::numeric AS mean,
           MIN(value)::numeric AS min,
           MAX(value)::numeric AS max,
           CASE WHEN COUNT(*) > 0
             THEN percentile_cont(0.5) WITHIN GROUP (ORDER BY value)::numeric
             ELSE NULL END AS median,
           CASE WHEN COUNT(*) > 1
             THEN stddev_samp(value)::numeric
             ELSE 0::numeric END AS sd
         FROM data
       ),
       yearly AS (
         SELECT
           year,
           AVG(value)::numeric AS mean,
           COUNT(*)::int AS n
         FROM data
         GROUP BY year
         ORDER BY year
       )
       SELECT
         COALESCE(
           (SELECT jsonb_agg(jsonb_build_object(''year'', year, ''mean'', mean, ''n'', n) ORDER BY year) FROM yearly),
           ''[]''::jsonb
         ) AS yearly,
         jsonb_build_object(
           ''mean'', (SELECT mean FROM stats),
           ''median'', (SELECT median FROM stats),
           ''min'', (SELECT min FROM stats),
           ''max'', (SELECT max FROM stats),
           ''sd'', COALESCE((SELECT sd FROM stats), 0),
           ''n'', COALESCE((SELECT n FROM stats), 0)
         ) AS stats',
      trait
    )
    INTO yearly_result, stats_result
    USING farm_id;

    RETURN QUERY
    SELECT trait, COALESCE(yearly_result, '[]'::jsonb), COALESCE(stats_result, jsonb_build_object(
      'mean', NULL,
      'median', NULL,
      'min', NULL,
      'max', NULL,
      'sd', 0,
      'n', 0
    ));
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pta_trend_and_stats(uuid, text[]) TO authenticated;
