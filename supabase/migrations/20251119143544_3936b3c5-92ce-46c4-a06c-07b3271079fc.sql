-- Atualiza função para listar TODAS as PTAs numéricas disponíveis na tabela females
CREATE OR REPLACE FUNCTION public.nx3_list_pta_traits()
RETURNS TABLE(trait text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT column_name::text
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'females'
    AND column_name IN (
      'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar',
      'f_sav', 'ptam', 'cfp', 'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct',
      'pl', 'dpr', 'liv', 'scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf',
      'ptat', 'udc', 'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv',
      'ccr', 'hcr', 'fi', 'gl', 'efc', 'bwc', 'sta', 'str', 'dfm', 'rua',
      'rls', 'rtp', 'ftl', 'rw', 'rlr', 'fta', 'fls', 'fua',
      'ruh', 'ruw', 'ucl', 'udp', 'ftp', 'rfi', 'gfi'
    )
    AND data_type IN ('numeric', 'integer', 'double precision', 'real')
  ORDER BY column_name;
END;
$$;

-- Garante que a função nx3_mothers_yearly_avg aceita qualquer PTA válida
CREATE OR REPLACE FUNCTION public.nx3_mothers_yearly_avg(
  p_trait text,
  p_farm uuid
)
RETURNS TABLE(birth_year integer, avg_value numeric)
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Retorna a média anual usando SQL dinâmico
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

-- Garante que a função nx3_bulls_lookup aceita qualquer PTA válida
CREATE OR REPLACE FUNCTION public.nx3_bulls_lookup(
  p_trait text,
  p_query text
)
RETURNS TABLE(
  id uuid,
  code text,
  name text,
  trait_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Valida que a trait é uma coluna numérica válida
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bulls'
      AND column_name = p_trait
      AND data_type IN ('numeric', 'integer', 'double precision', 'real')
  ) THEN
    RAISE EXCEPTION 'Invalid trait: %', p_trait;
  END IF;

  -- Busca touros usando SQL dinâmico
  RETURN QUERY EXECUTE format(
    'SELECT 
      b.id,
      b.code,
      b.name,
      b.%I::numeric AS trait_value
    FROM bulls b
    WHERE (
      b.code ILIKE $1
      OR b.name ILIKE $1
      OR b.code_normalized ILIKE $1
    )
    AND b.%I IS NOT NULL
    ORDER BY b.code
    LIMIT 50',
    p_trait, p_trait
  ) USING '%' || p_query || '%';
END;
$$;