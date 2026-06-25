
CREATE OR REPLACE VIEW public.females_public_by_farm_view AS
SELECT * FROM public.females_denorm;

GRANT SELECT ON public.females_public_by_farm_view TO authenticated;
GRANT ALL ON public.females_public_by_farm_view TO service_role;
