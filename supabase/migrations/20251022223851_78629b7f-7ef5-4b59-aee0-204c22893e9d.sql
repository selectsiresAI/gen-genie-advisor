-- Corrigir RLS policies para user_activity_tracking
-- Garantir que authenticated users possam inserir e atualizar seus próprios dados

-- Remover policies antigas
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activity_tracking;
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity_tracking;
DROP POLICY IF EXISTS "Users can update their own activity" ON public.user_activity_tracking;

-- Forçar RLS
ALTER TABLE public.user_activity_tracking FORCE ROW LEVEL SECURITY;

-- Policy de INSERT com auth.uid()
CREATE POLICY "Users can insert their own activity"
  ON public.user_activity_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy de SELECT
CREATE POLICY "Users can view their own activity"
  ON public.user_activity_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy de UPDATE
CREATE POLICY "Users can update their own activity"
  ON public.user_activity_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy de DELETE
CREATE POLICY "Users can delete their own activity"
  ON public.user_activity_tracking FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);