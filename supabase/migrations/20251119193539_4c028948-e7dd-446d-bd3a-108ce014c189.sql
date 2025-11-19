-- Corrige a função nx3_mothers_yearly_avg para fazer cast explícito de birth_date
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

  -- Retorna a média anual usando SQL dinâmico com cast explícito para birth_date
  RETURN QUERY EXECUTE format(
    'SELECT 
      EXTRACT(YEAR FROM birth_date::date)::integer AS birth_year,
      AVG(%I)::numeric AS avg_value
    FROM females
    WHERE farm_id = $1
      AND birth_date IS NOT NULL
      AND birth_date ~ ''^[0-9]{4}-[0-9]{2}-[0-9]{2}''
      AND %I IS NOT NULL
    GROUP BY EXTRACT(YEAR FROM birth_date::date)
    ORDER BY birth_year',
    p_trait, p_trait
  ) USING p_farm;
END;
$$;