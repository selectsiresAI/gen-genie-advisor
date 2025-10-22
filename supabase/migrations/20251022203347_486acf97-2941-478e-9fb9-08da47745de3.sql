-- Adicionar policy WITH CHECK para survey_dismissals
DROP POLICY IF EXISTS "Users can manage their own dismissals" ON public.survey_dismissals;

CREATE POLICY "Users can insert their own dismissals"
  ON public.survey_dismissals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dismissals"
  ON public.survey_dismissals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own dismissals"
  ON public.survey_dismissals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dismissals"
  ON public.survey_dismissals FOR DELETE
  USING (auth.uid() = user_id);