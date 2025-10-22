-- Criar tabela de rastreamento de atividade dos usuários
CREATE TABLE IF NOT EXISTS public.user_activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  pages_visited TEXT[] DEFAULT '{}',
  features_used TEXT[] DEFAULT '{}',
  total_session_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity_tracking(created_at DESC);

-- RLS para user_activity_tracking
ALTER TABLE public.user_activity_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own activity"
  ON public.user_activity_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity"
  ON public.user_activity_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity"
  ON public.user_activity_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Criar tabela de histórico de dispensas da survey
CREATE TABLE IF NOT EXISTS public.survey_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissal_count INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_dismissals_user_id ON public.survey_dismissals(user_id);

-- RLS para survey_dismissals
ALTER TABLE public.survey_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own dismissals"
  ON public.survey_dismissals FOR ALL
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_activity_tracking_updated_at
  BEFORE UPDATE ON public.user_activity_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_activity_updated_at();