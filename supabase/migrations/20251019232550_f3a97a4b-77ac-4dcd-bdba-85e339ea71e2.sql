-- Adicionar colunas necessárias em profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Preencher email dos profiles existentes a partir de auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Adicionar coluna imported_at em staging_profiles
ALTER TABLE public.staging_profiles 
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;

-- Criar índices para performance do matching
CREATE INDEX IF NOT EXISTS idx_staging_profiles_email 
  ON public.staging_profiles(email);
  
CREATE INDEX IF NOT EXISTS idx_staging_profiles_raw_id 
  ON public.staging_profiles(raw_id);

CREATE INDEX IF NOT EXISTS idx_staging_farms_raw_id 
  ON public.staging_farms(raw_id);
  
CREATE INDEX IF NOT EXISTS idx_staging_farms_name 
  ON public.staging_farms(name);

CREATE INDEX IF NOT EXISTS idx_staging_females_farm_id 
  ON public.staging_females(farm_id);
  
CREATE INDEX IF NOT EXISTS idx_staging_females_cdcb_id 
  ON public.staging_females(cdcb_id);
  
CREATE INDEX IF NOT EXISTS idx_staging_females_identifier 
  ON public.staging_females(identifier);

-- Índices nas tabelas de produção para matching rápido
CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_farms_name 
  ON public.farms(name);
  
CREATE INDEX IF NOT EXISTS idx_farms_owner_name 
  ON public.farms(owner_name);

CREATE INDEX IF NOT EXISTS idx_females_cdcb_id 
  ON public.females(cdcb_id);
  
CREATE INDEX IF NOT EXISTS idx_females_identifier 
  ON public.females(identifier);
  
CREATE INDEX IF NOT EXISTS idx_females_farm_id 
  ON public.females(farm_id);

-- Criar tabela de log de importação de staging
CREATE TABLE IF NOT EXISTS public.staging_import_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  executed_by UUID REFERENCES auth.users(id),
  
  -- Estatísticas de profiles
  profiles_inserted INTEGER DEFAULT 0,
  profiles_updated INTEGER DEFAULT 0,
  profiles_errors INTEGER DEFAULT 0,
  
  -- Estatísticas de farms
  farms_inserted INTEGER DEFAULT 0,
  farms_updated INTEGER DEFAULT 0,
  farms_errors INTEGER DEFAULT 0,
  
  -- Estatísticas de females
  females_inserted INTEGER DEFAULT 0,
  females_updated INTEGER DEFAULT 0,
  females_errors INTEGER DEFAULT 0,
  
  -- Metadados e erros
  strategy_used TEXT,
  error_details JSONB DEFAULT '[]'::jsonb,
  summary JSONB DEFAULT '{}'::jsonb,
  
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial'))
);

-- RLS para staging_import_log
ALTER TABLE public.staging_import_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own import logs"
  ON public.staging_import_log FOR SELECT
  USING (executed_by = auth.uid() OR is_admin());

CREATE POLICY "Authenticated users can create import logs"
  ON public.staging_import_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own import logs"
  ON public.staging_import_log FOR UPDATE
  USING (executed_by = auth.uid() OR is_admin());