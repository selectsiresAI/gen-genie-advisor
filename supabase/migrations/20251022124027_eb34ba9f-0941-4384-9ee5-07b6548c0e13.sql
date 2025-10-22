-- Tabela de tickets de suporte
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'other')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de reportes de erro
CREATE TABLE IF NOT EXISTS public.error_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  url TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'fixed', 'closed')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de pesquisas de satisfação
CREATE TABLE IF NOT EXISTS public.satisfaction_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  appearance_rating INTEGER NOT NULL CHECK (appearance_rating >= 1 AND appearance_rating <= 5),
  charts_rating INTEGER NOT NULL CHECK (charts_rating >= 1 AND charts_rating <= 5),
  clarity_rating INTEGER NOT NULL CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
  feedback TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_status ON public.error_reports(status);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON public.error_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_created_at ON public.satisfaction_surveys(created_at DESC);

-- RLS Policies
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- Usuários podem criar seus próprios tickets
CREATE POLICY "Users can create their own support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (true);

-- Usuários podem ver seus próprios tickets
CREATE POLICY "Users can view their own support tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Usuários podem criar reportes de erro
CREATE POLICY "Users can create error reports"
  ON public.error_reports FOR INSERT
  WITH CHECK (true);

-- Usuários podem ver seus próprios reportes
CREATE POLICY "Users can view their own error reports"
  ON public.error_reports FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Usuários podem criar pesquisas de satisfação
CREATE POLICY "Users can create satisfaction surveys"
  ON public.satisfaction_surveys FOR INSERT
  WITH CHECK (true);

-- Usuários podem ver suas próprias pesquisas
CREATE POLICY "Users can view their own surveys"
  ON public.satisfaction_surveys FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Trigger para atualizar updated_at em support_tickets
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();