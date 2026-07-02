
-- technical_glossary
CREATE TABLE IF NOT EXISTS public.technical_glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_key text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'general',
  pt_br text NOT NULL,
  en_us text,
  es text,
  description text,
  context text,
  is_translatable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.technical_glossary TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.technical_glossary TO authenticated;
GRANT ALL ON public.technical_glossary TO service_role;
ALTER TABLE public.technical_glossary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "glossary read all" ON public.technical_glossary;
CREATE POLICY "glossary read all" ON public.technical_glossary FOR SELECT USING (true);

DROP POLICY IF EXISTS "glossary admin write" ON public.technical_glossary;
CREATE POLICY "glossary admin write" ON public.technical_glossary FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_glossary_updated_at ON public.technical_glossary;
CREATE TRIGGER trg_glossary_updated_at BEFORE UPDATE ON public.technical_glossary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_activity_tracking
CREATE TABLE IF NOT EXISTS public.user_activity_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  total_session_time_seconds integer DEFAULT 0,
  pages_visited text[] DEFAULT ARRAY[]::text[],
  features_used text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_uat_user_id ON public.user_activity_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_uat_session_start ON public.user_activity_tracking(session_start DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_activity_tracking TO authenticated;
GRANT ALL ON public.user_activity_tracking TO service_role;
ALTER TABLE public.user_activity_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uat user manages own" ON public.user_activity_tracking;
CREATE POLICY "uat user manages own" ON public.user_activity_tracking FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_uat_updated_at ON public.user_activity_tracking;
CREATE TRIGGER trg_uat_updated_at BEFORE UPDATE ON public.user_activity_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';
