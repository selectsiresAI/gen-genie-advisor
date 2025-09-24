-- Ensure Row Level Security is enforced on farm-scoped denormalized tables
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.bulls_denorm'::regclass
          AND relkind IN ('r', 'm')
    ) THEN
        EXECUTE 'ALTER TABLE public.bulls_denorm ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE public.bulls_denorm FORCE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can access bulls_denorm" ON public.bulls_denorm';
        EXECUTE 'CREATE POLICY "Farm members can access bulls_denorm" ON public.bulls_denorm FOR SELECT USING (auth.uid() IS NOT NULL AND farm_id IS NOT NULL AND public.is_farm_member(farm_id))';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.females_denorm'::regclass
          AND relkind IN ('r', 'm')
    ) THEN
        EXECUTE 'ALTER TABLE public.females_denorm ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE public.females_denorm FORCE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can access females_denorm" ON public.females_denorm';
        EXECUTE 'CREATE POLICY "Farm members can access females_denorm" ON public.females_denorm FOR SELECT USING (auth.uid() IS NOT NULL AND farm_id IS NOT NULL AND public.is_farm_member(farm_id))';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.farm_dashboard_kpis'::regclass
          AND relkind IN ('r', 'm')
    ) THEN
        EXECUTE 'ALTER TABLE public.farm_dashboard_kpis ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE public.farm_dashboard_kpis FORCE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can access farm_dashboard_kpis" ON public.farm_dashboard_kpis';
        EXECUTE 'CREATE POLICY "Farm members can access farm_dashboard_kpis" ON public.farm_dashboard_kpis FOR SELECT USING (auth.uid() IS NOT NULL AND farm_id IS NOT NULL AND public.is_farm_member(farm_id))';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.semen_inventory'::regclass
          AND relkind IN ('r', 'm')
    ) THEN
        EXECUTE 'ALTER TABLE public.semen_inventory ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE public.semen_inventory FORCE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can access semen_inventory" ON public.semen_inventory';
        EXECUTE 'CREATE POLICY "Farm members can access semen_inventory" ON public.semen_inventory FOR SELECT USING (auth.uid() IS NOT NULL AND farm_id IS NOT NULL AND public.is_farm_member(farm_id))';
    END IF;
END;
$$;
