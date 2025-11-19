-- Corrige o erro do operador ~ em tipo date na função nx3_mothers_yearly_avg
-- Remove a validação regex que não funciona com tipo date
CREATE OR REPLACE FUNCTION public.nx3_mothers_yearly_avg(p_trait text, p_farm uuid)
RETURNS TABLE(birth_year integer, avg_value numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Valida que a trait é uma coluna numérica válida
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'females'
      AND column_name = p_trait
      AND data_type IN ('numeric', 'integer', 'double precision', 'real')
  ) THEN
    RAISE EXCEPTION 'Invalid trait: %', p_trait;
  END IF;

  -- Retorna a média anual
  -- Remove validação regex pois birth_date já é do tipo date
  RETURN QUERY EXECUTE format(
    'SELECT 
      EXTRACT(YEAR FROM birth_date)::integer AS birth_year,
      AVG(%I)::numeric AS avg_value
    FROM females
    WHERE farm_id = $1
      AND birth_date IS NOT NULL
      AND %I IS NOT NULL
    GROUP BY EXTRACT(YEAR FROM birth_date)
    ORDER BY birth_year',
    p_trait, p_trait
  ) USING p_farm;
END;
$$;