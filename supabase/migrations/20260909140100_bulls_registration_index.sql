-- Achado na revisao visual (Lista do Rebanho SSGEN Client): find_bulls_smart_batch
-- estourava statement_timeout (9s) num lote real de 48 codigos de pedigree.
-- Causa raiz: bulls.registration NAO tinha indice - EXPLAIN ANALYZE mostrou
-- Parallel Seq Scan de 7.2s por lookup (299k linhas). Com varios codigos sem
-- alias caindo nesse passo dentro do loop, a soma estourava o timeout.
CREATE INDEX IF NOT EXISTS idx_bulls_registration_upper ON public.bulls (upper(registration));
