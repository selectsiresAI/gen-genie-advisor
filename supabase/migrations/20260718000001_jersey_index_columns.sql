-- ============================================================================
-- Jersey-specific index columns (Camada 2 / schema)
-- ----------------------------------------------------------------------------
-- JPI = Jersey Performance Index (equivalente ao GTPI do Holstein)
-- JUI = Jersey Udder Index       (equivalente ao UDC do Holstein)
-- Colunas dedicadas: Jersey preenche; Holstein fica null. O front exibe
-- JPI/JUI para JE e GTPI/UDC para HO (swap por raça). Ingest mapeia os headers.
-- Aditivo — não altera comportamento existente.
-- ============================================================================
alter table public.females add column if not exists jpi numeric;
alter table public.females add column if not exists jui numeric;
alter table public.bulls   add column if not exists jpi numeric;
alter table public.bulls   add column if not exists jui numeric;
