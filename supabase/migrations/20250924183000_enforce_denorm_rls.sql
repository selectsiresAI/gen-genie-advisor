-- Enforce RLS on denormalized farm data tables and restrict access to farm members
DO $$
BEGIN
    -- bulls_denorm
    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.bulls_denorm'::regclass
          AND relkind IN ('r', 'm')
    ) THEN
        EXECUTE 'ALTER TABLE public.bulls_denorm ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE public.bulls_denorm FORCE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view bulls denorm" ON public.bulls_denorm';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view bulls denorm data" ON public.bulls_denorm';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can view bulls_denorm" ON public.bulls_denorm';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can access bulls_denorm" ON public.bulls_denorm';
        EXECUTE $$CREATE POLICY "Farm members can access bulls_denorm" ON public.bulls_denorm
            FOR SELECT
            USING (
                auth.uid() IS NOT NULL
                AND farm_id IS NOT NULL
                AND public.is_farm_member(farm_id)
            )$$;
    END IF;

    -- females_denorm
    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.females_denorm'::regclass
          AND relkind IN ('r', 'm')
    ) THEN
        EXECUTE 'ALTER TABLE public.females_denorm ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE public.females_denorm FORCE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can view females denorm" ON public.females_denorm';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can view females denorm data" ON public.females_denorm';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can access females_denorm" ON public.females_denorm';
        EXECUTE $$CREATE POLICY "Farm members can access females_denorm" ON public.females_denorm
            FOR SELECT
            USING (
                auth.uid() IS NOT NULL
                AND farm_id IS NOT NULL
                AND public.is_farm_member(farm_id)
            )$$;
    END IF;

    -- farm_dashboard_kpis
    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.farm_dashboard_kpis'::regclass
          AND relkind IN ('r', 'm')
    ) THEN
        EXECUTE 'ALTER TABLE public.farm_dashboard_kpis ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE public.farm_dashboard_kpis FORCE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can view dashboard kpis" ON public.farm_dashboard_kpis';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can view dashboard KPIs" ON public.farm_dashboard_kpis';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can access farm_dashboard_kpis" ON public.farm_dashboard_kpis';
        EXECUTE $$CREATE POLICY "Farm members can access farm_dashboard_kpis" ON public.farm_dashboard_kpis
            FOR SELECT
            USING (
                auth.uid() IS NOT NULL
                AND farm_id IS NOT NULL
                AND public.is_farm_member(farm_id)
            )$$;
    END IF;

    -- semen_inventory
    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.semen_inventory'::regclass
          AND relkind IN ('r', 'm')
    ) THEN
        EXECUTE 'ALTER TABLE public.semen_inventory ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE public.semen_inventory FORCE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can view semen inventory" ON public.semen_inventory';
        EXECUTE 'DROP POLICY IF EXISTS "Farm members can access semen_inventory" ON public.semen_inventory';
        EXECUTE $$CREATE POLICY "Farm members can access semen_inventory" ON public.semen_inventory
            FOR SELECT
            USING (
                auth.uid() IS NOT NULL
                AND farm_id IS NOT NULL
                AND public.is_farm_member(farm_id)
            )$$;
    END IF;
END;
$$;
