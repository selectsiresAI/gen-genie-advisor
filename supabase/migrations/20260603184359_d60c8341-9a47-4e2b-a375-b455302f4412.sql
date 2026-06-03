CREATE TABLE IF NOT EXISTS public.nexus3_user_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'shared',
  selected_traits jsonb NOT NULL DEFAULT '[]'::jsonb,
  shared_bulls jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexus3_user_packages TO authenticated;
GRANT ALL ON public.nexus3_user_packages TO service_role;

ALTER TABLE public.nexus3_user_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nexus3_packages: own access"
  ON public.nexus3_user_packages
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.nexus3_user_packages_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nexus3_user_packages_touch ON public.nexus3_user_packages;
CREATE TRIGGER trg_nexus3_user_packages_touch
  BEFORE UPDATE ON public.nexus3_user_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.nexus3_user_packages_touch_updated_at();
