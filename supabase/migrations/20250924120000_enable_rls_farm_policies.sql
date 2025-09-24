-- Ensure farm-scoped Row Level Security for denormalized tables

-- Enable and enforce RLS on bulls_denorm
ALTER TABLE public.bulls_denorm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulls_denorm FORCE ROW LEVEL SECURITY;

-- Remove outdated policies for bulls_denorm
DROP POLICY IF EXISTS "Authenticated users can view bulls denorm" ON public.bulls_denorm;
DROP POLICY IF EXISTS "Authenticated users can view bulls denorm data" ON public.bulls_denorm;

-- Allow only authenticated members of the corresponding farm
CREATE POLICY "Farm members can access bulls_denorm"
ON public.bulls_denorm
FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND farm_id IS NOT NULL
    AND public.is_farm_member(farm_id)
);

-- Enable and enforce RLS on females_denorm
ALTER TABLE public.females_denorm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.females_denorm FORCE ROW LEVEL SECURITY;

-- Remove outdated policies for females_denorm
DROP POLICY IF EXISTS "Farm members can view females denorm" ON public.females_denorm;
DROP POLICY IF EXISTS "Farm members can view females denorm data" ON public.females_denorm;

-- Allow only authenticated members of the corresponding farm
CREATE POLICY "Farm members can access females_denorm"
ON public.females_denorm
FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND farm_id IS NOT NULL
    AND public.is_farm_member(farm_id)
);

-- Enable and enforce RLS on farm_dashboard_kpis
ALTER TABLE public.farm_dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_dashboard_kpis FORCE ROW LEVEL SECURITY;

-- Remove outdated policies for farm_dashboard_kpis
DROP POLICY IF EXISTS "Farm members can view dashboard kpis" ON public.farm_dashboard_kpis;
DROP POLICY IF EXISTS "Farm members can view dashboard KPIs" ON public.farm_dashboard_kpis;

-- Allow only authenticated members of the corresponding farm
CREATE POLICY "Farm members can access farm_dashboard_kpis"
ON public.farm_dashboard_kpis
FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND farm_id IS NOT NULL
    AND public.is_farm_member(farm_id)
);

-- Enable and enforce RLS on semen_inventory
ALTER TABLE public.semen_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semen_inventory FORCE ROW LEVEL SECURITY;

-- Remove outdated policies for semen_inventory
DROP POLICY IF EXISTS "Farm members can view semen inventory" ON public.semen_inventory;

-- Allow only authenticated members of the corresponding farm
CREATE POLICY "Farm members can access semen_inventory"
ON public.semen_inventory
FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND farm_id IS NOT NULL
    AND public.is_farm_member(farm_id)
);
