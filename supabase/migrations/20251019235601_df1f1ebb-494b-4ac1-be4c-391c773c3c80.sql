-- Adicionar coluna para mapear staging_farms → farms
ALTER TABLE public.farms 
ADD COLUMN IF NOT EXISTS staging_raw_id TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_farms_staging_raw_id 
ON public.farms(staging_raw_id);

-- Popular staging_raw_id nas farms que vieram da migração
UPDATE public.farms f
SET staging_raw_id = sf.raw_id
FROM public.staging_farms sf
WHERE LOWER(TRIM(f.name)) = LOWER(TRIM(sf.name))
  AND LOWER(TRIM(f.owner_name)) = LOWER(TRIM(sf.owner_name))
  AND f.staging_raw_id IS NULL;