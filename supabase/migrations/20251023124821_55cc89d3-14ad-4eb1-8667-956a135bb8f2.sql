-- Criar tabela de satisfaction_surveys se não existir
CREATE TABLE IF NOT EXISTS public.satisfaction_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  appearance_rating INTEGER NOT NULL CHECK (appearance_rating >= 1 AND appearance_rating <= 5),
  charts_rating INTEGER NOT NULL CHECK (charts_rating >= 1 AND charts_rating <= 5),
  clarity_rating INTEGER NOT NULL CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de survey_dismissals se não existir
CREATE TABLE IF NOT EXISTS public.survey_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  dismissal_count INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de user_activity_tracking se não existir
CREATE TABLE IF NOT EXISTS public.user_activity_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  total_session_time_seconds INTEGER DEFAULT 0,
  pages_visited TEXT[] DEFAULT '{}',
  features_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas para satisfaction_surveys
CREATE POLICY "Usuários podem criar avaliações"
  ON public.satisfaction_surveys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Usuários podem ver suas próprias avaliações"
  ON public.satisfaction_surveys
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins podem ver todas as avaliações"
  ON public.satisfaction_surveys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Políticas para survey_dismissals
CREATE POLICY "Usuários podem criar dismissals"
  ON public.survey_dismissals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus dismissals"
  ON public.survey_dismissals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas para user_activity_tracking
CREATE POLICY "Usuários podem criar sessões"
  ON public.user_activity_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas sessões"
  ON public.user_activity_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver suas sessões"
  ON public.user_activity_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todas as sessões"
  ON public.user_activity_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_user_id ON public.satisfaction_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_created_at ON public.satisfaction_surveys(created_at);
CREATE INDEX IF NOT EXISTS idx_survey_dismissals_user_id ON public.survey_dismissals(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_tracking_user_id ON public.user_activity_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_tracking_session_start ON public.user_activity_tracking(session_start);

-- Criar view para métricas agregadas de usuários
CREATE OR REPLACE VIEW public.user_engagement_metrics AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  p.created_at as user_since,
  
  -- Contagem de fazendas
  COUNT(DISTINCT uf.farm_id) as total_farms,
  
  -- Contagem de sessões e tempo total
  COUNT(DISTINCT uat.id) as total_sessions,
  COALESCE(SUM(uat.total_session_time_seconds), 0) as total_time_seconds,
  
  -- Páginas únicas visitadas (união de todas as sessões)
  COUNT(DISTINCT elem) FILTER (WHERE elem IS NOT NULL) as unique_pages_visited,
  
  -- Funcionalidades únicas usadas
  COUNT(DISTINCT feat) FILTER (WHERE feat IS NOT NULL) as unique_features_used,
  
  -- Predições feitas
  COUNT(DISTINCT gp.id) as predictions_made,
  
  -- Última atividade
  MAX(uat.session_start) as last_activity,
  
  -- Avaliações enviadas
  COUNT(DISTINCT ss.id) as surveys_completed
  
FROM profiles p
LEFT JOIN user_farms uf ON uf.user_id = p.id
LEFT JOIN user_activity_tracking uat ON uat.user_id = p.id
LEFT JOIN genetic_predictions gp ON gp.farm_id = uf.farm_id
LEFT JOIN satisfaction_surveys ss ON ss.user_id = p.id
LEFT JOIN LATERAL unnest(uat.pages_visited) as elem ON true
LEFT JOIN LATERAL unnest(uat.features_used) as feat ON true
GROUP BY p.id, p.full_name, p.email, p.created_at;

-- Permissão para admins verem as métricas
GRANT SELECT ON public.user_engagement_metrics TO authenticated;