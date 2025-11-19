-- Corrige função nx3_list_pta_traits para resolver erro de ORDER BY com DISTINCT
CREATE OR REPLACE FUNCTION public.nx3_list_pta_traits()
RETURNS TABLE(trait text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH ordered_traits AS (
    SELECT DISTINCT 
      column_name::text as trait_name,
      CASE column_name
        WHEN 'hhp_dollar' THEN 1
        WHEN 'tpi' THEN 2
        WHEN 'nm_dollar' THEN 3
        WHEN 'cm_dollar' THEN 4
        WHEN 'fm_dollar' THEN 5
        WHEN 'gm_dollar' THEN 6
        WHEN 'f_sav' THEN 7
        WHEN 'ptam' THEN 8
        WHEN 'cfp' THEN 9
        WHEN 'ptaf' THEN 10
        WHEN 'ptaf_pct' THEN 11
        WHEN 'ptap' THEN 12
        WHEN 'ptap_pct' THEN 13
        WHEN 'pl' THEN 14
        WHEN 'dpr' THEN 15
        WHEN 'liv' THEN 16
        WHEN 'scs' THEN 17
        WHEN 'mast' THEN 18
        WHEN 'met' THEN 19
        WHEN 'rp' THEN 20
        WHEN 'da' THEN 21
        WHEN 'ket' THEN 22
        WHEN 'mf' THEN 23
        WHEN 'ptat' THEN 24
        WHEN 'udc' THEN 25
        WHEN 'flc' THEN 26
        WHEN 'sce' THEN 27
        WHEN 'dce' THEN 28
        WHEN 'ssb' THEN 29
        WHEN 'dsb' THEN 30
        WHEN 'h_liv' THEN 31
        WHEN 'ccr' THEN 32
        WHEN 'hcr' THEN 33
        WHEN 'fi' THEN 34
        WHEN 'gl' THEN 35
        WHEN 'bwc' THEN 36
        WHEN 'sta' THEN 37
        WHEN 'str' THEN 38
        WHEN 'dfm' THEN 39
        WHEN 'rua' THEN 40
        WHEN 'rls' THEN 41
        WHEN 'rtp' THEN 42
        WHEN 'ftl' THEN 43
        WHEN 'rw' THEN 44
        WHEN 'rlr' THEN 45
        WHEN 'fta' THEN 46
        WHEN 'fls' THEN 47
        WHEN 'fua' THEN 48
        WHEN 'ruh' THEN 49
        WHEN 'ruw' THEN 50
        WHEN 'ucl' THEN 51
        WHEN 'udp' THEN 52
        WHEN 'ftp' THEN 53
        WHEN 'rfi' THEN 54
        WHEN 'gfi' THEN 55
        WHEN 'efc' THEN 56
        ELSE 999
      END as sort_order
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
  )
  SELECT trait_name
  FROM ordered_traits
  ORDER BY sort_order;
END;
$$;