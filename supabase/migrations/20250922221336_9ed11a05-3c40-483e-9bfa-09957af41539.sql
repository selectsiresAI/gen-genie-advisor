-- Adicionar coluna 'company' (empresa) na tabela bulls
ALTER TABLE public.bulls 
ADD COLUMN company TEXT;

-- Adicionar coluna 'company' (empresa) na view bulls_denorm 
-- Primeiro vamos dropar a view se ela existir
DROP VIEW IF EXISTS public.bulls_denorm;

-- Recriar a view bulls_denorm com a nova coluna company
CREATE VIEW public.bulls_denorm AS
SELECT 
    b.*,
    -- Adicionar a nova coluna company da tabela bulls
    b.company
FROM public.bulls b;