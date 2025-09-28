-- Verifique duplicatas (apenas log; dev usa manual/SQL próprio se existir)
-- select farm_id, cdcb_id, count(*) from public.females group by farm_id, cdcb_id having count(*) > 1;

-- Índice único requerido pelo onConflict do importador
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS females_farm_cdcb_key
  ON public.females (farm_id, cdcb_id);
