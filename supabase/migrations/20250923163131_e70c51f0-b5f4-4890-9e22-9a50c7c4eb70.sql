-- Fix critical security vulnerability: Enable RLS on exposed denormalized tables
-- and create proper access policies restricting data to farm members only

-- Enable RLS on bulls_denorm table
ALTER TABLE public.bulls_denorm ENABLE ROW LEVEL SECURITY;

-- Enable RLS on females_denorm table  
ALTER TABLE public.females_denorm ENABLE ROW LEVEL SECURITY;

-- Enable RLS on farm_dashboard_kpis table
ALTER TABLE public.farm_dashboard_kpis ENABLE ROW LEVEL SECURITY;

-- Enable RLS on semen_inventory table
ALTER TABLE public.semen_inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for bulls_denorm - authenticated users can view all bulls
-- (bulls are generally public genetic information)
CREATE POLICY "Authenticated users can view bulls denorm data" 
ON public.bulls_denorm 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create RLS policy for females_denorm - only farm members can view
CREATE POLICY "Farm members can view females denorm data" 
ON public.females_denorm 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND farm_id IS NOT NULL 
  AND public.is_farm_member(farm_id)
);

-- Create RLS policy for farm_dashboard_kpis - only farm members can view
CREATE POLICY "Farm members can view dashboard KPIs" 
ON public.farm_dashboard_kpis 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND farm_id IS NOT NULL 
  AND public.is_farm_member(farm_id)
);

-- Create RLS policy for semen_inventory - only farm members can view
CREATE POLICY "Farm members can view semen inventory" 
ON public.semen_inventory 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND farm_id IS NOT NULL 
  AND public.is_farm_member(farm_id)
);