-- Criar tabela de definições de tutoriais
CREATE TABLE IF NOT EXISTS public.tutorial_defs (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de passos dos tutoriais
CREATE TABLE IF NOT EXISTS public.tutorial_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_slug TEXT NOT NULL REFERENCES public.tutorial_defs(slug) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  anchor TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  next_label TEXT,
  prev_label TEXT,
  done_label TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tutorial_slug, step_order)
);

-- Criar tabela de progresso do usuário
CREATE TABLE IF NOT EXISTS public.tutorial_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  tutorial_slug TEXT NOT NULL REFERENCES public.tutorial_defs(slug) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tenant_id, tutorial_slug)
);

-- Habilitar RLS
ALTER TABLE public.tutorial_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_user_progress ENABLE ROW LEVEL SECURITY;

-- Políticas para tutorial_defs (todos podem ler tutoriais habilitados)
CREATE POLICY "Todos podem ver tutoriais habilitados"
  ON public.tutorial_defs FOR SELECT
  USING (is_enabled = true);

-- Políticas para tutorial_steps (todos podem ler passos de tutoriais habilitados)
CREATE POLICY "Todos podem ver passos de tutoriais habilitados"
  ON public.tutorial_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tutorial_defs 
      WHERE slug = tutorial_steps.tutorial_slug 
      AND is_enabled = true
    )
  );

-- Políticas para tutorial_user_progress (usuários podem ver e gerenciar seu próprio progresso)
CREATE POLICY "Usuários podem ver seu próprio progresso"
  ON public.tutorial_user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seu próprio progresso"
  ON public.tutorial_user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso"
  ON public.tutorial_user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Inserir tutorial de exemplo para a home
INSERT INTO public.tutorial_defs (slug, title, is_enabled)
VALUES ('home-tour', 'Tour pela Home', true)
ON CONFLICT (slug) DO UPDATE 
SET is_enabled = true;

-- Inserir passos do tutorial da home
INSERT INTO public.tutorial_steps (tutorial_slug, step_order, anchor, headline, body, next_label)
VALUES 
  ('home-tour', 0, 'home:fazendas', 'Suas Fazendas', 'Aqui você vê todas as fazendas que você tem acesso. Clique em uma para gerenciar o rebanho.', 'Próximo'),
  ('home-tour', 1, 'home:criar', 'Criar Nova Fazenda', 'Use este botão para criar uma nova fazenda e começar a gerenciar seu rebanho.', 'Próximo'),
  ('home-tour', 2, 'home:resumo', 'Resumo da Conta', 'Aqui você vê estatísticas gerais da sua conta: total de fazendas, animais e touros selecionados.', 'Concluir')
ON CONFLICT (tutorial_slug, step_order) DO UPDATE
SET 
  anchor = EXCLUDED.anchor,
  headline = EXCLUDED.headline,
  body = EXCLUDED.body,
  next_label = EXCLUDED.next_label;