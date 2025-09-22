-- Corrigir a view bulls_denorm
DROP VIEW IF EXISTS public.bulls_denorm;

-- Recriar a view bulls_denorm (a coluna company já está incluída em b.*)
CREATE VIEW public.bulls_denorm AS
SELECT b.* FROM public.bulls b;